"""API router aggregation mounted under /api."""

from fastapi import APIRouter

from app.api.dashboard import dashboard_router, options_router
from app.api.health import health_router
from app.api.patients import router as patients_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(patients_router)
api_router.include_router(dashboard_router)
api_router.include_router(options_router)

__all__ = ["api_router"]
