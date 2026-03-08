from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user_id
from db.session import get_db
from models.visualizer_config import VisualizerConfig
from schemas.visualizer_config import VisualizerConfigCreate, VisualizerConfigOut, VisualizerConfigUpdate

router = APIRouter()


def _config_to_out(row: VisualizerConfig) -> VisualizerConfigOut:
    return VisualizerConfigOut(
        id=str(row.id),
        name=row.name,
        system=row.system,
        rotations=row.rotations,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("", response_model=list[VisualizerConfigOut])
async def list_configs(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(VisualizerConfig).where(VisualizerConfig.user_id == user_id).order_by(VisualizerConfig.updated_at.desc())
    )
    rows = result.scalars().all()
    return [_config_to_out(r) for r in rows]


@router.post("", response_model=VisualizerConfigOut, status_code=status.HTTP_201_CREATED)
async def create_config(
    body: VisualizerConfigCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    row = VisualizerConfig(
        user_id=user_id,
        name=body.name,
        system=body.system,
        rotations=body.rotations,
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return _config_to_out(row)


@router.get("/{config_id}", response_model=VisualizerConfigOut)
async def get_config(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(VisualizerConfig).where(
            VisualizerConfig.id == config_id,
            VisualizerConfig.user_id == user_id,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config not found")
    return _config_to_out(row)


@router.put("/{config_id}", response_model=VisualizerConfigOut)
async def update_config(
    config_id: UUID,
    body: VisualizerConfigUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(VisualizerConfig).where(
            VisualizerConfig.id == config_id,
            VisualizerConfig.user_id == user_id,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config not found")
    if body.name is not None:
        row.name = body.name
    if body.system is not None:
        row.system = body.system
    if body.rotations is not None:
        row.rotations = body.rotations
    row.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(row)
    return _config_to_out(row)


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_config(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(VisualizerConfig).where(
            VisualizerConfig.id == config_id,
            VisualizerConfig.user_id == user_id,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config not found")
    await db.delete(row)
    await db.flush()
