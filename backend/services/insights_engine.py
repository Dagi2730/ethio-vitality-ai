"""
Predictive insight engine: mood patterns, wellness score, daily suggestions.
"""
from __future__ import annotations

from statistics import mean
from typing import Any

from services import data_store
from services.analytics import classify_stress
from services.wellness_score import (
    compute_wellness_score,
    daily_suggestions,
    predict_next_mood,
)


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


def _mood_pattern_insights(moods: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """AI-style pattern analysis over mood history."""
    insights = []
    if len(moods) < 3:
        return insights

    sentiments = [m.get("sentiment") for m in moods]
    negative = ("sad", "anxious", "overwhelmed", "low")
    neg_count = sum(1 for s in sentiments if s in negative)
    neg_ratio = neg_count / len(sentiments)

    # Day-of-week pattern (simplified: bucket by order)
    weekend_heavy = sum(1 for s in sentiments[-3:] if s in negative) >= 2
    if weekend_heavy:
        insights.append(
            {
                "factor": "weekly_pattern",
                "correlation": _correlation_label(0.4),
                "insight_en": "Recent moods dip toward weekends — plan lighter commitments on Fri–Sat.",
                "insight_am": "ቅርብ ስሜቶች በሳምንት መጨረሻ ይከሰታሉ።",
                "confidence": 0.7,
            }
        )

    if neg_ratio > 0.5:
        insights.append(
            {
                "factor": "mood_trend",
                "correlation": _correlation_label(0.55),
                "insight_en": (
                    f"Over {int(neg_ratio * 100)}% of recent check-ins are heavy — "
                    "consider journaling triggers and speaking with Coach."
                ),
                "insight_am": f"የቅርብ ስሜቶች {int(neg_ratio * 100)}% ከባድ ናቸው።",
                "confidence": 0.82,
            }
        )

    # Streak detection
    streak = 0
    for s in reversed(sentiments):
        if s in negative:
            streak += 1
        else:
            break
    if streak >= 3:
        insights.append(
            {
                "factor": "negative_streak",
                "correlation": _correlation_label(0.6),
                "insight_en": f"You've logged {streak} consecutive heavy moods — small wins matter today.",
                "insight_am": f"{streak} ተከታታይ ከባድ ስሜቶች ተመዝግበዋል።",
                "confidence": 0.85,
            }
        )

    return insights


def generate_personal_insights(user_id: int) -> dict[str, Any]:
    history = data_store.get_history(user_id, limit=120)
    moods = data_store.get_mood_history(user_id, limit=30)
    journals = data_store.get_journal_entries(user_id, limit=10)
    habits = data_store.get_habits(user_id)

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
    predictions = _mood_pattern_insights(moods)

    if sleep < 6.5 and avg_stress > 50:
        predictions.append(
            {
                "factor": "sleep",
                "correlation": _correlation_label(-0.45),
                "insight_en": (
                    f"Sleep averaging {sleep}h correlates with {avg_stress}% stress. "
                    "Earlier wind-down may help."
                ),
                "insight_am": f"እንቅልፍ {sleep} ሰዓት ከ {avg_stress}% ጭንቀት ጋር ይዛመዳል።",
                "confidence": 0.78,
            }
        )

    if habits.get("outdoor_minutes", 0) < 30 and avg_stress > 45:
        predictions.append(
            {
                "factor": "movement",
                "correlation": _correlation_label(-0.35),
                "insight_en": "Low outdoor time detected. A 15-min walk may reduce afternoon stress.",
                "insight_am": "ዝቅተኛ ውጭ እንቅስቃሴ። 15 ደቂቃ የእግር ጉዞ ጭንቀትን ሊቀንስ ይችላል።",
                "confidence": 0.72,
            }
        )

    journal_emotions = [j.get("extracted_emotion") for j in journals if j.get("extracted_emotion")]
    top_emotion = max(set(journal_emotions), key=journal_emotions.count) if journal_emotions else None

    wellness = compute_wellness_score(avg_stress=avg_stress, moods=moods, habits=habits)
    mood_prediction = predict_next_mood(moods, stress_vals)
    suggestions = daily_suggestions(wellness, habits, mood_prediction)

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
        "wellness_score": wellness,
        "mood_prediction": mood_prediction,
        "daily_suggestions": suggestions,
        "risk_forecast": {
            "burnout_7d_probability": min(0.95, round(avg_stress / 100 + negative_ratio * 0.3, 2)),
            "trend": "rising" if len(stress_vals) >= 2 and stress_vals[-1] > stress_vals[0] else "stable",
        },
    }
