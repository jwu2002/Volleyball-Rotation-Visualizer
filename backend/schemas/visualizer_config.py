from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

MAX_CONFIG_NAME_LENGTH = 200


def _sanitize_name(v: str, max_len: int = MAX_CONFIG_NAME_LENGTH) -> str:
    """Strip and limit length. Remove control characters."""
    if not isinstance(v, str):
        return v
    s = re.sub(r"[\x00-\x1f\x7f]", "", v.strip())
    return s[:max_len] if len(s) > max_len else s


class VisualizerConfigCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=MAX_CONFIG_NAME_LENGTH)
    system: str = Field(..., pattern="^(5-1|6-2)$")
    rotations: list[dict] = Field(...)  # list of { players, annotations }

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        s = _sanitize_name(v)
        if not s:
            raise ValueError("Name cannot be empty after sanitization")
        return s


class VisualizerConfigUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=MAX_CONFIG_NAME_LENGTH)
    system: Optional[str] = Field(None, pattern="^(5-1|6-2)$")
    rotations: Optional[list] = None

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        s = _sanitize_name(v)
        return s if s else None


class VisualizerConfigOut(BaseModel):
    id: str
    name: str
    system: str
    rotations: list[dict]
    created_at: Optional[datetime] = Field(None, serialization_alias="createdAt")
    updated_at: Optional[datetime] = Field(None, serialization_alias="updatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True, "serialize_by_alias": True}
