"""
In-memory sensor, mood, journal & habit store.
MQTT-ready: call ingest_reading() from subscriber — business logic unchanged.
"""
from __future__ import annotations

import threading
from collections import deque
from datetime import datetime, timezone
from typing import Any, Optional

_lock = threading.Lock()
_latest: dict[str, Any] = {
    "heart_rate": 72,
    "stress_level": 35,
    "simulated_mood": "calm",
    "sleep_hours": 6.5,
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "source": "simulation",
}
_history: deque = deque(maxlen=288)
_events: deque = deque(maxlen=50)
_latest_mood: Optional[dict[str, Any]] = None
_mood_history: deque = deque(maxlen=100)
_journal_entries: deque = deque(maxlen=200)
_habits: dict[str, Any] = {
    "sleep_hours_avg": 6.2,
    "steps_avg": 5200,
    "screen_time_hours": 7.5,
    "caffeine_cups": 3,
    "outdoor_minutes": 25,
}
_routine_cache: Optional[dict[str, Any]] = None

MOOD_STATES = ("calm", "focused", "tired", "anxious", "energized")


def get_latest() -> dict[str, Any]:
    with _lock:
        return dict(_latest)


def ingest_reading(
    heart_rate: int,
    stress_level: int,
    *,
    source: str = "simulation",
    simulated_mood: Optional[str] = None,
    sleep_hours: Optional[float] = None,
) -> dict[str, Any]:
    """Single entry point for simulation or MQTT wearable payloads."""
    ts = datetime.now(timezone.utc).isoformat()
    record = {
        "heart_rate": heart_rate,
        "stress_level": stress_level,
        "timestamp": ts,
        "source": source,
    }
    with _lock:
        if simulated_mood:
            record["simulated_mood"] = simulated_mood
            _latest["simulated_mood"] = simulated_mood
        if sleep_hours is not None:
            record["sleep_hours"] = sleep_hours
            _latest["sleep_hours"] = sleep_hours
        _latest.update(record)
        _history.append(dict(_latest))
    return record


def append_stress_event(event: dict[str, Any]) -> None:
    with _lock:
        _events.append(event)


def get_history(limit: Optional[int] = 60) -> list[dict[str, Any]]:
    with _lock:
        items = list(_history)
    return items[-limit:] if limit else items


def get_stress_events() -> list[dict[str, Any]]:
    with _lock:
        return list(_events)


def record_mood(sentiment: str, emoji: str) -> dict[str, Any]:
    entry = {
        "sentiment": sentiment,
        "emoji": emoji,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    global _latest_mood
    with _lock:
        _latest_mood = entry
        _mood_history.append(entry)
    return entry


def get_latest_mood() -> Optional[dict[str, Any]]:
    with _lock:
        return dict(_latest_mood) if _latest_mood else None


def get_mood_history(limit: int = 20) -> list[dict[str, Any]]:
    with _lock:
        items = list(_mood_history)
    return items[-limit:]


def add_journal_entry(
    text: str,
    source: str,
    extracted_emotion: str,
    intensity: float,
    themes: list,
    summary: str,
) -> dict[str, Any]:
    entry = {
        "id": len(_journal_entries) + 1,
        "text_preview": text[:120] + ("…" if len(text) > 120 else ""),
        "source": source,
        "extracted_emotion": extracted_emotion,
        "intensity": intensity,
        "themes": themes,
        "summary_one_line": summary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _journal_entries.append(entry)
    return entry


def get_journal_entries(limit: int = 20) -> list[dict[str, Any]]:
    with _lock:
        items = list(_journal_entries)
    return items[-limit:]


def get_habits() -> dict[str, Any]:
    with _lock:
        return dict(_habits)


def update_habits(updates: dict[str, Any]) -> dict[str, Any]:
    with _lock:
        _habits.update(updates)
        return dict(_habits)


def cache_routine(routine: dict[str, Any]) -> None:
    global _routine_cache
    with _lock:
        _routine_cache = routine


def get_cached_routine() -> Optional[dict[str, Any]]:
    with _lock:
        return dict(_routine_cache) if _routine_cache else None
