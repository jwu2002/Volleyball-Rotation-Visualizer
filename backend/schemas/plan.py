from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# Frontend sends full plan payload; we store as one JSONB.
class PlanCreate(BaseModel):
    name: str = Field(..., min_length=1)
    payload: dict = Field(...)  # { lineupA, lineupB, systemA, systemB, serveTeam, rotationA, rotationB, annotations }


class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    payload: Optional[dict] = None


class PlanOut(BaseModel):
    id: str
    name: str
    payload: dict
    created_at: Optional[datetime] = Field(None, serialization_alias="createdAt")
    updated_at: Optional[datetime] = Field(None, serialization_alias="updatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True, "serialize_by_alias": True}
