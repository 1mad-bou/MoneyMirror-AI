from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class ReceiptItem(BaseModel):
    description: str
    amount: Optional[str] = None
    quantity: Optional[float] = None


class ReceiptDraft(BaseModel):
    """Candidate transaction draft extracted from receipt.

    This is NEVER persisted directly to the database. The user must review,
    edit, and confirm it via POST /api/transactions.
    """

    merchant: Optional[str] = None
    transaction_date: Optional[date] = None
    amount: Optional[str] = None
    currency: str = "MAD"
    description: str = ""
    suggested_category_id: Optional[int] = None
    suggested_category_name: Optional[str] = None
    type: str = "expense"
    subtotal: Optional[str] = None
    tax: Optional[str] = None
    items: List[ReceiptItem] = Field(default_factory=list)
    raw_text: str = ""
    confidence: float = 0.0
    warnings: List[str] = Field(default_factory=list)

