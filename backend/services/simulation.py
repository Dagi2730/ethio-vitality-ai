"""
Digital Twin: per-user physiological simulation (15s interval, non-blocking).
"""
from __future__ import annotations

import asyncio
import math
import random
from datetime import datetime, timezone

from db.database import SessionLocal
from db import repository
from services import data_store

HR_MIN, HR_MAX = 60, 120
STRESS_MIN, STRESS_MAX = 10, 95
UPDATE_INTERVAL_SEC = 15
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
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._running = False
        self._prev_stress: dict[int, float] = {}

    @staticmethod
    def _circadian_factor(hour: float) -> float:
        return 0.5 + 0.5 * math.sin((hour - 6) * math.pi / 12)

    def _sample_metrics(self, user_id: int) -> tuple[int, int, str, float]:
        now = datetime.now()
        hour = now.hour + now.minute / 60
        circadian = self._circadian_factor(hour)
        seed = user_id % 7

        base_hr = 68 + 22 * circadian + seed
        heart_rate = int(max(HR_MIN, min(HR_MAX, base_hr + random.gauss(0, 4))))

        base_stress = 25 + 45 * circadian + seed * 2
        if 7 <= hour <= 9 or 17 <= hour <= 19:
            base_stress += random.uniform(5, 18)
        stress = int(max(STRESS_MIN, min(STRESS_MAX, base_stress + random.gauss(0, 8))))
        mood = _stress_to_mood(stress, hour)
        sleep_hours = round(5.5 + 2 * (1 - circadian) + random.uniform(-0.3, 0.3), 1)
        return heart_rate, stress, mood, sleep_hours

    def _maybe_flag_stress_event(self, user_id: int, heart_rate: int, stress: int) -> None:
        prev = self._prev_stress.get(user_id, 35.0)
        delta = stress - prev
        if delta >= STRESS_SPIKE_THRESHOLD or stress >= 80:
            data_store.append_stress_event(
                {
                    "type": "stress_spike",
                    "user_id": user_id,
                    "heart_rate": heart_rate,
                    "stress_level": stress,
                    "delta": round(delta, 1),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )
        self._prev_stress[user_id] = stress

    def _tick_sync(self) -> None:
        """Run DB work off the asyncio event loop so HTTP handlers stay responsive."""
        db = SessionLocal()
        try:
            user_ids = repository.get_all_user_ids(db)
        finally:
            db.close()
        for uid in user_ids:
            hr, stress, mood, sleep_h = self._sample_metrics(uid)
            data_store.ingest_reading(
                uid, hr, stress, source="simulation", simulated_mood=mood, sleep_hours=sleep_h
            )
            self._maybe_flag_stress_event(uid, hr, stress)

    async def _loop(self) -> None:
        while self._running:
            await asyncio.to_thread(self._tick_sync)
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
