from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import desc, func
from sqlmodel import Session, col, or_, select

from api.core.money import money_str, quantize
from api.public.categories.crud import get_visible_category
from api.public.categories.models import Category
from api.public.transactions.models import (
    CategoryBrief,
    Transaction,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)


def _enrich(tx: Transaction, cat: Optional[Category]) -> TransactionRead:
    return TransactionRead(
        id=tx.id,
        type=tx.type,
        amount=money_str(tx.amount),
        currency=tx.currency,
        description=tx.description,
        merchant=tx.merchant,
        category_id=tx.category_id,
        category=CategoryBrief(id=cat.id, name=cat.name, icon=cat.icon) if cat else None,
        transaction_date=tx.transaction_date,
        source=tx.source,
        created_at=tx.created_at,
        updated_at=tx.updated_at,
    )


def create_transaction(
    db: Session,
    user_id: int,
    data: TransactionCreate,
    client_request_id: Optional[str] = None,
) -> Tuple[TransactionRead, bool]:
    """Create a new transaction for user_id.

    If client_request_id is provided and was already used by this user, returns
    the existing transaction with duplicate=True (idempotency guard).
    """
    if client_request_id:
        existing = db.exec(
            select(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.client_request_id == client_request_id,
            )
        ).first()
        if existing:
            cat = db.get(Category, existing.category_id) if existing.category_id else None
            return _enrich(existing, cat), True

    # Validate category ownership (if assigned)
    category: Optional[Category] = None
    if data.category_id:
        category = get_visible_category(db, user_id, data.category_id)
        if not category:
            raise ValueError("Category not found or unauthorized")

    tx = Transaction(
        user_id=user_id,
        type=data.type,
        amount=quantize(Decimal(str(data.amount))),
        currency=data.currency.upper(),
        description=data.description,
        merchant=data.merchant,
        category_id=category.id if category else None,
        transaction_date=data.transaction_date,
        source=data.source,
        client_request_id=client_request_id,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return _enrich(tx, category), False


def get_transaction(db: Session, user_id: int, tx_id: int) -> Optional[TransactionRead]:
    row = db.exec(
        select(Transaction, Category)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(Transaction.id == tx_id, Transaction.user_id == user_id)
    ).first()
    if not row:
        return None
    tx, cat = row
    return _enrich(tx, cat)


def update_transaction(
    db: Session, user_id: int, tx_id: int, data: TransactionUpdate
) -> Optional[TransactionRead]:
    tx = db.exec(
        select(Transaction).where(Transaction.id == tx_id, Transaction.user_id == user_id)
    ).first()
    if not tx:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    if "category_id" in update_dict and update_dict["category_id"] is not None:
        cat = get_visible_category(db, user_id, update_dict["category_id"])
        if not cat:
            raise ValueError("Category not found or unauthorized")
        tx.category_id = cat.id
    elif "category_id" in update_dict:
        tx.category_id = None

    if "amount" in update_dict and update_dict["amount"] is not None:
        tx.amount = quantize(Decimal(str(update_dict["amount"])))

    for field in ("type", "currency", "description", "merchant", "transaction_date"):
        if field in update_dict and update_dict[field] is not None:
            val = update_dict[field]
            if field == "currency":
                val = str(val).upper()
            setattr(tx, field, val)

    from api.public.auth.models import utcnow

    tx.updated_at = utcnow()
    db.add(tx)
    db.commit()
    db.refresh(tx)
    cat = db.get(Category, tx.category_id) if tx.category_id else None
    return _enrich(tx, cat)


def delete_transaction(db: Session, user_id: int, tx_id: int) -> bool:
    tx = db.exec(
        select(Transaction).where(Transaction.id == tx_id, Transaction.user_id == user_id)
    ).first()
    if not tx:
        return False
    db.delete(tx)
    db.commit()
    return True


def list_transactions(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    tx_type: Optional[str] = None,
    category_id: Optional[int] = None,
    currency: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Tuple[List[TransactionRead], int]:
    base_query = (
        select(Transaction, Category)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(Transaction.user_id == user_id)
    )

    if tx_type:
        base_query = base_query.where(Transaction.type == tx_type)
    if category_id:
        base_query = base_query.where(Transaction.category_id == category_id)
    if currency:
        base_query = base_query.where(Transaction.currency == currency.upper())
    if start_date:
        base_query = base_query.where(Transaction.transaction_date >= start_date)
    if end_date:
        base_query = base_query.where(Transaction.transaction_date <= end_date)
    if search:
        kw = f"%{search.lower()}%"
        base_query = base_query.where(
            or_(
                func.lower(Transaction.description).like(kw),
                func.lower(Transaction.merchant).like(kw),
                func.lower(Category.name).like(kw),
            )
        )

    # Count
    count_query = (
        select(func.count(Transaction.id))
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(Transaction.user_id == user_id)
    )
    if tx_type:
        count_query = count_query.where(Transaction.type == tx_type)
    if category_id:
        count_query = count_query.where(Transaction.category_id == category_id)
    if currency:
        count_query = count_query.where(Transaction.currency == currency.upper())
    if start_date:
        count_query = count_query.where(Transaction.transaction_date >= start_date)
    if end_date:
        count_query = count_query.where(Transaction.transaction_date <= end_date)
    if search:
        count_query = count_query.where(
            or_(
                func.lower(Transaction.description).like(kw),
                func.lower(Transaction.merchant).like(kw),
                func.lower(Category.name).like(kw),
            )
        )

    total = db.exec(count_query).one() or 0
    results = db.exec(
        base_query.order_by(desc(Transaction.transaction_date), desc(Transaction.id))
        .offset(skip)
        .limit(limit)
    ).all()

    items = [_enrich(tx, cat) for tx, cat in results]
    return items, total

