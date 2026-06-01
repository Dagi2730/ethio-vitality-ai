"""
JWT authentication — demo users for B2B2C (replace with IdP in production).
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from dotenv import load_dotenv
from jose import JWTError, jwt

from services.rbac import Role

load_dotenv(override=True)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ethio-vitality-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

# Demo accounts (passwords hashed at runtime on first verify — store plain for demo simplicity)
DEMO_USERS: dict[str, dict[str, Any]] = {
    "user@ethio.dev": {
        "password": "user123",
        "role": Role.USER,
        "name": "Personal User",
    },
    "hr@ethio.dev": {
        "password": "hr123",
        "role": Role.HR,
        "name": "HR Manager",
    },
    "doctor@ethio.dev": {
        "password": "doc123",
        "role": Role.DOCTOR,
        "name": "Clinical Doctor",
    },
}

PUBLIC_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}


def verify_password(plain: str, stored: str) -> bool:
    return plain == stored


def authenticate_user(email: str, password: str) -> Optional[dict[str, Any]]:
    record = DEMO_USERS.get(email.lower().strip())
    if not record or not verify_password(password, record["password"]):
        return None
    return {
        "email": email.lower().strip(),
        "role": record["role"].value,
        "name": record["name"],
    }


def create_access_token(user: dict[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user["email"],
        "role": user["role"],
        "name": user.get("name", ""),
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e
