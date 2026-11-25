"""Application configuration loaded from environment variables / .env file."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "DScribe Patient Admission Management"
    environment: str = Field(default="development")
    debug: bool = Field(default=False)

    # SQLite by default; set DATABASE_URL to a PostgreSQL DSN for production,
    # e.g. postgresql+psycopg://user:pass@host:5432/dscribe
    database_url: str = Field(default=f"sqlite:///{BACKEND_DIR / 'dscribe.db'}")

    # Comma separated list of allowed browser origins.
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    )

    # Comma separated doctor roster (central option list).
    doctors: str = Field(default="")

    # Pagination guard rails.
    max_page_size: int = Field(default=100)

    @field_validator("database_url")
    @classmethod
    def _normalise_database_url(cls, value: str) -> str:
        value = value.strip()
        if value.startswith("postgres://"):
            # Heroku/Render style DSNs use the deprecated scheme.
            value = value.replace("postgres://", "postgresql+psycopg://", 1)
        elif value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return origins or ["http://localhost:5173"]

    @property
    def doctor_list(self) -> list[str]:
        return [doctor.strip() for doctor in self.doctors.split(",") if doctor.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()
