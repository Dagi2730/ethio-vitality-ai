"""
JWT authentication with database-backed users and bcrypt passwords.
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from dotenv import load_dotenv
from jose import JWTError, jwt

from db.database import SessionLocal
from db import repository
from db.init_db import verify_password, hash_password

load_dotenv(override=True)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ethio-vitality-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

PUBLIC_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/signup",
    "/api/v1/auth/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email.strip()))


def validate_password(password: str) -> Optional[str]:
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return "Password must include letters and numbers"
    return None


def authenticate_user(email: str, password: str) -> Optional[dict[str, Any]]:
    db = SessionLocal()
    try:
        user = repository.get_user_by_email(db, email)
        if not user or not verify_password(password, user.password_hash):
            return None
        return _user_payload(user)
    finally:
        db.close()


def register_user(
    email: str,
    password: str,
    name: str,
    department: str = "General",
) -> dict[str, Any]:
    db = SessionLocal()
    try:
        if repository.get_user_by_email(db, email):
            raise ValueError("Email already registered")
        user = repository.create_user(
            db,
            email=email,
            password_hash=hash_password(password),
            name=name.strip(),
            role="user",
            department=department.strip() or "General",
        )
        repository.log_activity(db, user.id, "signup", "auth", detail=email)
        return _user_payload(user)
    finally:
        db.close()


def create_access_token(user: dict[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user["email"],
        "user_id": user.get("user_id"),
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


def _user_payload(user) -> dict[str, Any]:
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "department": user.department,
    }
