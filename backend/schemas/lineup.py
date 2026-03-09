import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

MAX_LINEUP_NAME_LENGTH = 200


def _sanitize_name(v: str, max_len: int = MAX_LINEUP_NAME_LENGTH) -> str:
    """Strip and limit length. Remove control characters."""
    if not isinstance(v, str):
        return v
    s = re.sub(r"[\x00-\x1f\x7f]", "", v.strip())
    return s[:max_len] if len(s) > max_len else s


# Payload is the Lineup object: { [position]: { firstName, lastName, number } }
class LineupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=MAX_LINEUP_NAME_LENGTH)
    lineup: dict = Field(..., validation_alias="lineup")
    show_number: bool = Field(True, validation_alias="showNumber")
    show_name: bool = Field(False, validation_alias="showName")

    model_config = {"populate_by_name": True}

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        s = _sanitize_name(v)
        if not s:
            raise ValueError("Name cannot be empty after sanitization")
        return s


class LineupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=MAX_LINEUP_NAME_LENGTH)
    lineup: Optional[dict] = Field(None, validation_alias="lineup")
    show_number: Optional[bool] = Field(None, validation_alias="showNumber")
    show_name: Optional[bool] = Field(None, validation_alias="showName")

    model_config = {"populate_by_name": True}

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        s = _sanitize_name(v)
        return s if s else None


class LineupOut(BaseModel):
    id: str  # UUID as string for frontend
    name: str
    lineup: dict = Field(..., validation_alias="payload", serialization_alias="lineup")
    show_number: bool = Field(..., serialization_alias="showNumber")
    show_name: bool = Field(..., serialization_alias="showName")
    created_at: Optional[datetime] = Field(None, serialization_alias="createdAt")
    updated_at: Optional[datetime] = Field(None, serialization_alias="updatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True, "serialize_by_alias": True}
