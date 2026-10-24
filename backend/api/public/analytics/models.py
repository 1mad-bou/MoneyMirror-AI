from decimal import Decimal
from typing import Dict, List, Optional
from pydantic import BaseModel


class CurrencySummary(BaseModel):
    currency: str
    total_income: str
    total_expenses: str
    net_cash_flow: str
    transaction_count: int


class CategorySpending(BaseModel):
    category_id: Optional[int]
    category_name: str
    category_icon: Optional[str]
    currency: str
    amount: str
    percentage: float
    count: int


class TrendPoint(BaseModel):
    date: str  # YYYY-MM-DD or YYYY-MM
    currency: str
    income: str
    expenses: str
    net: str


class TopMerchant(BaseModel):
    merchant: str
    currency: str
    amount: str
    count: int


class DashboardSummary(BaseModel):
    preferred_currency: str
    currencies: List[CurrencySummary]
    primary_summary: CurrencySummary
    top_categories: List[CategorySpending]
    top_merchants: List[TopMerchant]
    total_transactions: int

