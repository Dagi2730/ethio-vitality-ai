"""
Digital Twin: 24-hour physiological + mood simulation (5s interval).
"""
from __future__ import annotations

import asyncio
import math
import random
from datetime import datetime, timezone

from services import data_store

HR_MIN, HR_MAX = 60, 120
STRESS_MIN, STRESS_MAX = 10, 95
UPDATE_INTERVAL_SEC = 5
STRESS_SPIKE_THRESHOLD = 15


def _stress_to_mood(stress: int, hour: float) -> str:
    if stress >= 75:
        return "anxious"
    if stress >= 55:
        return "tired" if hour > 18 else "focused"
    if stress < 35:
        return "calm"
    return "energized" if 9 <= hour <= 17 else "calm"


class WellnessSimulator:
    """Async Digital Twin — swap for MQTT by stopping this and ingesting externally."""

    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._running = False
        self._prev_stress: float = 35.0

    @staticmethod
    def _circadian_factor(hour: float) -> float:
        return 0.5 + 0.5 * math.sin((hour - 6) * math.pi / 12)

    def _sample_metrics(self) -> tuple[int, int, str, float]:
        now = datetime.now()
        hour = now.hour + now.minute / 60
        circadian = self._circadian_factor(hour)

        base_hr = 68 + 22 * circadian
        heart_rate = int(max(HR_MIN, min(HR_MAX, base_hr + random.gauss(0, 4))))

        base_stress = 25 + 45 * circadian
        if 7 <= hour <= 9 or 17 <= hour <= 19:
            base_stress += random.uniform(5, 18)
        stress = int(max(STRESS_MIN, min(STRESS_MAX, base_stress + random.gauss(0, 8))))

        mood = _stress_to_mood(stress, hour)
        sleep_hours = round(5.5 + 2 * (1 - circadian) + random.uniform(-0.3, 0.3), 1)
        return heart_rate, stress, mood, sleep_hours

    def _maybe_flag_stress_event(self, heart_rate: int, stress: int) -> None:
        delta = stress - self._prev_stress
        if delta >= STRESS_SPIKE_THRESHOLD or stress >= 80:
            data_store.append_stress_event(
                {
                    "type": "stress_spike",
                    "heart_rate": heart_rate,
                    "stress_level": stress,
                    "delta": round(delta, 1),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )
        self._prev_stress = stress

    async def _loop(self) -> None:
        while self._running:
            hr, stress, mood, sleep_h = self._sample_metrics()
            data_store.ingest_reading(
                hr, stress, source="simulation", simulated_mood=mood, sleep_hours=sleep_h
            )
            self._maybe_flag_stress_event(hr, stress)
            await asyncio.sleep(UPDATE_INTERVAL_SEC)

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None


simulator = WellnessSimulator()
