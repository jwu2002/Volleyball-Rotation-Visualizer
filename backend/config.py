from typing import Optional

from pydantic_settings import BaseSettings


def parse_cors_origins(v: Optional[str]) -> list[str]:
    if not v or not v.strip():
        return []
    return [o.strip() for o in v.split(",") if o.strip()]


class Settings(BaseSettings):
    database_url: str = ""
    database_echo: bool = False
    firebase_project_id: Optional[str] = None
    cors_origins: Optional[str] = None
    rate_limit: str = "20/minute"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
