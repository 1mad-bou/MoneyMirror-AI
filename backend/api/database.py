from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from api.config import settings

engine = create_engine(settings.DATABASE_URI, echo=False, pool_pre_ping=True)


def create_db_and_tables():
    """Only used by tests. Production schema is managed by Alembic."""
    import api.models  # noqa: F401  (register tables)

    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    SQLModel.metadata.create_all(engine)


def get_db() -> Iterator[Session]:
    """Read/write session for normal application endpoints."""
    with Session(engine) as session:
        yield session


@contextmanager
def readonly_session(custom_engine=None) -> Iterator[Session]:
    """A session whose transaction is READ ONLY at the database level.

    Used by the AI assistant and RAG retrieval. PostgreSQL rejects any
    INSERT/UPDATE/DELETE/DDL issued inside this transaction, and the
    transaction is always rolled back, so nothing can be persisted even
    if a bug tried to write through it.
    """
    eng = custom_engine or engine
    with Session(eng) as session:
        if eng.dialect.name == "postgresql":
            session.execute(text("SET TRANSACTION READ ONLY"))
        try:
            yield session
        finally:
            session.rollback()


def get_readonly_db() -> Iterator[Session]:
    with readonly_session() as session:
        yield session
