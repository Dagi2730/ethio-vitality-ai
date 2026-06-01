"""
Analytics & B2B aggregation — decoupled from HTTP layer.
"""
from __future__ import annotations

from statistics import mean
from typing import Any

from services import data_store

# Synthetic corporate roster for demo B2B portal (replace with DB later)
DEPARTMENTS = {
    "Engineering": [42, 55, 68, 72, 48, 61, 75, 58],
    "Operations": [38, 45, 52, 60, 44, 50, 55, 48],
    "Guest Services": [55, 62, 70, 78, 65, 58, 72, 68],
    "Finance": [48, 52, 58, 65, 50, 54, 60, 52],
    "HR & Wellness": [30, 35, 40, 38, 32, 36, 42, 35],
}


def classify_stress(stress_level: int | float) -> str:
    if stress_level < 40:
        return "Low"
    if stress_level <= 70:
        return "Medium"
    return "High"


def _burnout_risk(avg_stress: float) -> str:
    if avg_stress >= 72:
        return "critical"
    if avg_stress >= 58:
        return "elevated"
    if avg_stress >= 45:
        return "watch"
    return "healthy"


def aggregate_business_insights() -> dict[str, Any]:
    latest = data_store.get_latest()
    live_stress = latest.get("stress_level", 0)
    history = data_store.get_history(limit=120)
    events = data_store.get_stress_events()

    dept_stats = []
    alerts: list[dict[str, Any]] = []
    all_avgs: list[float] = []

    for dept, samples in DEPARTMENTS.items():
        avg = round(mean(samples), 1)
        all_avgs.append(avg)
        risk = _burnout_risk(avg)
        classification = classify_stress(avg)
        entry = {
            "department": dept,
            "average_stress": avg,
            "classification": classification,
            "burnout_risk": risk,
            "headcount": len(samples),
        }
        dept_stats.append(entry)
        if risk in ("elevated", "critical"):
            alerts.append(
                {
                    "department": dept,
                    "severity": risk,
                    "message": f"{dept} average stress {avg}% — {classification} band",
                }
            )

    org_avg = round(mean(all_avgs), 1) if all_avgs else 0
    distribution = {"Low": 0, "Medium": 0, "High": 0}
    for d in dept_stats:
        distribution[d["classification"]] += 1

    heatmap = _build_burnout_heatmap(dept_stats)

    return {
        "privacy_notice": "All data anonymized and aggregated. No PII exposed.",
        "organization": {
            "average_stress": org_avg,
            "classification": classify_stress(org_avg),
            "departments_monitored": len(DEPARTMENTS),
            "active_alerts": len(alerts),
        },
        "live_digital_twin": {
            "heart_rate": latest.get("heart_rate"),
            "stress_level": live_stress,
            "classification": classify_stress(live_stress),
            "timestamp": latest.get("timestamp"),
        },
        "departments": dept_stats,
        "stress_distribution": distribution,
        "recent_stress_events": events[-10:],
        "trend_sample": [
            {
                "timestamp": h.get("timestamp"),
                "stress_level": h.get("stress_level"),
                "heart_rate": h.get("heart_rate"),
            }
            for h in history[-30:]
        ],
        "alerts": alerts,
        "burnout_heatmap": heatmap,
    }


def _build_burnout_heatmap(dept_stats: list) -> dict[str, Any]:
    """Anonymized department × risk grid for HR/Doctor portal."""
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    cells = []
    for dept_row in dept_stats:
        base = dept_row["average_stress"]
        for day in days:
            jitter = hash(f"{dept_row['department']}{day}") % 15 - 7
            value = max(10, min(95, int(base + jitter)))
            cells.append(
                {
                    "department": dept_row["department"],
                    "day": day,
                    "stress_index": value,
                    "risk_band": classify_stress(value),
                }
            )
    return {
        "days": days,
        "departments": [d["department"] for d in dept_stats],
        "cells": cells,
        "org_peak_day": max(cells, key=lambda c: c["stress_index"])["day"] if cells else None,
    }
