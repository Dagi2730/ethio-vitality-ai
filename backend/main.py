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
    "import.meta.env.VITE_API_URL",
    "http://localhost:5173",
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

CORS_ORIGINS = [
    "https://ethio-vitality-ai.vercel.app",
    "http://localhost:5173",
]

app = FastAPI(title="Ethio-Vitality AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,           # Matches your frontend URL
    allow_credentials=True,               # Required for Auth/JWT
    allow_methods=["*"],                  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],                  # Allows Authorization headers
)

# Include Routers
app.include_router(auth_router)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="import.meta.env.VITE_API_URL", port=8000, reload=True)