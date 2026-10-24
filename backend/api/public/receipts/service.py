import logging
import os
import tempfile
import threading
from typing import List, Optional

from PIL import Image

from api.config import settings
from api.public.receipts.models import ReceiptDraft
from api.public.receipts.parser import extract_receipt_fields

logger = logging.getLogger(__name__)

_ocr_lock = threading.Lock()
_ocr_instance = None


def _get_ocr():
    global _ocr_instance
    if _ocr_instance is None:
        with _ocr_lock:
            if _ocr_instance is None:
                try:
                    from rapidocr_onnxruntime import RapidOCR
                    _ocr_instance = RapidOCR()
                    logger.info("RapidOCR (PaddleOCR models) engine initialized")
                except Exception as e:
                    logger.warning(f"Could not initialize RapidOCR: {e}")
                    _ocr_instance = False
    return _ocr_instance if _ocr_instance is not False else None


ALLOWED_SIGNATURES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",
}


def validate_image_file(file_bytes: bytes, filename: str) -> str:
    """Validate file size, signature, and PIL readability."""
    if len(file_bytes) > settings.RECEIPT_MAX_BYTES:
        raise ValueError(f"File too large. Maximum size is {settings.RECEIPT_MAX_BYTES // (1024 * 1024)}MB.")

    if len(file_bytes) < 16:
        raise ValueError("File is empty or corrupted.")

    matched_type = None
    for sig, mime in ALLOWED_SIGNATURES.items():
        if file_bytes.startswith(sig):
            matched_type = mime
            break
        # WebP has RIFF at 0, WEBP at 8
        if sig == b"RIFF" and file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP":
            matched_type = "image/webp"
            break

    if not matched_type:
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise ValueError("Unsupported image format. Please upload JPG, PNG, or WebP.")

    # Validate image readability with PIL
    try:
        import io
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()
    except Exception:
        raise ValueError("The uploaded file is not a valid or readable image.")

    return matched_type or "image/jpeg"


def run_ocr_on_image(file_bytes: bytes) -> List[str]:
    """Run OCR and return list of recognized text lines.

    The file is written to a private temporary location and deleted
    immediately after inference.
    """
    ocr = _get_ocr()
    if not ocr:
        logger.warning("OCR engine not available; returning empty text.")
        return []

    # Write to private temp file
    os.makedirs(settings.RECEIPT_TMP_DIR, exist_ok=True)
    temp_fd, temp_path = tempfile.mkstemp(dir=settings.RECEIPT_TMP_DIR, prefix="receipt_", suffix=".tmp")
    try:
        with os.fdopen(temp_fd, "wb") as f:
            f.write(file_bytes)

        # Run OCR
        with _ocr_lock:
            result, _ = ocr(temp_path)

        lines = []
        if result:
            for item in result:
                # item structure: [box, text, score]
                if len(item) >= 2 and item[1]:
                    lines.append(str(item[1]).strip())
        return lines
    except Exception as e:
        logger.error(f"OCR execution error: {e}")
        return []
    finally:
        # Strict privacy & retention policy: delete temp image immediately
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass


def scan_receipt_to_draft(file_bytes: bytes, filename: str, default_currency: str = "MAD") -> ReceiptDraft:
    """End-to-end receipt extraction.

    Returns a ReceiptDraft. DOES NOT save any transaction to the database.
    """
    validate_image_file(file_bytes, filename)
    lines = run_ocr_on_image(file_bytes)

    if not lines:
        return ReceiptDraft(
            currency=default_currency,
            warnings=["No text could be extracted from this image. Please enter fields manually."],
            confidence=0.0,
        )

    draft = extract_receipt_fields(lines, default_currency=default_currency)

    # Optional Gemma refinement if configured
    if settings.gemma_configured and draft.raw_text:
        try:
            from api.ai.service import refine_receipt_with_gemma
            refined = refine_receipt_with_gemma(draft.raw_text, default_currency=default_currency)
            if refined:
                if refined.merchant:
                    draft.merchant = refined.merchant
                if refined.amount:
                    draft.amount = refined.amount
                if refined.transaction_date:
                    draft.transaction_date = refined.transaction_date
                if refined.currency:
                    draft.currency = refined.currency
                if refined.suggested_category_name:
                    draft.suggested_category_name = refined.suggested_category_name
                draft.confidence = max(draft.confidence, 0.85)
        except Exception as e:
            logger.warning(f"Gemma receipt refinement skipped: {e}")

    return draft

