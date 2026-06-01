from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from db.models import (
    ActivityLog,
    HabitsProfile,
    JournalEntry,
    MoodEntry,
    Notification,
    PrivacySettings,
    User,
    VitalReading,
)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    *,
    email: str,
    password_hash: str,
    name: str,
    role: str = "user",
    department: str = "General",
) -> User:
    user = User(
        email=email.lower().strip(),
        password_hash=password_hash,
        name=name,
        role=role,
        department=department,
    )
    db.add(user)
    db.flush()
    db.add(PrivacySettings(user_id=user.id))
    db.add(
        HabitsProfile(
            user_id=user.id,
            sleep_hours_avg=6.5,
            steps_avg=5000,
            screen_time_hours=6.0,
            caffeine_cups=2,
            outdoor_minutes=30,
        )
    )
    db.commit()
    db.refresh(user)
    return user


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    resource: str = "",
    detail: str = "",
    ip_address: str = "",
) -> None:
    db.add(
        ActivityLog(
            user_id=user_id,
            action=action,
            resource=resource,
            detail=detail,
            ip_address=ip_address,
        )
    )
    db.commit()


def get_privacy(db: Session, user_id: int) -> PrivacySettings:
    row = db.query(PrivacySettings).filter(PrivacySettings.user_id == user_id).first()
    if not row:
        row = PrivacySettings(user_id=user_id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def update_privacy(db: Session, user_id: int, updates: dict[str, bool]) -> PrivacySettings:
    row = get_privacy(db, user_id)
    for k, v in updates.items():
        if hasattr(row, k):
            setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


def ingest_vital(
    db: Session,
    user_id: int,
    heart_rate: int,
    stress_level: int,
    *,
    source: str = "simulation",
    simulated_mood: Optional[str] = None,
    sleep_hours: Optional[float] = None,
) -> dict[str, Any]:
    row = VitalReading(
        user_id=user_id,
        heart_rate=heart_rate,
        stress_level=stress_level,
        source=source,
        simulated_mood=simulated_mood,
        sleep_hours=sleep_hours,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _vital_to_dict(row)


def get_latest_vital(db: Session, user_id: int) -> dict[str, Any]:
    row = (
        db.query(VitalReading)
        .filter(VitalReading.user_id == user_id)
        .order_by(desc(VitalReading.timestamp))
        .first()
    )
    if not row:
        return {
            "heart_rate": 72,
            "stress_level": 35,
            "simulated_mood": "calm",
            "sleep_hours": 6.5,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "default",
        }
    return _vital_to_dict(row)


def get_vital_history(db: Session, user_id: int, limit: int = 120) -> list[dict[str, Any]]:
    rows = (
        db.query(VitalReading)
        .filter(VitalReading.user_id == user_id)
        .order_by(desc(VitalReading.timestamp))
        .limit(limit)
        .all()
    )
    return [_vital_to_dict(r) for r in reversed(rows)]


def record_mood(db: Session, user_id: int, sentiment: str, emoji: str) -> dict[str, Any]:
    row = MoodEntry(user_id=user_id, sentiment=sentiment, emoji=emoji)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _mood_to_dict(row)


def get_latest_mood(db: Session, user_id: int) -> Optional[dict[str, Any]]:
    row = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == user_id)
        .order_by(desc(MoodEntry.timestamp))
        .first()
    )
    return _mood_to_dict(row) if row else None


def get_mood_history(db: Session, user_id: int, limit: int = 50) -> list[dict[str, Any]]:
    rows = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == user_id)
        .order_by(desc(MoodEntry.timestamp))
        .limit(limit)
        .all()
    )
    return [_mood_to_dict(r) for r in reversed(rows)]


