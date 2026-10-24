from datetime import datetime
from typing import List, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlmodel import Field, SQLModel

from api.public.auth.models import utcnow

EMBEDDING_DIM = 384


class TransactionEmbedding(SQLModel, table=True):
    """RAG index: one embedding per transaction, always tagged with its owner.

    ``user_id`` is duplicated from the transaction so retrieval can filter by
    owner *before* the similarity search (authorization is never left to the
    prompt).
    """

    __tablename__ = "transaction_embeddings"

    transaction_id: int = Field(
        sa_column=Column(
            Integer, ForeignKey("transactions.id", ondelete="CASCADE"), primary_key=True
        )
    )
    user_id: int = Field(
        sa_column=Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    )
    content: str = Field(sa_column=Column(Text, nullable=False))
    embedding: List[float] = Field(sa_column=Column(Vector(EMBEDDING_DIM), nullable=False))
    model: str = Field(default="", max_length=80)
    updated_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )

