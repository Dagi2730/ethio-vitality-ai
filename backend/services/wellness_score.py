"""
Wellness score: combines mood, stress, and activity into a single 0–100 indicator.
"""
from __future__ import annotations

from statistics import mean
from typing import Any

SENTIMENT_SCORES = {
    "great": 95,
    "okay": 75,
    "low": 55,
    "sad": 40,
    "anxious": 35,
    "overwhelmed": 25,
}


def compute_wellness_score(
    *,
    avg_stress: float,
    moods: list[dict[str, Any]],
    habits: dict[str, Any],
) -> dict[str, Any]:
    stress_component = max(0, 100 - avg_stress)

    mood_scores = [SENTIMENT_SCORES.get(m.get("sentiment", "okay"), 60) for m in moods[-14:]]
    mood_component = mean(mood_scores) if mood_scores else 65

    steps = int(habits.get("steps_avg", 5000))
    outdoor = int(habits.get("outdoor_minutes", 20))
    sleep = float(habits.get("sleep_hours_avg", 6.5))
    activity_component = min(
        100,
        (steps / 10000) * 40 + (outdoor / 60) * 30 + min(sleep / 8, 1) * 30,
    )

    score = round(0.4 * stress_component + 0.35 * mood_component + 0.25 * activity_component)
    score = max(0, min(100, score))

    if score >= 75:
        band = "thriving"
    elif score >= 55:
        band = "steady"
    elif score >= 40:
        band = "needs_care"
    else:
        band = "at_risk"

    return {
        "score": score,
        "band": band,
        "components": {
            "stress": round(stress_component),
            "mood": round(mood_component),
            "activity": round(activity_component),
        },
    }


def predict_next_mood(moods: list[dict[str, Any]], stress_vals: list[int]) -> dict[str, Any]:
    """Short-term mood prediction from recent patterns."""
    if not moods and not stress_vals:
        return {
            "predicted_sentiment": "okay",
            "confidence": 0.5,
            "horizon_hours": 24,
            "drivers": ["insufficient_data"],
        }

    recent = moods[-5:] if moods else []
    negative = sum(
        1 for m in recent if m.get("sentiment") in ("sad", "anxious", "overwhelmed", "low")
    )
    avg_stress = mean(stress_vals[-10:]) if stress_vals else 50

    if negative >= 3 or avg_stress >= 70:
        predicted = "anxious"
        confidence = 0.78
        drivers = ["elevated_stress", "negative_mood_streak"]
    elif negative >= 2 or avg_stress >= 55:
        predicted = "low"
        confidence = 0.72
        drivers = ["moderate_stress", "recent_low_moods"]
    elif negative == 0 and avg_stress < 45:
        predicted = "great"
        confidence = 0.75
        drivers = ["stable_vitals", "positive_mood"]
    else:
        predicted = "okay"
        confidence = 0.68
        drivers = ["stable_pattern"]

    return {
        "predicted_sentiment": predicted,
        "confidence": confidence,
        "horizon_hours": 24,
        "drivers": drivers,
    }


def daily_suggestions(
    wellness: dict[str, Any],
    habits: dict[str, Any],
    mood_prediction: dict[str, Any],
    lang: str = "en",
) -> list[dict[str, str]]:
    score = wellness.get("score", 50)
    suggestions = []

    if habits.get("sleep_hours_avg", 7) < 6.5:
        suggestions.append(
            {
                "id": "sleep",
                "title_en": "Prioritize sleep tonight",
                "title_am": "ዛሬ ማታ እንቅልፍ ይቀድሙ",
                "body_en": "Aim for 7+ hours — your stress trends improve with better rest.",
                "body_am": "7+ ሰዓት እንቅልፍ ይሞክሩ።",
            }
        )
    if habits.get("outdoor_minutes", 0) < 30:
        suggestions.append(
            {
                "id": "walk",
                "title_en": "15-minute outdoor walk",
                "title_am": "15 ደቂቃ ውጭ ጉዞ",
                "body_en": "Movement can lower afternoon stress by 10–15%.",
                "body_am": "እንቅስቃሴ ጭንቀትን ሊቀንስ ይችላል።",
            }
        )
    if mood_prediction.get("predicted_sentiment") in ("anxious", "low", "overwhelmed"):
        suggestions.append(
            {
                "id": "breathe",
                "title_en": "Try a 4-7-8 breathing cycle",
                "title_am": "4-7-8 የመተንፈስ ስልት",
                "body_en": "Your patterns suggest elevated stress — a short reset may help.",
                "body_am": "ጭንቀት ከፍ ብሏል — አጭር እረፍት ይሞክሩ።",
            }
        )
    if score < 50:
        suggestions.append(
            {
                "id": "coach",
                "title_en": "Check in with Vitality Coach",
                "title_am": "ከ Vitality Coach ጋር ይነጋገሩ",
                "body_en": "Your wellness score is lower than usual — personalized support is available.",
                "body_am": "የእንክብካቤ ነጥብዎ ዝቅተኛ ነው።",
            }
        )
    if not suggestions:
        suggestions.append(
            {
                "id": "reflect",
                "title_en": "Log your mood today",
                "title_am": "ዛሬ ስሜትዎን ይመዝግቡ",
                "body_en": "You're on track — a quick check-in keeps insights accurate.",
                "body_am": "በመንገድ ላይ ነዎት — ስሜት መመዝገብ ይረዳል።",
            }
        )
    return suggestions[:4]
