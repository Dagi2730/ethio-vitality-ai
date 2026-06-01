from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth_routes import router as auth_router
from api.routes import router
from middleware.auth_middleware import AuthMiddleware
from services.simulation import simulator

# Frontend dev origins (Vite)
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await simulator.start()
    yield
    await simulator.stop()


app = FastAPI(
    title="Ethio-Vitality AI",
    description="B2B2C wellness API — JWT + RBAC + MQTT-ready Digital Twin",
    version="2.0.0",
    lifespan=lifespan,
)

# Auth runs first; CORS added last so it wraps ALL responses (including 401/403).
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Role", "Accept"],
    expose_headers=["*"],
)

app.include_router(auth_router)
app.include_router(router)
