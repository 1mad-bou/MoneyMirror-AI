from datetime import datetime, timezone
from typing import Optional

from pydantic import EmailStr, field_validator
from sqlalchemy import Column, DateTime, String
from sqlmodel import Field, SQLModel

from api.core.money import SUPPORTED_CURRENCIES


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    """Application user. Every financial record is owned by exactly one user."""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(sa_column=Column(String(255), unique=True, index=True, nullable=False))
    full_name: str = Field(default="", max_length=120)
    password_hash: str = Field(max_length=255)
    preferred_currency: str = Field(default="MAD", max_length=3)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class UserRegister(SQLModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=120)

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class UserLogin(SQLModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserRead(SQLModel):
    id: int
    email: str
    full_name: str
    preferred_currency: str
    created_at: datetime


class UserUpdate(SQLModel):
    full_name: Optional[str] = Field(default=None, max_length=120)
    preferred_currency: Optional[str] = None

    @field_validator("preferred_currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if v not in SUPPORTED_CURRENCIES:
            raise ValueError(f"Unsupported currency '{v}'")
        return v


class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

