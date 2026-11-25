"""Health and API metadata endpoints."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import __version__
from app.core.config import get_settings
from app.database.session import get_db

health_router = APIRouter(tags=["Health"])


@health_router.get("/health", summary="Health check")
def health_check(session: Session = Depends(get_db)) -> dict:
    settings = get_settings()
    database = "ok"
    try:
        session.execute(text("SELECT 1"))
    except Exception:  # pragma: no cover - exercised only when the DB is down
        database = "unavailable"
    return {
        "status": "ok" if database == "ok" else "degraded",
        "database": database,
        "environment": settings.environment,
        "version": __version__,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
