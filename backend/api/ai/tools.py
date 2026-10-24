"""Approved read-only financial tools for the AI assistant.

TECHNICAL RESTRICTION:
- Every query is parameter-bound and strictly scoped to user_id.
- No dynamic SQL construction or arbitrary query execution is permitted.
- No INSERT, UPDATE, DELETE, or DDL operations exist in this module.
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import desc, func
from sqlmodel import Session, select

from api.core.money import money_str, quantize
from api.public.categories.models import Category
from api.public.transactions.models import Transaction


class ReadOnlyFinanceTools:
    def __init__(self, db: Session, user_id: int, preferred_currency: str = "MAD"):
        self.db = db
        self.user_id = user_id
        self.preferred_currency = preferred_currency

    def get_spending_summary(self, start_date: Optional[date] = None, end_date: Optional[date] = None) -> Dict[str, Any]:
        """Get total income, expense, and net cash flow per currency."""
        query = (
            select(
                Transaction.currency,
                Transaction.type,
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .where(Transaction.user_id == self.user_id)
            .group_by(Transaction.currency, Transaction.type)
        )
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)

        rows = self.db.exec(query).all()
        by_curr: Dict[str, Dict[str, str]] = {}
        for curr, t_type, tot, count in rows:
            if curr not in by_curr:
                by_curr[curr] = {"income": "0.00", "expense": "0.00", "net": "0.00"}
            by_curr[curr][t_type] = money_str(Decimal(str(tot or 0)))

        for curr, vals in by_curr.items():
            inc = Decimal(vals["income"])
            exp = Decimal(vals["expense"])
            vals["net"] = money_str(inc - exp)

        return {
            "period": f"{start_date or 'all-time'} to {end_date or 'today'}",
            "currencies": by_curr,
        }

    def get_category_breakdown(
        self,
        currency: Optional[str] = None,
        kind: str = "expense",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get spending grouped by category."""
        curr = (currency or self.preferred_currency).upper()
        query = (
            select(
                Category.name,
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .outerjoin(Category, Transaction.category_id == Category.id)
            .where(
                Transaction.user_id == self.user_id,
                Transaction.currency == curr,
                Transaction.type == kind,
            )
            .group_by(Category.name)
            .order_by(desc("total"))
            .limit(limit)
        )
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)

        rows = self.db.exec(query).all()
        return [
            {
                "category": name or "Uncategorized",
                "currency": curr,
                "amount": money_str(Decimal(str(total or 0))),
                "transactions_count": count,
            }
            for name, total, count in rows
        ]

    def get_largest_expenses(self, currency: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve the largest recorded expense transactions."""
        curr = (currency or self.preferred_currency).upper()
        query = (
            select(Transaction, Category.name)
            .outerjoin(Category, Transaction.category_id == Category.id)
            .where(
                Transaction.user_id == self.user_id,
                Transaction.currency == curr,
                Transaction.type == "expense",
            )
            .order_by(desc(Transaction.amount))
            .limit(limit)
        )
        rows = self.db.exec(query).all()
        return [
            {
                "date": tx.transaction_date.isoformat(),
                "description": tx.description,
                "merchant": tx.merchant,
                "amount": money_str(tx.amount),
                "currency": tx.currency,
                "category": cat_name or "Uncategorized",
            }
            for tx, cat_name in rows
        ]

    def compare_periods(
        self,
        days_per_period: int = 30,
        currency: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Compare the current N-day period with the preceding N-day period."""
        curr = (currency or self.preferred_currency).upper()
        today = date.today()
        p1_start = today - timedelta(days=days_per_period - 1)
        p2_end = p1_start - timedelta(days=1)
        p2_start = p2_end - timedelta(days=days_per_period - 1)

        def _sum_period(s_date, e_date):
            rows = self.db.exec(
                select(Transaction.type, func.sum(Transaction.amount))
                .where(
                    Transaction.user_id == self.user_id,
                    Transaction.currency == curr,
                    Transaction.transaction_date >= s_date,
                    Transaction.transaction_date <= e_date,
                )
                .group_by(Transaction.type)
            ).all()
            totals = {t: Decimal(str(a or 0)) for t, a in rows}
            return {
                "income": money_str(quantize(totals.get("income", Decimal("0")))),
                "expense": money_str(quantize(totals.get("expense", Decimal("0")))),
            }

        current_period = _sum_period(p1_start, today)
        previous_period = _sum_period(p2_start, p2_end)

        return {
            "currency": curr,
            "current_period": {
                "dates": f"{p1_start.isoformat()} to {today.isoformat()}",
                **current_period,
            },
            "previous_period": {
                "dates": f"{p2_start.isoformat()} to {p2_end.isoformat()}",
                **previous_period,
            },
        }

    def get_recent_transactions(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get the latest transactions across all types."""
        query = (
            select(Transaction, Category.name)
            .outerjoin(Category, Transaction.category_id == Category.id)
            .where(Transaction.user_id == self.user_id)
            .order_by(desc(Transaction.transaction_date), desc(Transaction.id))
            .limit(limit)
        )
        rows = self.db.exec(query).all()
        return [
            {
                "date": tx.transaction_date.isoformat(),
                "type": tx.type,
                "description": tx.description,
                "merchant": tx.merchant,
                "amount": money_str(tx.amount),
                "currency": tx.currency,
                "category": cat_name or "Uncategorized",
            }
            for tx, cat_name in rows
        ]