def add_journal(
    db: Session,
    user_id: int,
    text: str,
    source: str,
    extracted_emotion: str,
    intensity: float,
    themes: list,
    summary: str,
) -> dict[str, Any]:
    row = JournalEntry(
        user_id=user_id,
        text=text,
        source=source,
        extracted_emotion=extracted_emotion,
        intensity=intensity,
        themes=json.dumps(themes),
        summary_one_line=summary,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _journal_to_dict(row, include_text=True)


def update_journal(db: Session, user_id: int, entry_id: int, text: str) -> Optional[dict[str, Any]]:
    row = (
        db.query(JournalEntry)
        .filter(JournalEntry.id == entry_id, JournalEntry.user_id == user_id)
        .first()
    )
    if not row:
        return None
    row.text = text
    row.summary_one_line = text[:80]
    db.commit()
    db.refresh(row)
    return _journal_to_dict(row, include_text=True)


def get_journal_entries(
    db: Session, user_id: int, limit: int = 30, include_text: bool = False
) -> list[dict[str, Any]]:
    rows = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user_id)
        .order_by(desc(JournalEntry.timestamp))
        .limit(limit)
        .all()
    )
    return [_journal_to_dict(r, include_text=include_text) for r in reversed(rows)]


def get_habits(db: Session, user_id: int) -> dict[str, Any]:
    row = db.query(HabitsProfile).filter(HabitsProfile.user_id == user_id).first()
    if not row:
        row = HabitsProfile(user_id=user_id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return {
        "sleep_hours_avg": row.sleep_hours_avg,
        "steps_avg": row.steps_avg,
        "screen_time_hours": row.screen_time_hours,
        "caffeine_cups": row.caffeine_cups,
        "outdoor_minutes": row.outdoor_minutes,
    }


def update_habits(db: Session, user_id: int, updates: dict[str, Any]) -> dict[str, Any]:
    row = db.query(HabitsProfile).filter(HabitsProfile.user_id == user_id).first()
    if not row:
        row = HabitsProfile(user_id=user_id)
        db.add(row)
    for k, v in updates.items():
        if v is not None and hasattr(row, k):
            setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return get_habits(db, user_id)


def list_users_for_professional(
    db: Session, viewer_role: str, limit: int = 100
) -> list[User]:
    q = db.query(User).filter(User.role == "user")
    users = q.limit(limit).all()
    filtered = []
    for u in users:
        priv = get_privacy(db, u.id)
        if viewer_role == "hr" and not priv.share_with_hr:
            continue
        if viewer_role == "doctor" and not priv.share_with_doctor:
            continue
        filtered.append(u)
    return filtered


def get_department_aggregates(db: Session, viewer_role: str) -> list[dict[str, Any]]:
    users = list_users_for_professional(db, viewer_role)
    dept_map: dict[str, list[float]] = {}
    for u in users:
        latest = get_latest_vital(db, u.id)
        priv = get_privacy(db, u.id)
        if not priv.share_vitals:
            continue
        stress = float(latest.get("stress_level", 0))
        dept_map.setdefault(u.department, []).append(stress)

    result = []
    for dept, stresses in dept_map.items():
        avg = round(sum(stresses) / len(stresses), 1) if stresses else 0
        result.append(
            {
                "department": dept,
                "average_stress": avg,
                "headcount": len(stresses),
            }
        )
    return result


def get_clinical_patients(db: Session) -> list[dict[str, Any]]:
    users = list_users_for_professional(db, "doctor")
    patients = []
    for u in users:
        priv = get_privacy(db, u.id)
        latest = get_latest_vital(db, u.id)
        mood = get_latest_mood(db, u.id) if priv.share_mood else None
        stress = int(latest.get("stress_level", 0)) if priv.share_vitals else 0
        hr = int(latest.get("heart_rate", 0)) if priv.share_vitals else 0
        risk = "high" if stress >= 70 else "medium" if stress >= 45 else "low"
        patients.append(
            {
                "id": str(u.id),
                "name": u.name,
                "department": u.department,
                "room": f"Ward-{u.id % 5 + 1}{chr(65 + u.id % 4)}",
                "heartRate": hr,
                "stressLevel": stress,
                "simulatedMood": latest.get("simulated_mood") or (mood or {}).get("sentiment", "calm"),
                "riskBand": risk,
                "lastUpdated": latest.get("timestamp", ""),
            }
        )
    return patients


def get_patient_stress_trend(db: Session, patient_id: int, limit: int = 12) -> list[dict[str, Any]]:
    rows = (
        db.query(VitalReading)
        .filter(VitalReading.user_id == patient_id)
        .order_by(desc(VitalReading.timestamp))
        .limit(limit)
        .all()
    )
    return [
        {"t": f"-{(len(rows) - i - 1) * 5}m", "stress": r.stress_level}
        for i, r in enumerate(reversed(rows))
    ]


def create_notification(
    db: Session, user_id: int, title: str, message: str, ntype: str = "reminder"
) -> dict[str, Any]:
    row = Notification(user_id=user_id, title=title, message=message, ntype=ntype)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _notification_to_dict(row)


def get_notifications(db: Session, user_id: int, unread_only: bool = False) -> list[dict[str, Any]]:
    q = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        q = q.filter(Notification.read.is_(False))
    rows = q.order_by(desc(Notification.created_at)).limit(50).all()
    return [_notification_to_dict(r) for r in rows]


def mark_notification_read(db: Session, user_id: int, notification_id: int) -> bool:
    row = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not row:
        return False
    row.read = True
    db.commit()
    return True


def ensure_daily_reminders(db: Session, user_id: int) -> None:
    since = datetime.now(timezone.utc) - timedelta(hours=20)
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.ntype == "daily_reminder",
            Notification.created_at >= since,
        )
        .first()
    )
    if existing:
        return
    create_notification(
        db,
        user_id,
        "Daily check-in",
        "Take a moment to log your mood and review your wellness score.",
        ntype="daily_reminder",
    )


