from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from api.core.deps import get_current_user
from api.database import get_db
from api.public.auth.models import User
from api.public.categories.crud import (
    find_category_by_name,
    get_owned_category,
    list_categories,
    to_read,
)
from api.public.categories.models import Category, CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter()


@router.get("", response_model=List[CategoryRead])
def get_categories(
    kind: Optional[Literal["expense", "income"]] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return [to_read(c) for c in list_categories(db, user.id, kind)]


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if find_category_by_name(db, user.id, payload.name, payload.kind):
        raise HTTPException(status_code=409, detail="A category with this name already exists")
    category = Category(user_id=user.id, **payload.model_dump())
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A category with this name already exists")
    db.refresh(category)
    return to_read(category)


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category = get_owned_category(db, user.id, category_id)
    if category is None:
        # Default categories are shared and read-only; other users' are invisible.
        raise HTTPException(status_code=404, detail="Category not found or not editable")
    data = payload.model_dump(exclude_unset=True)
    if data.get("name"):
        clash = find_category_by_name(db, user.id, data["name"], category.kind)
        if clash and clash.id != category.id:
            raise HTTPException(status_code=409, detail="A category with this name already exists")
    for key, value in data.items():
        setattr(category, key, value)
    db.add(category)
    db.commit()
    db.refresh(category)
    return to_read(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    category = get_owned_category(db, user.id, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found or not editable")
    # transactions.category_id is ON DELETE SET NULL, so records are kept.
    db.delete(category)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

