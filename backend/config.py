from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Load from environment or .env file."""

    database_url: str = ""

    firebase_project_id: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
