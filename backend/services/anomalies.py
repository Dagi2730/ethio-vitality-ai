"""
Detect HR/stress spikes in sensor history for chart highlighting & AI context.
"""
from __future__ import annotations

from typing import Any

HR_SPIKE_BPM = 15
HR_ABSOLUTE_HIGH = 105
STRESS_SPIKE_PCT = 18


def detect_anomalies(history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if len(history) < 2:
        return []

    anomalies: list[dict[str, Any]] = []
    prev = history[0]

    for i, point in enumerate(history[1:], start=1):
        hr = int(point.get("heart_rate", 0))
        stress = int(point.get("stress_level", 0))
        prev_hr = int(prev.get("heart_rate", hr))
        prev_stress = int(prev.get("stress_level", stress))
        hr_delta = hr - prev_hr
        stress_delta = stress - prev_stress

        is_hr_spike = hr_delta >= HR_SPIKE_BPM or hr >= HR_ABSOLUTE_HIGH
        is_stress_spike = stress_delta >= STRESS_SPIKE_PCT or stress >= 80

        if is_hr_spike or is_stress_spike:
            anomalies.append(
                {
                    "index": i,
                    "timestamp": point.get("timestamp"),
                    "heart_rate": hr,
                    "stress_level": stress,
                    "hr_delta": hr_delta,
                    "stress_delta": stress_delta,
                    "type": "hr_spike" if is_hr_spike else "stress_spike",
                    "label_time": _format_time(point.get("timestamp")),
                }
            )
        prev = point

    return anomalies[-5:]


def _format_time(ts: Any) -> str:
    if not ts:
        return "—"
    try:
        from datetime import datetime

        if isinstance(ts, str):
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        else:
            dt = ts
        return dt.strftime("%I:%M %p").lstrip("0")
    except Exception:
        return str(ts)[:16]


def latest_anomaly_prompt(anomaly: dict[str, Any] | None, lang: str) -> str | None:
    if not anomaly:
        return None
    t = anomaly.get("label_time", "—")
    hr = anomaly.get("heart_rate")
    if lang == "am":
        return (
            f"በ {t} ላይ የልብ ምት ጭማሪ ተመልክቷል ({hr} BPM)። "
            "በዚያን ጊዜ ምን እየተከሰተ ነበር?"
        )
    return (
        f"I noticed a spike at {t} ({hr} BPM). "
        "Did something specific happen around that time?"
    )
