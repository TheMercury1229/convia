"""
src/app.py
----------
FastAPI application factory.

- Configures CORS using BACKEND_URL from .env
- Mounts all routers
- Exposes a health-check endpoint at GET /health
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

def _build_origins() -> list[str]:
    origins: list[str] = []
    backend_url = os.environ.get("BACKEND_URL", "").strip()
    if backend_url:
        origins.append(backend_url)
        logger.info("CORS: allowing origin %s", backend_url)
    else:
        logger.warning("BACKEND_URL not set — CORS will block all cross-origin requests")
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    logger.info("Convia AI backend starting up …")
    import src.config.models  # noqa: F401
    logger.info("LLM provider ready ✓")
    yield
    logger.info("Convia AI backend shutting down …")


app = FastAPI(
    title="Convia AI Backend",
    description="AI-powered form generation engine for the Convia platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from src.modules.generate_form import router as generate_form_router
from src.modules.fill_form import router as fill_form_router
from src.modules.analyze_responses import router as analyze_responses_router

app.include_router(generate_form_router)
app.include_router(fill_form_router)
app.include_router(analyze_responses_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Meta"], summary="Liveness probe")
async def health() -> dict:
    return {"status": "ok", "service": "convia-ai-backend"}
