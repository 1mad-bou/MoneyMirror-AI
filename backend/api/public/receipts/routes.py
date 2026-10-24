from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session

from api.core.deps import get_current_user
from api.database import get_db
from api.public.auth.models import User
from api.public.categories.crud import find_category_by_name
from api.public.receipts.models import ReceiptDraft
from api.public.receipts.service import scan_receipt_to_draft

router = APIRouter()


@router.post("/scan", response_model=ReceiptDraft)
async def scan_receipt(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Scan a receipt image and return an editable transaction draft.

    CRITICAL SAFETY REQUIREMENT:
    This endpoint NEVER creates or saves a transaction to PostgreSQL.
    Only explicit user confirmation via POST /api/transactions can persist it.
    """
    try:
        content = await file.read()
        draft = scan_receipt_to_draft(
            file_bytes=content,
            filename=file.filename or "receipt.jpg",
            default_currency=user.preferred_currency or "MAD",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Receipt processing failed: {str(e)}",
        )

    # Resolve category ID if category name was suggested
    if draft.suggested_category_name:
        cat = find_category_by_name(db, user.id, draft.suggested_category_name, kind=draft.type)
        if cat:
            draft.suggested_category_id = cat.id

    return draft

