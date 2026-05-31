from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.wellness import generate_wellness_advice

app = FastAPI()

# Enable CORS for frontend/React integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state - Always include all keys to prevent errors
latest_data = {"heart_rate": 0, "stress_level": 0, "timestamp": "N/A"}

@app.get("/api/v1/sensors/latest")
async def get_latest():
    return latest_data

@app.get("/api/v1/wellness/advice")
async def get_advice(lang: str = "en"):
    return generate_wellness_advice(latest_data["stress_level"], lang)