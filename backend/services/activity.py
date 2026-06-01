from __future__ import annotations

from typing import Optional

from fastapi import Request

from db.database import SessionLocal
from db import repository


def log_user_activity(
    user_id: int,
    action: str,
    resource: str = "",
    detail: str = "",
    request: Optional[Request] = None,
) -> None:
    ip = ""
    if request and request.client:
        ip = request.client.host or ""
    db = SessionLocal()
    try:
        repository.log_activity(
            db, user_id, action, resource=resource, detail=detail, ip_address=ip
        )
    finally:
        db.close()


def get_user_id_from_request(request: Request) -> Optional[int]:
    user = getattr(request.state, "user", None)
    if not user:
        return None
    return user.get("user_id")
