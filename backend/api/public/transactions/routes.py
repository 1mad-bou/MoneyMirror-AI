import math
from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlmodel import Session

from api.core.deps import get_current_user
from api.database import get_db
from api.public.auth.models import User
from api.public.transactions.crud import (
    create_transaction,
    delete_transaction,
    get_transaction,
    list_transactions,
    update_transaction,
)
from api.public.transactions.models import (
    TransactionCreate,
    TransactionCreateResult,
    TransactionPage,
    TransactionRead,
    TransactionUpdate,
)

router = APIRouter()


@router.get("", response_model=TransactionPage)
def get_transactions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[Literal["income", "expense"]] = None,
    category_id: Optional[int] = None,
    currency: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * size
    items, total = list_transactions(
        db=db,
        user_id=user.id,
        skip=skip,
        limit=size,
        search=search,
        tx_type=type,
        category_id=category_id,
        currency=currency,
        start_date=start_date,
        end_date=end_date,
    )
    pages = max(1, math.ceil(total / size)) if total > 0 else 1
    return TransactionPage(items=items, total=total, page=page, size=size, pages=pages)


@router.post("", response_model=TransactionCreateResult, status_code=status.HTTP_201_CREATED)
def add_transaction(
    payload: TransactionCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        tx, duplicate = create_transaction(
            db=db,
            user_id=user.id,
            data=payload,
            client_request_id=idempotency_key,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Trigger background embedding indexing if enabled (non-blocking)
    try:
        from api.ai.service import index_transaction_async
        index_transaction_async(tx.id, user.id)
    except Exception:
        pass

    return TransactionCreateResult(**tx.model_dump(), duplicate=duplicate)


@router.get("/{tx_id}", response_model=TransactionRead)
def get_single_transaction(
    tx_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = get_transaction(db, user.id, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.patch("/{tx_id}", response_model=TransactionRead)
def modify_transaction(
    tx_id: int,
    payload: TransactionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        tx = update_transaction(db, user.id, tx_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    try:
        from api.ai.service import index_transaction_async
        index_transaction_async(tx.id, user.id)
    except Exception:
        pass

    return tx


@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_transaction(
    tx_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not delete_transaction(db, user.id, tx_id):
        raise HTTPException(status_code=404, detail="Transaction not found")
    return None

