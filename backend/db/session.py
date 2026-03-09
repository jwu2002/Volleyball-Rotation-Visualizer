from collections.abc import AsyncGenerator
import re
import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import settings
from db.base import Base

database_url = (settings.database_url or "").strip()
if not database_url:
    raise RuntimeError(
        "DATABASE_URL is not set. In Railway: Backend service → Variables → add DATABASE_URL as a Reference to your Postgres service → DATABASE_PUBLIC_URL (or DATABASE_URL)."
    )
# Unresolved Railway reference or wrong value looks like ${{...}} or is not a URL
if "${{" in database_url or not database_url.startswith("postgresql"):
    hint = database_url[:60] + "..." if len(database_url) > 60 else database_url
    raise RuntimeError(
        f"DATABASE_URL does not look like a Postgres URL (got: {hint!r}). "
        "In Railway: Backend → Variables → DATABASE_URL must be a Reference to Postgres → DATABASE_PUBLIC_URL. "
        "If you use a raw value, paste the full postgresql://... string from the Postgres service."
    )
if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

use_ssl = "sslmode=require" in database_url.lower()
# Railway public Postgres (*.proxy.rlwy.net) requires SSL
if "rlwy.net" in database_url or "railway" in database_url:
    use_ssl = True
database_url = re.sub(r"[?&]sslmode=[^&]+", "", database_url, flags=re.IGNORECASE)
database_url = re.sub(r"\?&", "?", database_url).rstrip("?")

connect_args = {}
if use_ssl:
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx
# Disable prepared statement cache when using pgbouncer (e.g. Supabase) in transaction/statement mode
connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    database_url,
    echo=settings.database_echo,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


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
