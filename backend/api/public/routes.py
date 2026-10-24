from fastapi import APIRouter

from api.ai.routes import router as ai_router
from api.public.analytics.routes import router as analytics_router
from api.public.auth.routes import router as auth_router
from api.public.categories.routes import router as categories_router
from api.public.receipts.routes import router as receipts_router
from api.public.transactions.routes import router as transactions_router

public_router = APIRouter()

public_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
public_router.include_router(categories_router, prefix="/categories", tags=["Categories"])
public_router.include_router(transactions_router, prefix="/transactions", tags=["Transactions"])
public_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
public_router.include_router(receipts_router, prefix="/receipts", tags=["Receipts"])
public_router.include_router(ai_router, prefix="/ai", tags=["AI & Assistant"])
