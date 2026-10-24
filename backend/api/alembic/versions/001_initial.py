"""Initial MoneyMirror AI migration

Revision ID: 001_initial_moneymirror
Revises: 
Create Date: 2026-10-24 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import pgvector
import sqlalchemy as sa
import sqlmodel

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector if on PostgreSQL
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 1. users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sqlmodel.sql.sqltypes.AutoString(length=120), nullable=False),
        sa.Column("password_hash", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("preferred_currency", sqlmodel.sql.sqltypes.AutoString(length=3), nullable=False, server_default="MAD"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 2. categories
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=60), nullable=False),
        sa.Column("kind", sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
        sa.Column("icon", sqlmodel.sql.sqltypes.AutoString(length=40), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "name", "kind", name="uq_category_user_name_kind"),
    )
    op.create_index("ix_categories_user_id", "categories", ["user_id"], unique=False)

    # 3. transactions
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(length=10), nullable=False),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("merchant", sa.String(length=120), nullable=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("source", sa.String(length=20), nullable=False, server_default="manual"),
        sa.Column("client_request_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "client_request_id", name="uq_transaction_idempotency"),
    )
    op.create_index("ix_transactions_user_id", "transactions", ["user_id"], unique=False)
    op.create_index("ix_transactions_category_id", "transactions", ["category_id"], unique=False)
    op.create_index("ix_transactions_user_date", "transactions", ["user_id", "transaction_date"], unique=False)

    # 4. transaction_embeddings
    if conn.dialect.name == "postgresql":
        op.create_table(
            "transaction_embeddings",
            sa.Column("transaction_id", sa.Integer(), sa.ForeignKey("transactions.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("embedding", pgvector.sqlalchemy.Vector(384), nullable=False),
            sa.Column("model", sqlmodel.sql.sqltypes.AutoString(length=80), nullable=False, server_default=""),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_transaction_embeddings_user_id", "transaction_embeddings", ["user_id"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.drop_table("transaction_embeddings")
    op.drop_table("transactions")
    op.drop_table("categories")
    op.drop_table("users")

