import re
import ssl
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import settings
from db.base import Base

database_url = (settings.database_url or "").strip()
if not database_url:
    raise RuntimeError("DATABASE_URL is not set.")

if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

database_url = re.sub(r"[?&]sslmode=[^&]+", "", database_url, flags=re.IGNORECASE)
database_url = re.sub(r"\?&", "?", database_url).rstrip("?")

connect_args = {"statement_cache_size": 0}
if "supabase" in database_url.lower() or "sslmode=require" in (settings.database_url or "").lower():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ctx

engine = create_async_engine(database_url, echo=settings.database_echo, connect_args=connect_args)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
