from datetime import date
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from api.core.deps import get_current_user
from api.database import get_db
from api.public.analytics.models import CategorySpending, DashboardSummary, TrendPoint
from api.public.analytics.service import get_category_breakdown, get_summary, get_trends
from api.public.auth.models import User

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def summary_endpoint(
    currency: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref_curr = (currency or user.preferred_currency or "MAD").upper()
    return get_summary(
        db=db,
        user_id=user.id,
        preferred_currency=pref_curr,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/categories", response_model=List[CategorySpending])
def categories_breakdown_endpoint(
    currency: Optional[str] = None,
    kind: Literal["expense", "income"] = "expense",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(15, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    curr = (currency or user.preferred_currency or "MAD").upper()
    return get_category_breakdown(
        db=db,
        user_id=user.id,
        currency=curr,
        start_date=start_date,
        end_date=end_date,
        kind=kind,
        limit=limit,
    )


@router.get("/trends", response_model=List[TrendPoint])
def trends_endpoint(
    currency: Optional[str] = None,
    period: Literal["7d", "30d", "90d", "year"] = "30d",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    curr = (currency or user.preferred_currency or "MAD").upper()
    return get_trends(
        db=db,
        user_id=user.id,
        currency=curr,
        period=period,
    )

