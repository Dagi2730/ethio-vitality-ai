from fastapi import APIRouter, HTTPException

from models.schemas import LoginRequest, LoginResponse, UserProfile
from services.auth import authenticate_user, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/health")
async def auth_health():
    return {"status": "ok"}


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    user = authenticate_user(body.email, body.password)
    if not user:
        raise HTTPException(401, "Invalid email or password")
    token = create_access_token(user)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(**user),
    )
