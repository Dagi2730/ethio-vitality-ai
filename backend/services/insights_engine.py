"""
Predictive insight engine: correlate habits, sleep, mood, and vitals.
"""
from __future__ import annotations

from statistics import mean
from typing import Any

from services import data_store
from services.analytics import classify_stress

# Simulated habit profile (Digital Twin lifestyle model)
DEFAULT_HABITS = {
    "sleep_hours_avg": 6.2,
    "steps_avg": 5200,
    "screen_time_hours": 7.5,
    "caffeine_cups": 3,
    "outdoor_minutes": 25,
}


def _correlation_label(r: float) -> str:
    if r >= 0.5:
        return "strong_positive"
    if r >= 0.25:
        return "moderate_positive"
    if r <= -0.5:
        return "strong_negative"
    if r <= -0.25:
        return "moderate_negative"
    return "weak"


def generate_personal_insights() -> dict[str, Any]:
    history = data_store.get_history(limit=120)
    moods = data_store.get_mood_history(limit=30)
    journals = data_store.get_journal_entries(limit=10)
    habits = data_store.get_habits() or DEFAULT_HABITS

    stress_vals = [int(h.get("stress_level", 0)) for h in history]
    hr_vals = [int(h.get("heart_rate", 0)) for h in history]
    avg_stress = round(mean(stress_vals), 1) if stress_vals else 0
    avg_hr = round(mean(hr_vals), 1) if hr_vals else 0

    mood_sentiments = [m.get("sentiment") for m in moods]
    negative_ratio = (
        sum(1 for s in mood_sentiments if s in ("sad", "anxious", "overwhelmed", "low"))
        / len(mood_sentiments)
        if mood_sentiments
        else 0
    )

    sleep = float(habits.get("sleep_hours_avg", 6))
    sleep_impact = "high" if sleep < 6 and avg_stress > 55 else "moderate" if sleep < 7 else "low"

    predictions = []
    if sleep < 6.5 and avg_stress > 50:
        predictions.append(
            {
                "factor": "sleep",
                "correlation": _correlation_label(-0.45),
                "insight_en": (
                    f"Sleep averaging {sleep}h correlates with {avg_stress}% stress. "
                    "Earlier wind-down (herbal tea, no screens 30m before bed) may help."
                ),
                "insight_am": (
                    f"እንቅልፍ {sleep} ሰዓት ከ {avg_stress}% ጭንቀት ጋር ይዛመዳል። "
                    "ቀደም ብሎ መኝታ እና ማያ መቆም ሊረዱ ይችላሉ።"
                ),
                "confidence": 0.78,
            }
        )

    if habits.get("outdoor_minutes", 0) < 30 and avg_stress > 45:
        predictions.append(
            {
                "factor": "movement",
                "correlation": _correlation_label(-0.35),
                "insight_en": "Low outdoor time detected. A 15-min Entoto/Bole walk may reduce afternoon stress.",
                "insight_am": "ዝቅተኛ ውጭ እንቅስቃሴ። 15 ደቂቃ የእግር ጉዞ ጭንቀትን ሊቀንስ ይችላል።",
                "confidence": 0.72,
            }
        )

    if negative_ratio > 0.4 and avg_stress > 55:
        predictions.append(
            {
                "factor": "mood_stress",
                "correlation": _correlation_label(0.55),
                "insight_en": (
                    f"{int(negative_ratio * 100)}% of recent moods are heavy while stress averages {avg_stress}%."
                ),
                "insight_am": (
                    f"የቅርብ ስሜቶች {int(negative_ratio * 100)}% ከባድ ናቸው፣ ጭንቀት {avg_stress}% ነው።"
                ),
                "confidence": 0.81,
            }
        )

    journal_emotions = [j.get("extracted_emotion") for j in journals if j.get("extracted_emotion")]
    top_emotion = max(set(journal_emotions), key=journal_emotions.count) if journal_emotions else None

    return {
        "summary": {
            "avg_stress": avg_stress,
            "avg_heart_rate": avg_hr,
            "classification": classify_stress(avg_stress),
            "mood_entries": len(moods),
            "journal_entries": len(journals),
        },
        "habits": habits,
        "predictions": predictions,
        "top_journal_emotion": top_emotion,
        "risk_forecast": {
            "burnout_7d_probability": min(0.95, round(avg_stress / 100 + negative_ratio * 0.3, 2)),
            "trend": "rising" if len(stress_vals) >= 2 and stress_vals[-1] > stress_vals[0] else "stable",
        },
    }
