from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VisualizerConfigCreate(BaseModel):
    name: str = Field(..., min_length=1)
    system: str = Field(..., pattern="^(5-1|6-2)$")
    rotations: list[dict] = Field(...)  # list of { players, annotations }


class VisualizerConfigUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    system: Optional[str] = Field(None, pattern="^(5-1|6-2)$")
    rotations: Optional[list] = None


class VisualizerConfigOut(BaseModel):
    id: str
    name: str
    system: str
    rotations: list[dict]
    created_at: Optional[datetime] = Field(None, serialization_alias="createdAt")
    updated_at: Optional[datetime] = Field(None, serialization_alias="updatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True, "serialize_by_alias": True}
