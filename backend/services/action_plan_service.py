"""Dynamic daily action plans based on vitals and mood history."""
from __future__ import annotations

import json
import random
from datetime import date, datetime, timezone
from pathlib import Path

from services import data_store

PLANS_DIR = Path(__file__).resolve().parent.parent / "data" / "action_plans"
PLANS_DIR.mkdir(parents=True, exist_ok=True)

ACTION_POOL = [
    {"id": "box_breathing", "title": "Box Breathing", "description": "Inhale 4, hold 4, exhale 4, hold 4. Repeat 5 times.", "duration": 5, "category": "breathwork", "emoji": "🫁", "condition": "high_stress", "weight": 10},
    {"id": "cold_water_face", "title": "Cold Water Reset", "description": "Splash cold water on face and wrists for 30 seconds.", "duration": 2, "category": "physical", "emoji": "💧", "condition": "high_stress", "weight": 8},
    {"id": "stress_journal", "title": "Stress Dump Journal", "description": "Write everything stressing you — no editing, no judgment.", "duration": 10, "category": "journaling", "emoji": "📝", "condition": "high_stress", "weight": 9},
    {"id": "slow_walk", "title": "5-Minute Slow Walk", "description": "Step outside and walk slowly. Focus on what you see and hear.", "duration": 5, "category": "physical", "emoji": "🚶", "condition": "high_hr", "weight": 9},
    {"id": "deep_breathing_o2", "title": "Oxygen Recovery Breathing", "description": "Open a window. Breathe in 6 counts, out 8. Do for 3 minutes.", "duration": 3, "category": "breathwork", "emoji": "🌬️", "condition": "low_spo2", "weight": 10},
    {"id": "gratitude_3", "title": "3 Things You're Grateful For", "description": "Write 3 specific things from today — specificity makes it work.", "duration": 5, "category": "journaling", "emoji": "🙏", "condition": "low_mood", "weight": 9},
    {"id": "call_someone", "title": "Call Someone You Trust", "description": "A 5-minute check-in call is one of the strongest mood interventions.", "duration": 10, "category": "social", "emoji": "📞", "condition": "low_mood", "weight": 10},
    {"id": "habit_stack", "title": "Add One Micro-Habit", "description": "Attach a tiny habit to something you already do daily.", "duration": 5, "category": "lifestyle", "emoji": "⚡", "condition": "good_status", "weight": 7},
    {"id": "water_intake", "title": "Drink a Full Glass of Water", "description": "Mild dehydration increases perceived stress.", "duration": 1, "category": "nutrition", "emoji": "🥤", "condition": "always", "weight": 5},
    {"id": "evening_reflection", "title": "Evening Wind-Down", "description": "What went well? What would you do differently? 3 minutes.", "duration": 3, "category": "journaling", "emoji": "🌙", "condition": "evening", "weight": 8},
    {"id": "morning_intention", "title": "Set a Morning Intention", "description": "Before checking messages, write one sentence for today.", "duration": 2, "category": "mindfulness", "emoji": "🌅", "condition": "morning", "weight": 8},
    {"id": "prayer_moment", "title": "Moment of Prayer or Stillness", "description": "3 minutes of quiet prayer, reflection, or gratitude.", "duration": 3, "category": "spiritual", "emoji": "🕊️", "condition": "always", "weight": 6},
    {"id": "injera_mindful", "title": "Eat One Meal Without Your Phone", "description": "Mindful eating reduces stress hormones.", "duration": 20, "category": "nutrition", "emoji": "🍽️", "condition": "always", "weight": 5},
]


def _classify_status(vitals: dict, mood_history: list[dict]) -> dict:
    hr = vitals.get("heart_rate", 72)
    stress = vitals.get("stress_level", 30)
    spo2 = vitals.get("spo2", 98.0)
    recent_moods = [m.get("sentiment", "") for m in mood_history[-7:]]
    burnout_moods = {"low", "sad", "anxious", "overwhelmed"}
    low_mood_count = sum(1 for m in recent_moods if m in burnout_moods)
    hour = datetime.now().hour
    return {
        "high_stress": stress > 65,
        "high_hr": hr > 95,
        "low_spo2": spo2 < 95,
        "low_mood": low_mood_count >= 3,
        "good_status": stress < 40 and hr < 85 and spo2 >= 95,
        "morning": 5 <= hour < 12,
        "evening": hour >= 19,
        "always": True,
    }


