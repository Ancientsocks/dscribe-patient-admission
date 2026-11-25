"""Centralised application errors and exception handlers.

Every failure leaves the API as a predictable envelope:

    {"error": {"code": "...", "message": "...", "details": [{"field": "...", "message": "..."}]}}

``detail`` is also populated with the human readable message so that generic
OpenAPI clients still see something useful.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("dscribe.errors")


class ApiError(Exception):
    """Base class for expected, user-facing API failures."""

    status_code: int = 400
    code: str = "BAD_REQUEST"

    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        code: Optional[str] = None,
        details: Optional[List[Dict[str, str]]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        self.details = details or []


class NotFoundError(ApiError):
    status_code = 404
    code = "NOT_FOUND"


class ConflictError(ApiError):
    status_code = 409
    code = "CONFLICT"


class ValidationError(ApiError):
    status_code = 422
    code = "VALIDATION_ERROR"


def error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[List[Dict[str, Any]]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": message,
            "error": {"code": code, "message": message, "details": details or []},
        },
        headers=headers,
    )


_FIELD_LABELS = {
    "name": "Name",
    "age": "Age",
    "gender": "Gender",
    "ward": "Ward",
    "department": "Department",
    "doctor": "Doctor",
    "admission_date": "Admission date",
    "status": "Status",
}


def _format_pydantic_errors(exc: RequestValidationError) -> List[Dict[str, str]]:
    details: List[Dict[str, str]] = []
    for error in exc.errors():
        location = [str(part) for part in error.get("loc", ()) if part not in ("body", "query", "path")]
        field = ".".join(location) if location else "request"
        message = error.get("msg", "Invalid value.")
        message = message.replace("Value error, ", "").replace("Input should be ", "should be ")
        label = _FIELD_LABELS.get(field, field.replace("_", " ").capitalize())
        # Pydantic messages for enum/bounds errors read better with the field label.
        if not message.lower().startswith(field.replace("_", " ").lower()):
            message = f"{label}: {message}" if not message.lower().startswith(label.lower()) else message
        details.append({"field": field, "message": message})
    return details


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
        return error_response(exc.status_code, exc.code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = _format_pydantic_errors(exc)
        message = details[0]["message"] if details else "The submitted data is invalid."
        return error_response(422, "VALIDATION_ERROR", message, details)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        message = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return error_response(
            exc.status_code,
            f"HTTP_{exc.status_code}",
            message,
            headers=dict(getattr(exc, "headers", None) or {}),
        )

    @app.exception_handler(OperationalError)
    async def _db_unavailable_handler(_: Request, exc: OperationalError) -> JSONResponse:
        logger.error("Database unavailable: %s", exc)
        return error_response(
            503,
            "DATABASE_UNAVAILABLE",
            "The patient database is currently unavailable. Please try again shortly.",
        )

    @app.exception_handler(IntegrityError)
    async def _integrity_handler(_: Request, exc: IntegrityError) -> JSONResponse:
        logger.warning("Database constraint violation: %s", exc)
        return error_response(
            409,
            "CONSTRAINT_VIOLATION",
            "The record violates a database constraint. Please review the submitted values.",
        )

    @app.exception_handler(SQLAlchemyError)
    async def _sqlalchemy_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.exception("Database error", exc_info=exc)
        return error_response(500, "DATABASE_ERROR", "A database error occurred. Please try again.")

    @app.exception_handler(Exception)
    async def _unhandled_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error", exc_info=exc)
        return error_response(
            500,
            "INTERNAL_ERROR",
            "Something went wrong on our side. Please try again.",
        )
