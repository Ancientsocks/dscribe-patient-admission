"""FastAPI application factory and entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.database.session import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("dscribe")

settings = get_settings()

DESCRIPTION = """
REST API for the **DScribe Patient Admission Management** application.

* Admit, update, discharge and remove patients
* Search by name, filter by ward / department / doctor, paginate results
* Dashboard statistics for wards, departments and recent admissions
* Central option lists so the frontend never duplicates hospital configuration

Interactive documentation is available at `/docs` (Swagger UI) and `/redoc`.
"""


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Safe on every boot: creates missing tables, never deletes existing records.
    init_db()
    logger.info("Database ready at %s", settings.database_url.split("://", 1)[0] + "://…")
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="DScribe Patient Admission API",
        description=DESCRIPTION,
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        openapi_tags=[
            {"name": "Health", "description": "Service and database health."},
            {"name": "Patients", "description": "Patient admission records."},
            {"name": "Dashboard", "description": "Aggregated statistics."},
            {"name": "Configuration", "description": "Central option lists."},
        ],
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    register_exception_handlers(application)
    application.include_router(api_router)

    @application.get("/", include_in_schema=False)
    def root() -> dict:
        return {
            "name": "DScribe Patient Admission API",
            "version": __version__,
            "documentation": "/docs",
            "health": "/api/health",
        }

    return application


app = create_app()
