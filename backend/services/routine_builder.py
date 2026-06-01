"""
Auto-Routine Builder: personalized daily schedule from vitals, mood, habits.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from services import data_store
from services.insights_engine import DEFAULT_HABITS


def build_daily_routine(lang: str = "en") -> dict[str, Any]:
    latest = data_store.get_latest()
    mood = data_store.get_latest_mood()
    habits = data_store.get_habits() or DEFAULT_HABITS
    stress = int(latest.get("stress_level", 35))

    blocks_en = [
        {"time": "06:30", "activity": "Warm water + light stretch", "category": "morning"},
        {"time": "07:00", "activity": "Teff injera breakfast (protein-rich side)", "category": "nutrition"},
        {"time": "09:00", "activity": "Deep work block (90 min, phone away)", "category": "focus"},
        {"time": "11:00", "activity": "Tenadam herbal tea break", "category": "wellness"},
        {"time": "13:00", "activity": "Lunch away from desk", "category": "nutrition"},
        {"time": "15:30", "activity": "10-min walk (Bole/Entoto if possible)", "category": "movement"},
        {"time": "18:00", "activity": "Commute decompression — breathing or music", "category": "recovery"},
        {"time": "21:00", "activity": "Screen-off wind-down", "category": "sleep"},
        {"time": "22:00", "activity": "Target sleep (7+ hours)", "category": "sleep"},
    ]

    blocks_am = [
        {"time": "06:30", "activity": "ሞቅ ውሃ + ቀላል ስትረች", "category": "morning"},
        {"time": "07:00", "activity": "ጤፍ እንጀራ ቁርስ", "category": "nutrition"},
        {"time": "09:00", "activity": "ጥልቀት ስራ (90 ደቂቃ)", "category": "focus"},
        {"time": "11:00", "activity": "ጤን አዳም ሻይ", "category": "wellness"},
        {"time": "13:00", "activity": "ከዴስክ ርቆ ምሳ", "category": "nutrition"},
        {"time": "15:30", "activity": "10 ደቂቃ ጉዞ", "category": "movement"},
        {"time": "18:00", "activity": "መተንፈሻ ወይም ሙዚቃ", "category": "recovery"},
        {"time": "21:00", "activity": "ማያ መዝጋት", "category": "sleep"},
        {"time": "22:00", "activity": "7+ ሰዓት እንቅልፍ", "category": "sleep"},
    ]

    blocks = blocks_am if lang == "am" else blocks_en

    if stress >= 70:
        blocks.insert(4, {
            "time": "12:00",
            "activity": "4-7-8 breathing (4 cycles)" if lang == "en" else "4-7-8 መተንፈሻ (4 ዑደል)",
            "category": "intervention",
            "priority": True,
        })
    if mood and mood.get("sentiment") in ("sad", "anxious", "overwhelmed"):
        blocks.insert(5, {
            "time": "16:00",
            "activity": "5-min reflection journal" if lang == "en" else "5 ደቂቃ መጽሐፍ",
            "category": "mindfulness",
            "priority": True,
        })

    if float(habits.get("sleep_hours_avg", 7)) < 6.5:
        for b in blocks:
            if b.get("category") == "sleep":
                b["priority"] = True

    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "stress_level": stress,
        "blocks": blocks,
        "focus_theme_en": "Recovery & balance" if stress >= 60 else "Sustainable energy",
        "focus_theme_am": "መልሶ ማግኘት" if stress >= 60 else "ዘላቂ ኃይል",
    }
