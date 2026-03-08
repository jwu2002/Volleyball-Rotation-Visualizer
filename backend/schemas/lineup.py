from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# Payload is the Lineup object: { [position]: { firstName, lastName, number } }
class LineupCreate(BaseModel):
    name: str = Field(..., min_length=1)
    lineup: dict = Field(..., validation_alias="lineup")
    show_number: bool = Field(True, validation_alias="showNumber")
    show_name: bool = Field(False, validation_alias="showName")

    model_config = {"populate_by_name": True}


class LineupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    lineup: Optional[dict] = Field(None, validation_alias="lineup")
    show_number: Optional[bool] = Field(None, validation_alias="showNumber")
    show_name: Optional[bool] = Field(None, validation_alias="showName")

    model_config = {"populate_by_name": True}


class LineupOut(BaseModel):
    id: str  # UUID as string for frontend
    name: str
    lineup: dict = Field(..., validation_alias="payload", serialization_alias="lineup")
    show_number: bool = Field(..., serialization_alias="showNumber")
    show_name: bool = Field(..., serialization_alias="showName")
    created_at: Optional[datetime] = Field(None, serialization_alias="createdAt")
    updated_at: Optional[datetime] = Field(None, serialization_alias="updatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True, "serialize_by_alias": True}
