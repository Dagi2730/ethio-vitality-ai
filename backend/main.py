import asyncio
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv(override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# API Routes
from api.auth_routes import router as auth_router
from api.routes import router

# Infrastructure
from db.init_db import init_database
from middleware.auth_middleware import AuthMiddleware
from services.reminder_service import reminder_scheduler_loop
from services.simulation import simulator


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- [System] Initializing Database ---")
    init_database()

    use_hardware = os.getenv("USE_HARDWARE", "false").lower() == "true"

    if not use_hardware:
        print("--- [System] Hardware mode DISABLED: Starting Vitals Simulator ---")
        await simulator.start()
    else:
        print("--- [System] Hardware mode ENABLED: Expecting Serial Data ---")

    asyncio.create_task(reminder_scheduler_loop())

    yield

    if not use_hardware:
        print("--- [System] Stopping Vitals Simulator ---")
        await simulator.stop()


# ── Allowed origins ────────────────────────────────────────────────────────────
# List every exact origin allowed to call this API.
# Never use ["*"] with allow_credentials=True — it is invalid and breaks auth.
CORS_ORIGINS: list[str] = [
    # Production Vercel deployment
    "https://ethio-vitality-ai.vercel.app",
    # Local development
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# Regex covers ALL Vercel preview deployments automatically
# e.g. https://ethio-vitality-ai-abc123-dagi2730.vercel.app
CORS_ORIGIN_REGEX = r"https://ethio-vitality.*\.vercel\.app"


app = FastAPI(
    title="Ethio-Vitality AI",
    description="B2B2C wellness API — SQLite + JWT + RBAC",
    version="3.0.0",
    lifespan=lifespan,
)

# ── CORS middleware — must be registered BEFORE AuthMiddleware ─────────────────
# The browser sends an OPTIONS preflight before every credentialed POST/PUT.
# If AuthMiddleware runs first, it rejects the preflight with 401 before CORS
# headers are added — causing the exact error you saw.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,           # required for Authorization: Bearer
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
    max_age=600,                      # cache preflight for 10 minutes
)

# Custom auth middleware — registered after CORS so preflights pass through
app.add_middleware(AuthMiddleware)

# Routers
app.include_router(auth_router)
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)