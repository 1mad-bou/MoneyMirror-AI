"""Money helpers. All monetary values are handled as Decimal, never float."""
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from typing import Optional

SUPPORTED_CURRENCIES: tuple[str, ...] = (
    "MAD", "EUR", "USD", "GBP", "CAD", "CHF", "AED", "SAR", "QAR", "TND",
    "DZD", "EGP", "JPY", "CNY", "TRY", "XOF", "AUD", "SEK", "NOK", "DKK",
)

CENT = Decimal("0.01")
MAX_AMOUNT = Decimal("999999999999.99")


def quantize(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def to_decimal(value) -> Optional[Decimal]:
    if value is None:
        return None
    try:
        return quantize(Decimal(str(value)))
    except (InvalidOperation, ValueError):
        return None


def normalize_currency(code: Optional[str]) -> Optional[str]:
    if not code:
        return None
    code = code.strip().upper()
    return code if code in SUPPORTED_CURRENCIES else None


def money_str(value: Decimal) -> str:
    """Serialize a Decimal as a fixed 2-decimal string (JSON safe, no float)."""
    return format(quantize(value), "f")

