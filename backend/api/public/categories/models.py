from datetime import datetime
from typing import Literal, Optional

from pydantic import field_validator
from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlmodel import Field, SQLModel

from api.public.auth.models import utcnow

CategoryKind = Literal["expense", "income"]


class Category(SQLModel, table=True):
    """Transaction category.

    ``user_id IS NULL`` marks a shared, read-only default category. Users can
    add their own categories, which are only visible to them.
    """

    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("user_id", "name", "kind", name="uq_category_user_name_kind"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True),
    )
    name: str = Field(max_length=60)
    kind: str = Field(max_length=10)
    icon: Optional[str] = Field(default=None, max_length=40)
    created_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class CategoryCreate(SQLModel):
    name: str = Field(min_length=1, max_length=60)
    kind: CategoryKind
    icon: Optional[str] = Field(default=None, max_length=40)

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = " ".join(v.split())
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class CategoryUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=60)
    icon: Optional[str] = Field(default=None, max_length=40)

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = " ".join(v.split())
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class CategoryRead(SQLModel):
    id: int
    name: str
    kind: str
    icon: Optional[str] = None
    is_default: bool = False

