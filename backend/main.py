import asyncio
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# 1. Load environment variables immediately
# Ensure .env is in the 'backend' folder
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

# Configure allowed origins for CORS
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    print("--- [System] Initializing Database ---")
    init_database()
    
    use_hardware = os.getenv("USE_HARDWARE", "false").lower() == "true"
    
    if not use_hardware:
        print("--- [System] Hardware mode DISABLED: Starting Vitals Simulator ---")
        await simulator.start()
    else:
        print("--- [System] Hardware mode ENABLED: Expecting Serial Data ---")
        
    # Start background scheduler for notifications/reminders
    asyncio.create_task(reminder_scheduler_loop())
    
    yield
    
    # Shutdown tasks
    if not use_hardware:
        print("--- [System] Stopping Vitals Simulator ---")
        await simulator.stop()

app = FastAPI(
    title="Ethio-Vitality AI",
    description="B2B2C wellness API — SQLite + JWT + RBAC",
    version="3.0.0",
    lifespan=lifespan,
)

# Add Middleware
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Role", "Accept"],
    expose_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)