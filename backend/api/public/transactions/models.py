from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import condecimal, field_validator
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlmodel import Field, SQLModel

from api.core.money import SUPPORTED_CURRENCIES
from api.public.auth.models import utcnow

TransactionType = Literal["income", "expense"]
TransactionSource = Literal["manual", "receipt", "natural_language"]
MIN_DATE = date(2000, 1, 1)

# Positive amount, at most 12 integer digits and 2 decimals: NUMERIC(14, 2)
Amount = condecimal(gt=Decimal("0"), max_digits=14, decimal_places=2)


class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"
    __table_args__ = (
        UniqueConstraint("user_id", "client_request_id", name="uq_transaction_idempotency"),
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        sa_column=Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    )
    type: str = Field(sa_column=Column(String(10), nullable=False))
    amount: Decimal = Field(sa_column=Column(Numeric(14, 2), nullable=False))
    currency: str = Field(sa_column=Column(String(3), nullable=False))
    description: str = Field(default="", sa_column=Column(String(255), nullable=False, default=""))
    merchant: Optional[str] = Field(default=None, sa_column=Column(String(120), nullable=True))
    category_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True),
    )
    transaction_date: date = Field(sa_column=Column(Date, nullable=False))
    source: str = Field(default="manual", sa_column=Column(String(20), nullable=False, default="manual"))
    client_request_id: Optional[str] = Field(default=None, sa_column=Column(String(64), nullable=True))
    created_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


def _validate_currency(v: str) -> str:
    v = (v or "").strip().upper()
    if v not in SUPPORTED_CURRENCIES:
        raise ValueError(f"Unsupported currency '{v}'. Supported: {', '.join(SUPPORTED_CURRENCIES)}")
    return v


def _validate_date(v: date) -> date:
    if v < MIN_DATE:
        raise ValueError("Transaction date is too far in the past")
    if v > date.today() + timedelta(days=1):
        raise ValueError("Transaction date cannot be in the future")
    return v


def _clean_text(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    v = " ".join(v.split())
    return v


class TransactionCreate(SQLModel):
    """Validated input shared by manual entry, receipt review and NL drafts."""

    type: TransactionType
    amount: Amount  # type: ignore[valid-type]
    currency: str = Field(min_length=3, max_length=3)
    description: str = Field(default="", max_length=255)
    merchant: Optional[str] = Field(default=None, max_length=120)
    category_id: Optional[int] = Field(default=None)
    transaction_date: date
    source: TransactionSource = "manual"

    @field_validator("type", mode="before")
    @classmethod
    def sanitize_type(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("amount", mode="before")
    @classmethod
    def sanitize_amount(cls, v):
        if isinstance(v, str):
            return v.replace(",", ".").strip()
        return v

    @field_validator("category_id", mode="before")
    @classmethod
    def sanitize_category(cls, v):
        if v in ("", 0, "0", None):
            return None
        return int(v)

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v):
        if v is None:
            return ""
        return str(v)

    @field_validator("merchant", mode="before")
    @classmethod
    def sanitize_merchant(cls, v):
        if v in ("", None):
            return None
        return str(v)

    @field_validator("transaction_date", mode="before")
    @classmethod
    def sanitize_date(cls, v):
        if not v or v == "":
            return date.today()
        if isinstance(v, str):
            return date.fromisoformat(v[:10])
        return v

    @field_validator("currency")
    @classmethod
    def currency_ok(cls, v: str) -> str:
        return _validate_currency(v)

    @field_validator("transaction_date")
    @classmethod
    def date_ok(cls, v: date) -> date:
        return _validate_date(v)

    @field_validator("description")
    @classmethod
    def clean_description(cls, v: str) -> str:
        return _clean_text(v) or ""

    @field_validator("merchant")
    @classmethod
    def clean_merchant(cls, v: Optional[str]) -> Optional[str]:
        v = _clean_text(v)
        return v or None


class TransactionUpdate(SQLModel):
    type: Optional[TransactionType] = None
    amount: Optional[Amount] = None  # type: ignore[valid-type]
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    description: Optional[str] = Field(default=None, max_length=255)
    merchant: Optional[str] = Field(default=None, max_length=120)
    category_id: Optional[int] = Field(default=None)
    transaction_date: Optional[date] = None

    @field_validator("type", mode="before")
    @classmethod
    def sanitize_type(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("amount", mode="before")
    @classmethod
    def sanitize_amount(cls, v):
        if isinstance(v, str):
            return v.replace(",", ".").strip()
        return v

    @field_validator("category_id", mode="before")
    @classmethod
    def sanitize_category(cls, v):
        if v in ("", 0, "0", None):
            return None
        return int(v)

    @field_validator("transaction_date", mode="before")
    @classmethod
    def sanitize_date(cls, v):
        if not v:
            return None
        if isinstance(v, str):
            return date.fromisoformat(v[:10])
        return v

    @field_validator("currency")
    @classmethod
    def currency_ok(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None else _validate_currency(v)

    @field_validator("transaction_date")
    @classmethod
    def date_ok(cls, v: Optional[date]) -> Optional[date]:
        return None if v is None else _validate_date(v)

    @field_validator("description", "merchant")
    @classmethod
    def clean(cls, v: Optional[str]) -> Optional[str]:
        return _clean_text(v)


class CategoryBrief(SQLModel):
    id: int
    name: str
    icon: Optional[str] = None


class TransactionRead(SQLModel):
    id: int
    type: str
    amount: str  # fixed 2-decimal string, never float
    currency: str
    description: str
    merchant: Optional[str] = None
    category_id: Optional[int] = None
    category: Optional[CategoryBrief] = None
    transaction_date: date
    source: str
    created_at: datetime
    updated_at: datetime


class TransactionPage(SQLModel):
    items: List[TransactionRead]
    total: int
    page: int
    size: int
    pages: int


class TransactionCreateResult(TransactionRead):
    duplicate: bool = False
