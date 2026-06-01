"""
Per-user wellness data facade — backed by SQLite via repository.
"""
from __future__ import annotations

from typing import Any, Optional

from db.database import SessionLocal
from db import repository

# In-memory stress events (org-level spikes from simulator)
_stress_events: list[dict[str, Any]] = []
_MAX_EVENTS = 50
_routine_cache: dict[int, dict[str, Any]] = {}


def _db():
    return SessionLocal()


def get_latest(user_id: int) -> dict[str, Any]:
    db = _db()
    try:
        return repository.get_latest_vital(db, user_id)
    finally:
        db.close()


def ingest_reading(
    user_id: int,
    heart_rate: int,
    stress_level: int,
    *,
    source: str = "simulation",
    simulated_mood: Optional[str] = None,
    sleep_hours: Optional[float] = None,
) -> dict[str, Any]:
    db = _db()
    try:
        return repository.ingest_vital(
            db,
            user_id,
            heart_rate,
            stress_level,
            source=source,
            simulated_mood=simulated_mood,
            sleep_hours=sleep_hours,
        )
    finally:
        db.close()


def append_stress_event(event: dict[str, Any]) -> None:
    _stress_events.append(event)
    if len(_stress_events) > _MAX_EVENTS:
        del _stress_events[0]


def get_stress_events() -> list[dict[str, Any]]:
    return list(_stress_events)


def get_history(user_id: int, limit: Optional[int] = 60) -> list[dict[str, Any]]:
    db = _db()
    try:
        return repository.get_vital_history(db, user_id, limit=limit or 120)
    finally:
        db.close()


def record_mood(user_id: int, sentiment: str, emoji: str) -> dict[str, Any]:
    db = _db()
    try:
        return repository.record_mood(db, user_id, sentiment, emoji)
    finally:
        db.close()


def get_latest_mood(user_id: int) -> Optional[dict[str, Any]]:
    db = _db()
    try:
        return repository.get_latest_mood(db, user_id)
    finally:
        db.close()


def get_mood_history(user_id: int, limit: int = 20) -> list[dict[str, Any]]:
    db = _db()
    try:
        return repository.get_mood_history(db, user_id, limit=limit)
    finally:
        db.close()


def add_journal_entry(
    user_id: int,
    text: str,
    source: str,
    extracted_emotion: str,
    intensity: float,
    themes: list,
    summary: str,
) -> dict[str, Any]:
    db = _db()
    try:
        return repository.add_journal(
            db,
            user_id,
            text,
            source,
            extracted_emotion,
            intensity,
            themes,
            summary,
        )
    finally:
        db.close()


def update_journal_entry(user_id: int, entry_id: int, text: str) -> Optional[dict[str, Any]]:
    db = _db()
    try:
        return repository.update_journal(db, user_id, entry_id, text)
    finally:
        db.close()


def get_journal_entries(user_id: int, limit: int = 20) -> list[dict[str, Any]]:
    db = _db()
    try:
        return repository.get_journal_entries(db, user_id, limit=limit)
    finally:
        db.close()


def get_habits(user_id: int) -> dict[str, Any]:
    db = _db()
    try:
        return repository.get_habits(db, user_id)
    finally:
        db.close()


def update_habits(user_id: int, updates: dict[str, Any]) -> dict[str, Any]:
    db = _db()
    try:
        return repository.update_habits(db, user_id, updates)
    finally:
        db.close()


def cache_routine(user_id: int, routine: dict[str, Any]) -> None:
    _routine_cache[user_id] = routine


def get_cached_routine(user_id: int) -> Optional[dict[str, Any]]:
    return _routine_cache.get(user_id)
