from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Load from environment or .env file."""

    database_url: str = ""
    database_echo: bool = False

    firebase_project_id: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
