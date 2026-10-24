from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, func, select

from api.config import settings
from api.core.deps import get_current_user
from api.core.security import create_access_token, hash_password, verify_password
from api.database import get_db
from api.public.auth.models import (
    TokenResponse,
    User,
    UserLogin,
    UserRead,
    UserRegister,
    UserUpdate,
)

router = APIRouter()


def _get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.exec(select(User).where(func.lower(User.email) == email.lower())).first()


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id), user=UserRead.model_validate(user)
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if _get_user_by_email(db, email):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        preferred_currency=settings.DEFAULT_CURRENCY,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = _get_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    return _token_response(user)


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(user, key, value.strip() if isinstance(value, str) else value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

