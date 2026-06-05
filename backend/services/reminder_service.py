"""Smart reminders from today's personalised action plan."""
from __future__ import annotations

import asyncio
from datetime import datetime
from pathlib import Path

from db.database import SessionLocal
from db import repository
from services import data_store
from services.action_plan_service import (
    get_next_reminder_action,
    get_todays_plan,
    mark_reminder_sent,
)

REMINDER_TIMES = [(7, 30), (12, 0), (17, 0), (20, 30)]
PLANS_DIR = Path(__file__).resolve().parent.parent / "data" / "action_plans"


def _build_reminder_message(action: dict, vitals: dict, hour: int) -> tuple[str, str]:
    stress = vitals.get("stress_level", 30)
    spo2 = vitals.get("spo2", 98.0)
    if spo2 < 95:
        urgency = "⚠️ Your oxygen is low — "
    elif stress > 70:
        urgency = "You're running high — "
    elif hour < 12:
        urgency = "Good morning! Time to — "
    elif hour >= 19:
        urgency = "Before you sleep — "
    else:
        urgency = "Quick check-in — "
    title = f"{action['emoji']} {action['title']}"
    body = f"{urgency}{action['description'][:100]}"
    return title, body


def trigger_reminder_for_user(user_id: int) -> None:
    action = get_next_reminder_action(user_id)
    if not action:
        return
    vitals = data_store.get_latest(user_id)
    hour = datetime.now().hour
    title, body = _build_reminder_message(action, vitals, hour)
    db = SessionLocal()
    try:
        repository.create_notification(db, user_id, title, body, ntype="action_reminder")
    finally:
        db.close()
    mark_reminder_sent(user_id, action["id"])


def _known_user_ids() -> list[int]:
    ids: set[int] = set()
    if PLANS_DIR.exists():
        for pf in PLANS_DIR.glob("*.json"):
            try:
                uid = int(pf.stem.rsplit("_", 1)[0])
                ids.add(uid)
            except ValueError:
                continue
    db = SessionLocal()
    try:
        ids.update(repository.get_all_user_ids(db))
    finally:
        db.close()
    return list(ids)


async def reminder_scheduler_loop() -> None:
    print("[reminder] scheduler started")
    fired_today: set[tuple] = set()

    while True:
        now = datetime.now()
        if now.hour == 0 and now.minute == 0:
            fired_today.clear()

        for h, m in REMINDER_TIMES:
            if now.hour == h and now.minute == m:
                for user_id in _known_user_ids():
                    key = (user_id, h, m)
                    if key not in fired_today:
                        get_todays_plan(user_id)
                        trigger_reminder_for_user(user_id)
                        fired_today.add(key)

        await asyncio.sleep(60)
