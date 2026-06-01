"""
Crisis detection & local Ethiopian mental-health resources.
"""
from __future__ import annotations

from typing import Any

BEFRIENDERS_ETHIOPIA = "+251 116 629 797"

ETHIOPIA_SUPPORT_RESOURCES = [
    {
        "name": "Befrienders Ethiopia",
        "note": "24/7 emotional support — call or text",
        "contact": BEFRIENDERS_ETHIOPIA,
    },
    {
        "name": "Ethiopian Psychiatric Association (EPA)",
        "note": "Professional referral & clinic directory",
        "contact": "https://ethiopianpsychiatricassociation.org",
    },
    {
        "name": "Emergency — Ethiopia",
        "note": "Life-threatening emergency",
        "contact": "911 / local emergency line",
    },
]

BREATHING_GUIDE_EN = """
Before we keep going — try this with me.
In for 4. Hold for 4. Out for 6.
Do it once. I'll be here.
"""

BREATHING_GUIDE_AM = """
ከመቀጠል በፊት — ከእኔ ጋር ይሞክሩ።
4 ይጨሱ። 4 ይያዙ። 6 ይውጡ።
አንድ ጊዜ። እዚህ ነኝ።
"""


def assess_crisis(heart_rate: int, stress_level: int) -> dict[str, Any]:
    """Classify physiological panic risk from vitals."""
    if stress_level >= 85 and heart_rate >= 100:
        return {
            "active": True,
            "severity": "critical",
            "recommended_action": "breathing_exercise",
            "message_key": "critical_panic",
        }
    if stress_level >= 75 and heart_rate >= 95:
        return {
            "active": True,
            "severity": "elevated",
            "recommended_action": "breathing_exercise",
            "message_key": "elevated_stress",
        }
    if stress_level >= 80:
        return {
            "active": True,
            "severity": "high_stress",
            "recommended_action": "gentle_check_in",
            "message_key": "high_stress",
        }
    return {
        "active": False,
        "severity": "none",
        "recommended_action": "none",
        "message_key": None,
    }


def crisis_payload(lang: str) -> dict[str, Any]:
    guide = BREATHING_GUIDE_AM if lang == "am" else BREATHING_GUIDE_EN
    return {
        "breathing_guide": guide.strip(),
        "befrienders": BEFRIENDERS_ETHIOPIA,
        "support_resources": ETHIOPIA_SUPPORT_RESOURCES,
    }
