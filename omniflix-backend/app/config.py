from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Validated at import time — missing or malformed values cause an
    immediate startup failure so misconfigurations surface early.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    SECRET_KEY: str
    DATABASE_URL: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 5
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5555,http://127.0.0.1:5555"

    @property
    def parsed_cors_origins(self) -> list[str]:
        """Return a cleaned list of allowed CORS origin URLs.

        Splits comma-separated origin strings and strips trailing whitespace/slashes.
        """
        raw_origins = [
            origin.strip().rstrip("/")
            for origin in self.CORS_ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]
        return raw_origins


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton (created once, reused everywhere)."""
    return Settings()

