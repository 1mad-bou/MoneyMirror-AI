import re
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Tuple

from api.core.money import normalize_currency, quantize, to_decimal
from api.public.categories.crud import suggest_category_name
from api.public.receipts.models import ReceiptDraft, ReceiptItem

CURRENCY_SYMBOLS: dict[str, str] = {
    "MAD": "MAD",
    "DH": "MAD",
    "DHS": "MAD",
    "DIRHAM": "MAD",
    "DIRHAMS": "MAD",
    "$": "USD",
    "USD": "USD",
    "€": "EUR",
    "EUR": "EUR",
    "£": "GBP",
    "GBP": "GBP",
}

DATE_PATTERNS = [
    r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})",  # YYYY-MM-DD
    r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})",  # DD-MM-YYYY or MM-DD-YYYY
    r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})",    # DD-MM-YY
]


def parse_date(text: str) -> Optional[date]:
    for pat in DATE_PATTERNS:
        match = re.search(pat, text)
        if match:
            g = match.groups()
            try:
                if len(g[0]) == 4:
                    return date(int(g[0]), int(g[1]), int(g[2]))
                elif len(g[2]) == 4:
                    day_first = int(g[0])
                    month_first = int(g[1])
                    if day_first > 12:
                        return date(int(g[2]), month_first, day_first)
                    return date(int(g[2]), month_first, day_first)
                else:
                    year = 2000 + int(g[2])
                    return date(year, int(g[1]), int(g[0]))
            except ValueError:
                continue
    return None


def extract_receipt_fields(lines: List[str], default_currency: str = "MAD") -> ReceiptDraft:
    full_text = "\n".join(lines)
    clean_lines = [l.strip() for l in lines if l.strip()]

    merchant: Optional[str] = None
    tx_date: Optional[date] = None
    total_amount: Optional[Decimal] = None
    currency: str = default_currency
    subtotal: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    items: List[ReceiptItem] = []
    warnings: List[str] = []

    # 1. Currency detection
    for token, curr in CURRENCY_SYMBOLS.items():
        if re.search(r"(?<!\w)" + re.escape(token) + r"(?!\w)", full_text, re.IGNORECASE):
            currency = curr
            break

    # 2. Date detection
    tx_date = parse_date(full_text)
    if not tx_date:
        warnings.append("Date could not be determined with certainty. Please verify.")

    # 3. Merchant detection (often top 1-3 lines)
    for line in clean_lines[:4]:
        # Filter out lines that look like numbers, dates, or headers
        if len(line) > 2 and not re.search(r"^\d+$|^ticket|^facture|^receipt|^date", line, re.IGNORECASE):
            merchant = line[:60].strip()
            break

    # 4. Total Amount detection
    # Look for keywords: TOTAL, NET, A PAYER, MONTANT, AMOUNT
    total_candidates: List[Decimal] = []
    amount_regex = r"(?:(?:TOTAL|NET|A\s*PAYER|MONTANT|PAYE|DUE|AMOUNT)[\s:]*)?([0-9]{1,6}(?:[.,][0-9]{2}))"

    for line in reversed(clean_lines):
        line_upper = line.upper()
        if any(kw in line_upper for kw in ["TOTAL", "NET", "A PAYER", "MONTANT", "PAYE", "DUE"]):
            match = re.search(r"([0-9]{1,6}(?:[.,][0-9]{2}))", line)
            if match:
                val = to_decimal(match.group(1).replace(",", "."))
                if val and val > 0:
                    total_amount = val
                    break

    # If no keyword hit, find the largest reasonable monetary amount
    if not total_amount:
        all_amounts = []
        for line in clean_lines:
            matches = re.findall(r"(?<!\d)([0-9]{1,6}(?:[.,][0-9]{2}))(?!\d)", line)
            for m in matches:
                dec = to_decimal(m.replace(",", "."))
                if dec and 0 < dec < 1000000:
                    all_amounts.append(dec)
        if all_amounts:
            total_amount = max(all_amounts)
            warnings.append("Amount inferred as highest found on receipt. Please verify.")

    if not total_amount:
        warnings.append("Total amount could not be detected. Please enter manually.")

    # 5. Suggested category
    cat_name = suggest_category_name(f"{merchant or ''} {full_text}", kind="expense")

    confidence = 0.5
    if merchant:
        confidence += 0.2
    if total_amount:
        confidence += 0.2
    if tx_date:
        confidence += 0.1

    return ReceiptDraft(
        merchant=merchant,
        transaction_date=tx_date or date.today(),
        amount=format(total_amount, "f") if total_amount else None,
        currency=currency,
        description=f"Receipt from {merchant}" if merchant else "Scanned receipt",
        suggested_category_name=cat_name,
        type="expense",
        subtotal=format(subtotal, "f") if subtotal else None,
        tax=format(tax, "f") if tax else None,
        items=items,
        raw_text=full_text,
        confidence=round(confidence, 2),
        warnings=warnings,
    )