def list_activity_logs(db: Session, user_id: int, limit: int = 50) -> list[dict[str, Any]]:
    rows = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(desc(ActivityLog.timestamp))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "action": r.action,
            "resource": r.resource,
            "detail": r.detail,
            "timestamp": r.timestamp.isoformat(),
        }
        for r in rows
    ]


def get_all_user_ids(db: Session) -> list[int]:
    return [u.id for u in db.query(User).filter(User.role == "user").all()]


def _vital_to_dict(row: VitalReading) -> dict[str, Any]:
    return {
        "heart_rate": row.heart_rate,
        "stress_level": row.stress_level,
        "simulated_mood": row.simulated_mood,
        "sleep_hours": row.sleep_hours,
        "timestamp": row.timestamp.isoformat() if row.timestamp else "",
        "source": row.source,
    }


def _mood_to_dict(row: MoodEntry) -> dict[str, Any]:
    return {
        "sentiment": row.sentiment,
        "emoji": row.emoji,
        "timestamp": row.timestamp.isoformat() if row.timestamp else "",
    }


def _journal_to_dict(row: JournalEntry, include_text: bool = False) -> dict[str, Any]:
    try:
        themes = json.loads(row.themes) if row.themes else []
    except json.JSONDecodeError:
        themes = []
    d: dict[str, Any] = {
        "id": row.id,
        "text_preview": row.text[:120] + ("…" if len(row.text) > 120 else ""),
        "source": row.source,
        "extracted_emotion": row.extracted_emotion,
        "intensity": row.intensity,
        "themes": themes,
        "summary_one_line": row.summary_one_line,
        "timestamp": row.timestamp.isoformat() if row.timestamp else "",
    }
    if include_text:
        d["text"] = row.text
    return d


def _notification_to_dict(row: Notification) -> dict[str, Any]:
    return {
        "id": row.id,
        "title": row.title,
        "message": row.message,
        "type": row.ntype,
        "read": row.read,
        "created_at": row.created_at.isoformat() if row.created_at else "",
    }
