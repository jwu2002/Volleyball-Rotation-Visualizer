from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user_id
from db.session import get_db
from models.lineup import Lineup
from schemas.lineup import LineupCreate, LineupOut, LineupUpdate

router = APIRouter()


def _lineup_to_out(row: Lineup) -> LineupOut:
    return LineupOut(
        id=str(row.id),
        lineup=row.payload,
        name=row.name,
        show_number=row.show_number,
        show_name=row.show_name,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("", response_model=list[LineupOut])
async def list_lineups(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(select(Lineup).where(Lineup.user_id == user_id).order_by(Lineup.updated_at.desc()))
    rows = result.scalars().all()
    return [_lineup_to_out(r) for r in rows]


@router.post("", response_model=LineupOut, status_code=status.HTTP_201_CREATED)
async def create_lineup(
    body: LineupCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    row = Lineup(
        user_id=user_id,
        name=body.name,
        payload=body.lineup,
        show_number=body.show_number,
        show_name=body.show_name,
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return _lineup_to_out(row)


@router.get("/{lineup_id}", response_model=LineupOut)
async def get_lineup(
    lineup_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Lineup).where(Lineup.id == lineup_id, Lineup.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    return _lineup_to_out(row)


@router.put("/{lineup_id}", response_model=LineupOut)
async def update_lineup(
    lineup_id: UUID,
    body: LineupUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Lineup).where(Lineup.id == lineup_id, Lineup.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    if body.name is not None:
        row.name = body.name
    if body.lineup is not None:
        row.payload = body.lineup
    if body.show_number is not None:
        row.show_number = body.show_number
    if body.show_name is not None:
        row.show_name = body.show_name
    row.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(row)
    return _lineup_to_out(row)


@router.delete("/{lineup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lineup(
    lineup_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Lineup).where(Lineup.id == lineup_id, Lineup.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    await db.delete(row)
    await db.flush()

