from fastapi import APIRouter, HTTPException, Request

from models.schemas import LoginRequest, LoginResponse, SignupRequest, UserProfile
from services.auth import (
    authenticate_user,
    create_access_token,
    register_user,
    validate_email,
    validate_password,
)
from services.activity import log_user_activity
from db.database import SessionLocal
from db import repository

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/health")
async def auth_health():
    return {"status": "ok", "database": "sqlite"}


@router.post("/signup", response_model=LoginResponse)
async def signup(body: SignupRequest, request: Request):
    if not validate_email(body.email):
        raise HTTPException(400, "Invalid email format")
    pw_err = validate_password(body.password)
    if pw_err:
        raise HTTPException(400, pw_err)
    try:
        user = register_user(
            body.email,
            body.password,
            body.name,
            department=body.department,
        )
    except ValueError as e:
        raise HTTPException(409, str(e)) from e
    token = create_access_token(user)
    log_user_activity(user["user_id"], "signup", "auth", request=request)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(**user),
    )


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, request: Request):
    user = authenticate_user(body.email, body.password)
    if not user:
        raise HTTPException(401, "Invalid email or password")
    token = create_access_token(user)
    log_user_activity(user["user_id"], "login", "auth", request=request)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(**user),
    )


@router.get("/me", response_model=UserProfile)
async def me(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(401, "Not authenticated")
    return UserProfile(**user)
