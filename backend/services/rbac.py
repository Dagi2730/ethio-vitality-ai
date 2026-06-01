"""
RBAC — role checks via Depends() aligned with JWT claims.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from fastapi import Depends, HTTPException, Request


class Role(str, Enum):
    USER = "user"
    HR = "hr"
    DOCTOR = "doctor"

    @classmethod
    def professional_roles(cls) -> tuple["Role", ...]:
        return (cls.HR, cls.DOCTOR)


def get_current_user(request: Request) -> dict[str, Any]:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(401, "Not authenticated")
    return user


def get_current_role(user: dict = Depends(get_current_user)) -> Role:
    try:
        return Role(user["role"])
    except ValueError:
        raise HTTPException(403, "Invalid role in token")


def is_authorized(*allowed: Role):
    """FastAPI dependency factory — e.g. Depends(is_authorized(Role.HR, Role.DOCTOR))."""

    async def checker(role: Role = Depends(get_current_role)) -> Role:
        if role not in allowed:
            raise HTTPException(
                403,
                f"Forbidden: role '{role.value}' cannot access this resource",
            )
        return role

    return checker


# Shorthand dependencies
require_user = is_authorized(Role.USER)
require_professional = is_authorized(Role.HR, Role.DOCTOR)
require_hr = is_authorized(Role.HR)
require_doctor = is_authorized(Role.DOCTOR)


def mask_for_professional(data: dict, role: Role) -> dict:
    blocked = {
        "user_id",
        "name",
        "email",
        "phone",
        "journal_text",
        "chat_history",
        "raw_journal",
    }
    return {k: v for k, v in data.items() if k not in blocked}
