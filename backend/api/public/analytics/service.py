from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional

from sqlalchemy import desc, func
from sqlmodel import Session, select

from api.core.money import money_str, quantize
from api.public.analytics.models import (
    CategorySpending,
    CurrencySummary,
    DashboardSummary,
    TopMerchant,
    TrendPoint,
)
from api.public.categories.models import Category
from api.public.transactions.models import Transaction


def get_summary(
    db: Session,
    user_id: int,
    preferred_currency: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> DashboardSummary:
    query = (
        select(
            Transaction.currency,
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .where(Transaction.user_id == user_id)
        .group_by(Transaction.currency, Transaction.type)
    )
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)

    rows = db.exec(query).all()

    # Aggregate by currency
    by_currency: Dict[str, Dict[str, Decimal]] = {}
    counts: Dict[str, int] = {}
    total_tx_count = 0

    for curr, tx_type, total, cnt in rows:
        total_tx_count += cnt
        if curr not in by_currency:
            by_currency[curr] = {"income": Decimal("0"), "expense": Decimal("0")}
            counts[curr] = 0
        by_currency[curr][tx_type] = Decimal(str(total or 0))
        counts[curr] += cnt

    currencies_summary: List[CurrencySummary] = []
    for curr, vals in sorted(by_currency.items()):
        inc = quantize(vals["income"])
        exp = quantize(vals["expense"])
        net = quantize(inc - exp)
        currencies_summary.append(
            CurrencySummary(
                currency=curr,
                total_income=money_str(inc),
                total_expenses=money_str(exp),
                net_cash_flow=money_str(net),
                transaction_count=counts[curr],
            )
        )

    # Primary summary for preferred currency (or zero if none yet)
    primary = next((c for c in currencies_summary if c.currency == preferred_currency), None)
    if not primary:
        primary = CurrencySummary(
            currency=preferred_currency,
            total_income="0.00",
            total_expenses="0.00",
            net_cash_flow="0.00",
            transaction_count=0,
        )

    # Top categories for preferred currency
    top_categories = get_category_breakdown(
        db=db,
        user_id=user_id,
        currency=preferred_currency,
        start_date=start_date,
        end_date=end_date,
        limit=5,
    )

    # Top merchants for preferred currency (treated as recipients in UI per KHAZI design)
    merchant_query = (
        select(
            Transaction.merchant,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("cnt"),
        )
        .where(
            Transaction.user_id == user_id,
            Transaction.currency == preferred_currency,
            Transaction.type == "expense",
            Transaction.merchant.isnot(None),
            Transaction.merchant != "",
        )
        .group_by(Transaction.merchant)
        .order_by(desc("total"))
        .limit(6)
    )
    if start_date:
        merchant_query = merchant_query.where(Transaction.transaction_date >= start_date)
    if end_date:
        merchant_query = merchant_query.where(Transaction.transaction_date <= end_date)

    merchant_rows = db.exec(merchant_query).all()
    top_merchants = [
        TopMerchant(
            merchant=m,
            currency=preferred_currency,
            amount=money_str(Decimal(str(tot or 0))),
            count=cnt,
        )
        for m, tot, cnt in merchant_rows
    ]

    return DashboardSummary(
        preferred_currency=preferred_currency,
        currencies=currencies_summary,
        primary_summary=primary,
        top_categories=top_categories,
        top_merchants=top_merchants,
        total_transactions=total_tx_count,
    )


def get_category_breakdown(
    db: Session,
    user_id: int,
    currency: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    kind: str = "expense",
    limit: int = 15,
) -> List[CategorySpending]:
    query = (
        select(
            Transaction.category_id,
            Category.name,
            Category.icon,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("cnt"),
        )
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == user_id,
            Transaction.currency == currency.upper(),
            Transaction.type == kind,
        )
        .group_by(Transaction.category_id, Category.name, Category.icon)
        .order_by(desc("total"))
        .limit(limit)
    )
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)

    rows = db.exec(query).all()
    total_spent = sum((Decimal(str(r[3] or 0)) for r in rows), Decimal("0"))

    breakdown: List[CategorySpending] = []
    for cat_id, name, icon, total, count in rows:
        amt = quantize(Decimal(str(total or 0)))
        pct = float(amt / total_spent * 100) if total_spent > 0 else 0.0
        breakdown.append(
            CategorySpending(
                category_id=cat_id,
                category_name=name or "Uncategorized",
                category_icon=icon or "tag",
                currency=currency.upper(),
                amount=money_str(amt),
                percentage=round(pct, 1),
                count=count,
            )
        )
    return breakdown


def get_trends(
    db: Session,
    user_id: int,
    currency: str,
    period: str = "30d",
) -> List[TrendPoint]:
    today = date.today()
    if period == "7d":
        start_date = today - timedelta(days=6)
    elif period == "30d":
        start_date = today - timedelta(days=29)
    elif period == "90d":
        start_date = today - timedelta(days=89)
    elif period == "year":
        start_date = today.replace(month=1, day=1)
    else:
        start_date = today - timedelta(days=29)

    query = (
        select(
            Transaction.transaction_date,
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
        )
        .where(
            Transaction.user_id == user_id,
            Transaction.currency == currency.upper(),
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= today,
        )
        .group_by(Transaction.transaction_date, Transaction.type)
        .order_by(Transaction.transaction_date)
    )
    rows = db.exec(query).all()

    # Map daily income and expense
    data_map: Dict[str, Dict[str, Decimal]] = {}
    curr = start_date
    while curr <= today:
        d_str = curr.isoformat()
        data_map[d_str] = {"income": Decimal("0"), "expense": Decimal("0")}
        curr += timedelta(days=1)

    for d, t_type, tot in rows:
        d_str = d.isoformat()
        if d_str in data_map:
            data_map[d_str][t_type] = Decimal(str(tot or 0))

    points: List[TrendPoint] = []
    for d_str, vals in sorted(data_map.items()):
        inc = quantize(vals["income"])
        exp = quantize(vals["expense"])
        net = quantize(inc - exp)
        points.append(
            TrendPoint(
                date=d_str,
                currency=currency.upper(),
                income=money_str(inc),
                expenses=money_str(exp),
                net=money_str(net),
            )
        )
    return points

