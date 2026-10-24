"""Import every table model so SQLModel.metadata is complete (Alembic, tests)."""
from api.ai.models import TransactionEmbedding  # noqa: F401
from api.public.auth.models import User  # noqa: F401
from api.public.categories.models import Category  # noqa: F401
from api.public.transactions.models import Transaction  # noqa: F401

