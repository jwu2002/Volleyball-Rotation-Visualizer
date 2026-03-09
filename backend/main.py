import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes import configs, lineups, plans
from config import settings
from db.base import Base
from db.session import engine
from models import Lineup, Plan, VisualizerConfig

logger = logging.getLogger(__name__)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    if settings.firebase_project_id:
        logger.info("Firebase auth: project_id=%s (must match frontend)", settings.firebase_project_id)
    else:
        logger.warning("Firebase project ID not set; auth will return 503 for protected routes")
    yield
    await engine.dispose()


app = FastAPI(
    title="Volleyball Rotation Visualizer API",
    description="Backend for saved lineups, visualizer configs, and plans.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(lineups.router, prefix="/lineups", tags=["lineups"])
app.include_router(configs.router, prefix="/configs", tags=["configs"])
app.include_router(plans.router, prefix="/plans", tags=["plans"])
