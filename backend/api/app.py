from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session

from api.config import Settings
from api.database import engine
from api.public.categories.crud import seed_default_categories
from api.public.routes import public_router

logger = logging.getLogger("moneymirror")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed default categories if needed
    try:
        with Session(engine) as db:
            seed_default_categories(db)
        logger.info("Default categories verified/seeded.")
    except Exception as e:
        logger.warning(f"Could not seed default categories at startup: {e}")
    yield


def create_app(settings: Settings):
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        docs_url="/docs",
        openapi_url="/openapi.json",
        description=settings.DESCRIPTION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins + ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"422 Validation Error on {request.method} {request.url.path}: {exc.errors()}")
        err_messages = []
        for err in exc.errors():
            loc = ".".join(str(x) for x in err.get("loc", []) if x != "body")
            msg = err.get("msg", "Invalid value")
            err_messages.append(f"{loc}: {msg}" if loc else msg)
        formatted_msg = "; ".join(err_messages)
        return JSONResponse(
            status_code=422,
            content=jsonable_encoder({"detail": formatted_msg, "errors": exc.errors()}),
        )

    @app.get("/api/health", tags=["Health"])
    def health_check():
        return {
            "status": "healthy",
            "version": settings.VERSION,
            "currency": settings.DEFAULT_CURRENCY,
            "gemma_configured": settings.gemma_configured,
        }

    # Mount all routes under /api
    app.include_router(public_router, prefix="/api")

    return app
