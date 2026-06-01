from __future__ import annotations

import bcrypt

from db.database import Base, SessionLocal, engine
from db import repository

DEMO_USERS = [
    {
        "email": "user@ethio.dev",
        "password": "user123",
        "role": "user",
        "name": "Personal User",
        "department": "Engineering",
    },
    {
        "email": "hr@ethio.dev",
        "password": "hr123",
        "role": "hr",
        "name": "HR Manager",
        "department": "HR & Wellness",
    },
    {
        "email": "doctor@ethio.dev",
        "password": "doc123",
        "role": "doctor",
        "name": "Clinical Doctor",
        "department": "Internal Medicine",
    },
    {
        "email": "sara@ethio.dev",
        "password": "user123",
        "role": "user",
        "name": "Sara M.",
        "department": "Cardiology",
    },
    {
        "email": "dawit@ethio.dev",
        "password": "user123",
        "role": "user",
        "name": "Dawit H.",
        "department": "Oncology",
    },
    {
        "email": "hanna@ethio.dev",
        "password": "user123",
        "role": "user",
        "name": "Hanna T.",
        "department": "Maternity",
    },
]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def init_database() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for spec in DEMO_USERS:
            existing = repository.get_user_by_email(db, spec["email"])
            if existing:
                continue
            user = repository.create_user(
                db,
                email=spec["email"],
                password_hash=hash_password(spec["password"]),
                name=spec["name"],
                role=spec["role"],
                department=spec["department"],
            )
            if user.role == "user":
                priv = repository.get_privacy(db, user.id)
                priv.share_with_hr = True
                priv.share_with_doctor = True
                priv.share_journal_summary = True
                db.commit()
                for _ in range(5):
                    repository.ingest_vital(
                        db,
                        user.id,
                        heart_rate=70 + user.id * 3,
                        stress_level=40 + user.id * 8,
                        simulated_mood="calm",
                        sleep_hours=6.5,
                    )
    finally:
        db.close()
