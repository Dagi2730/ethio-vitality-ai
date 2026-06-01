"""
Auth middleware — gatekeeper: validates JWT before API logic runs.
"""
from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from db.database import SessionLocal
from db import repository
from services.auth import PUBLIC_PATHS, decode_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        if not path.startswith("/api/v1"):
            return await call_next(request)

        if path in PUBLIC_PATHS:
            return await call_next(request)

        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header"},
            )

        token = auth[7:].strip()
        try:
            payload = decode_token(token)
            email = payload.get("sub")
            user_id = payload.get("user_id")
            if not user_id and email:
                db = SessionLocal()
                try:
                    db_user = repository.get_user_by_email(db, email)
                    user_id = db_user.id if db_user else None
                finally:
                    db.close()
            request.state.user = {
                "email": email,
                "user_id": user_id,
                "role": payload.get("role", "user"),
                "name": payload.get("name", ""),
            }
        except ValueError:
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

        return await call_next(request)