def _build_status_summary(conditions: dict, vitals: dict) -> str:
    stress = vitals.get("stress_level", 30)
    hr = vitals.get("heart_rate", 72)
    spo2 = vitals.get("spo2", 98.0)
    if conditions["low_spo2"]:
        return f"Your oxygen is low ({spo2}%). Today's plan prioritises breathing and recovery."
    if conditions["high_stress"] and conditions["high_hr"]:
        return f"High stress ({stress}/100) and elevated heart rate ({hr} bpm). Focus on calming down first."
    if conditions["high_stress"]:
        return f"Stress is elevated ({stress}/100). Today's plan targets nervous system relief."
    if conditions["low_mood"]:
        return "You've had several difficult days recently. Today is about gentle momentum."
    if conditions["good_status"]:
        return "Your vitals look good today. Let's use this energy to build better habits."
    return "Here's your personalised plan for today."


def _save_plan(user_id: int, plan: dict) -> None:
    path = PLANS_DIR / f"{user_id}_{date.today().isoformat()}.json"
    path.write_text(json.dumps(plan, indent=2), encoding="utf-8")


def generate_daily_plan(user_id: int) -> dict:
    vitals = data_store.get_latest(user_id)
    mood_history = data_store.get_mood_history(user_id, limit=7)
    conditions = _classify_status(vitals, mood_history)

    scored = []
    day_seed = int(date.today().strftime("%j"))
    user_seed = user_id
    for action in ACTION_POOL:
        cond = action["condition"]
        if conditions.get(cond, False):
            rng = random.Random(day_seed + user_seed + action["weight"])
            score = action["weight"] + rng.uniform(-1.5, 1.5)
            scored.append((score, action))

    scored.sort(key=lambda x: x[0], reverse=True)
    category_count: dict[str, int] = {}
    selected = []
    for _, action in scored:
        cat = action["category"]
        if category_count.get(cat, 0) < 2:
            selected.append(action)
            category_count[cat] = category_count.get(cat, 0) + 1
        if len(selected) >= 5:
            break

    plan = {
        "date": date.today().isoformat(),
        "user_id": user_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status_summary": _build_status_summary(conditions, vitals),
        "active_conditions": [k for k, v in conditions.items() if v and k != "always"],
        "total_minutes": sum(a["duration"] for a in selected),
        "actions": [
            {
                "id": a["id"],
                "title": a["title"],
                "description": a["description"],
                "duration": a["duration"],
                "category": a["category"],
                "emoji": a["emoji"],
                "completed": False,
                "reminder_sent": False,
            }
            for a in selected
        ],
        "vitals_snapshot": {
            "heart_rate": vitals.get("heart_rate"),
            "stress_level": vitals.get("stress_level"),
            "spo2": vitals.get("spo2"),
            "mood": vitals.get("simulated_mood"),
        },
    }
    _save_plan(user_id, plan)
    return plan


def get_todays_plan(user_id: int) -> dict:
    path = PLANS_DIR / f"{user_id}_{date.today().isoformat()}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return generate_daily_plan(user_id)


def mark_action_complete(user_id: int, action_id: str) -> dict:
    plan = get_todays_plan(user_id)
    for action in plan["actions"]:
        if action["id"] == action_id:
            action["completed"] = True
    _save_plan(user_id, plan)
    return plan


def get_incomplete_actions(user_id: int) -> list[dict]:
    plan = get_todays_plan(user_id)
    return [a for a in plan["actions"] if not a["completed"]]


def get_next_reminder_action(user_id: int) -> dict | None:
    plan = get_todays_plan(user_id)
    for action in plan["actions"]:
        if not action["completed"] and not action["reminder_sent"]:
            return action
    return None


def mark_reminder_sent(user_id: int, action_id: str) -> None:
    plan = get_todays_plan(user_id)
    for action in plan["actions"]:
        if action["id"] == action_id:
            action["reminder_sent"] = True
    _save_plan(user_id, plan)
