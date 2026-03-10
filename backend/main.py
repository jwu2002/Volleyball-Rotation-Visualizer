import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from api.deps import limiter
from api.routes import configs, lineups
from config import parse_cors_origins, settings
from db.session import engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.firebase_project_id:
        logger.info("Firebase auth: project_id=%s (must match frontend)", settings.firebase_project_id)
    else:
        logger.warning("Firebase project ID not set; auth will return 503 for protected routes")
    yield
    await engine.dispose()


app = FastAPI(
    title="Volleyball Rotation Visualizer API",
    description="Backend for saved lineups and visualizer configs.",
    version="0.1.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

_origins = ["http://localhost:5173", "http://localhost:3000"]
if settings.cors_origins:
    _origins.extend(parse_cors_origins(settings.cors_origins))
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


class LogRequestsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info("Request: %s %s", request.method, request.url.path)
        return await call_next(request)


app.add_middleware(LogRequestsMiddleware)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(lineups.router, prefix="/lineups", tags=["lineups"])
app.include_router(configs.router, prefix="/configs", tags=["configs"])
