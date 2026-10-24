from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session

from api.ai.service import ask_financial_assistant, parse_transaction_from_text
from api.config import settings
from api.core.deps import get_current_user
from api.core.ratelimit import rate_limit
from api.database import get_db
from api.public.auth.models import User
from api.public.categories.crud import find_category_by_name
from api.public.receipts.models import ReceiptDraft

router = APIRouter()


class NLDraftRequest(BaseModel):
    text: str = Field(min_length=3, max_length=500)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    reply: str


class AIStatusResponse(BaseModel):
    gemma_configured: bool
    gemma_model: str
    ocr_enabled: bool
    embeddings_enabled: bool
    embedding_model: str


@router.get("/status", response_model=AIStatusResponse)
def get_ai_status():
    return AIStatusResponse(
        gemma_configured=settings.gemma_configured,
        gemma_model=settings.GEMMA_MODEL,
        ocr_enabled=settings.OCR_ENABLED,
        embeddings_enabled=settings.EMBEDDINGS_ENABLED,
        embedding_model=settings.EMBEDDING_MODEL,
    )


@router.post("/transaction-draft", response_model=ReceiptDraft)
def create_nl_transaction_draft(
    payload: NLDraftRequest,
    user: User = Depends(rate_limit("ai_draft", times=30, seconds=60)),
    db: Session = Depends(get_db),
):
    """Generate a candidate transaction draft from natural language.

    CRITICAL SAFETY REQUIREMENT:
    This endpoint NEVER creates or saves a transaction to PostgreSQL.
    Only explicit user confirmation via POST /api/transactions can persist it.
    """
    draft = parse_transaction_from_text(
        text_input=payload.text,
        default_currency=user.preferred_currency or "MAD",
    )

    if draft.suggested_category_name:
        cat = find_category_by_name(db, user.id, draft.suggested_category_name, kind=draft.type)
        if cat:
            draft.suggested_category_id = cat.id

    return draft


@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    payload: ChatRequest,
    user: User = Depends(rate_limit("ai_chat", times=20, seconds=60)),
    db: Session = Depends(get_db),
):
    """Ask questions about authorized financial records.

    CRITICAL ARCHITECTURAL CONSTRAINTS:
    - Strictly READ-ONLY: Executes inside a PostgreSQL `SET TRANSACTION READ ONLY` session.
    - Zero mutation endpoints or tools are accessible to the assistant.
    - Data is isolated to the authenticated user ID.
    """
    reply = ask_financial_assistant(
        user_id=user.id,
        user_message=payload.message,
        preferred_currency=user.preferred_currency or "MAD",
        db_engine=db.get_bind(),
    )
    return ChatResponse(reply=reply)

