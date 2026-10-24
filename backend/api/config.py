import os
import secrets
import warnings
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


def load_env():
    from dotenv import load_dotenv

    env_path = "../.env"
    load_dotenv(env_path)


def _bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings(BaseSettings):
    PROJECT_NAME: str = (
        f"MoneyMirror AI API - {os.getenv('ENV', 'development').capitalize()}"
    )
    DESCRIPTION: str = (
        "MoneyMirror AI: personal finance tracking, receipt scanning with human review "
        "and a read-only, RAG-powered financial assistant."
    )
    ENV: Literal["development", "staging", "production", "test"] = "development"
    VERSION: str = "1.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
    DATABASE_URI: str = os.getenv(
        "DATABASE_URI", "postgresql://user:password@postgres:5432/dbname"
    )

    # Auth
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    JWT_ALGORITHM: str = "HS256"

    # CORS (comma separated)
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS", "http://localhost:8080,http://127.0.0.1:8080"
    )

    # Finance
    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "MAD")

    # Receipts / OCR
    RECEIPT_MAX_BYTES: int = int(os.getenv("RECEIPT_MAX_BYTES", str(8 * 1024 * 1024)))
    RECEIPT_TMP_DIR: str = os.getenv("RECEIPT_TMP_DIR", "/app/storage/receipts")
    OCR_ENABLED: bool = _bool_env("OCR_ENABLED", True)
    OCR_LANG: str = os.getenv("OCR_LANG", "en")

    # Gemma (Google AI Studio)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMMA_MODEL: str = os.getenv("GEMMA_MODEL", "gemma-3-27b-it")
    GEMMA_API_BASE: str = os.getenv(
        "GEMMA_API_BASE", "https://generativelanguage.googleapis.com/v1beta"
    )
    GEMMA_TIMEOUT_SECONDS: float = float(os.getenv("GEMMA_TIMEOUT_SECONDS", "45"))

    # Embeddings / RAG
    EMBEDDINGS_ENABLED: bool = _bool_env("EMBEDDINGS_ENABLED", True)
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    EMBEDDING_DIM: int = 384
    FASTEMBED_CACHE_DIR: str = os.getenv("FASTEMBED_CACHE_DIR", "/app/models/fastembed")

    # Background jobs (embedding backfill at startup)
    BACKGROUND_JOBS_ENABLED: bool = _bool_env("BACKGROUND_JOBS_ENABLED", True)

    model_config = SettingsConfigDict(case_sensitive=True)

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def gemma_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY)


class TestSettings(Settings):
    DATABASE_URI: str = os.getenv(
        "TEST_DATABASE_URI", "postgresql://user:password@postgres:5432/moneymirror_test"
    )


settings = Settings()
test_settings = TestSettings()

if not os.getenv("SECRET_KEY"):
    warnings.warn(
        "SECRET_KEY is not set; using a random key. Login tokens will be invalidated "
        "on every restart. Set SECRET_KEY in .env.",
        stacklevel=1,
    )
