from __future__ import annotations

import bcrypt

from sqlalchemy import text

from db.database import Base, SessionLocal, engine
from db import repository


def _migrate_schema() -> None:
    """Add columns introduced after initial release (SQLite-safe)."""
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE vital_readings ADD COLUMN spo2 FLOAT DEFAULT 98.0"))
            conn.commit()
        except Exception:
            pass

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


def _seed_user_vitals(db, user_id: int) -> None:
    latest = repository.get_latest_vital(db, user_id)
    if latest.get("source") != "default":
        return
    for i in range(5):
        repository.ingest_vital(
            db,
            user_id,
            heart_rate=70 + user_id * 3,
            stress_level=40 + user_id * 8,
            spo2=round(97.5 - i * 0.3, 1),
            simulated_mood="calm",
            sleep_hours=6.5,
        )


def ensure_demo_users(db) -> None:
    """Create or reset demo accounts so logins always work for demos."""
    for spec in DEMO_USERS:
        existing = repository.get_user_by_email(db, spec["email"])
        pw_hash = hash_password(spec["password"])
        if existing:
            existing.password_hash = pw_hash
            existing.role = spec["role"]
            existing.name = spec["name"]
            existing.department = spec["department"]
            db.commit()
            db.refresh(existing)
            user = existing
        else:
            user = repository.create_user(
                db,
                email=spec["email"],
                password_hash=pw_hash,
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
            _seed_user_vitals(db, user.id)


def init_database() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_schema()
    db = SessionLocal()
    try:
        ensure_demo_users(db)
    finally:
        db.close()
