"""
Real-time trigger detection: correlate physiological spikes with mood/journal.
"""
from __future__ import annotations

from typing import Any

from services import data_store
from services.anomalies import detect_anomalies
from services.analytics import classify_stress

NEGATIVE_MOODS = {"sad", "anxious", "overwhelmed", "low"}


def detect_triggers() -> list[dict[str, Any]]:
    """Evaluate active wellness triggers for micro-interventions."""
    latest = data_store.get_latest()
    mood = data_store.get_latest_mood()
    history = data_store.get_history(limit=60)
    anomalies = detect_anomalies(history)
    triggers: list[dict[str, Any]] = []

    hr = int(latest.get("heart_rate", 0))
    stress = int(latest.get("stress_level", 0))
    sim_mood = latest.get("simulated_mood")

    if stress >= 80 or (anomalies and anomalies[-1].get("stress_level", 0) >= 75):
        triggers.append(
            {
                "id": "physio_spike",
                "severity": "high",
                "type": "micro_intervention",
                "action": "breathing_exercise",
                "title_en": "Stress spike detected",
                "title_am": "የጭንቀት ጭማሪ ተገኝቷል",
                "message_en": "Your body shows elevated stress. A 2-minute breath reset is recommended.",
                "message_am": "ሰውነትዎ ከፍተኛ ጭንቀት ያሳያል። 2 ደቂቃ የመተንፈሻ እረፍት ይመከራል።",
            }
        )

    if mood and mood.get("sentiment") in NEGATIVE_MOODS and stress >= 55:
        triggers.append(
            {
                "id": "mood_vitals_mismatch",
                "severity": "medium",
                "type": "psychologist_nudge",
                "action": "open_coach",
                "title_en": "Mood & body out of sync",
                "title_am": "ስሜት እና ሰውነት አይጣመሩም",
                "message_en": (
                    f"You feel '{mood.get('sentiment')}' while stress is {stress}%. "
                    "Let's explore that together."
                ),
                "message_am": f"ስሜት '{mood.get('sentiment')}' ቢሆንም ጭንቀት {stress}% ነው። እንደገና እንነጋገር?",
            }
        )

    if sim_mood in NEGATIVE_MOODS and stress < 45:
        triggers.append(
            {
                "id": "hidden_distress",
                "severity": "low",
                "type": "journal_prompt",
                "action": "open_reflect",
                "title_en": "Reflect on your day",
                "title_am": "ቀንዎን ያስቡ",
                "message_en": "Vitals look calm but mood is low — journaling may help.",
                "message_am": "ሰውነት ሰላማዊ ነው ነገር ግን ስሜት ዝቅ ነው — መጻፍ ሊረዳ ይችላል።",
            }
        )

    latest_journal = data_store.get_journal_entries(limit=1)
    if anomalies and latest_journal:
        j = latest_journal[0]
        emo = j.get("extracted_emotion", "")
        if emo in ("anxiety", "sadness", "distress") and stress >= 60:
            triggers.append(
                {
                    "id": "journal_physio_correlation",
                    "severity": "medium",
                    "type": "insight",
                    "action": "view_insights",
                    "title_en": "Pattern detected",
                    "title_am": "ስርዓት ተገኝቷል",
                    "message_en": (
                        f"Recent journal emotion '{emo}' aligns with current stress ({stress}%)."
                    ),
                    "message_am": f"የመጽሐፍ ስሜት '{emo}' ከአሁኑ ጭንቀት ({stress}%) ጋር ይጣጣማል።",
                }
            )

    return triggers


def narrative_stage() -> dict[str, str]:
    """Day-in-the-life journey stage for UI narrative."""
    latest = data_store.get_latest()
    stress = int(latest.get("stress_level", 0))
    triggers = detect_triggers()

    if any(t["severity"] == "high" for t in triggers):
        stage = "intervention"
        label_en = "Take a pause — support is here"
        label_am = "እረፍት ይውሰዱ — ድጋፍ አለ"
    elif stress >= 60:
        stage = "awareness"
        label_en = "Noticing elevated stress"
        label_am = "ከፍተኛ ጭንቀት እየታየ ነው"
    elif stress >= 40:
        stage = "balance"
        label_en = "Staying balanced today"
        label_am = "ዛሬ ሚዛን ላይ"
    else:
        stage = "thriving"
        label_en = "You're in a calm zone"
        label_am = "በሰላም ቦታ ላይ ነዎት"

    return {"stage": stage, "label_en": label_en, "label_am": label_am}
