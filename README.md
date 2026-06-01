# Ethio-Vitality AI

Premium **B2B2C** mental health and burnout management ecosystem — proactive wellness through a **Digital Twin**, culturally nuanced **CBT psychology**, and **privacy-first** corporate analytics.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    INGESTION (MQTT-ready)                        │
│  WellnessSimulator ──► data_store.ingest_reading() ◄── MQTT     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                 INTELLIGENCE LAYER (FastAPI)                     │
│  triggers.py      Real-time spike ↔ mood/journal correlation     │
│  insights_engine  Predictive sleep/habit/mood analytics            │
│  ai_coach.py      Gemini + RAG (Ethiopian wellness corpus)       │
│  journal_service  Voice/text → emotion extraction                  │
│  routine_builder  Auto daily schedule from vitals + mood           │
│  analytics.py     Anonymized B2B aggregates + burnout heatmap    │
│  rbac.py          user | hr | doctor (X-Role header)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────┐                         ┌───────────────────┐
│  PERSONAL APP     │                         │ PROFESSIONAL      │
│  (B2C · 5 pages)  │                         │ PORTAL (B2B)      │
│  React + Zustand  │                         │ HR / Doctor RBAC  │
└───────────────────┘                         └───────────────────┘
```

---

## Personal App (5 pages)

| Route | Page | Purpose |
|-------|------|---------|
| `/personal` | **Smart Dashboard** | Live Digital Twin, 1-tap mood, micro-interventions, narrative journey |
| `/personal/coach` | **AI Psychologist** | CBT, voice STT/TTS, crisis breathing, RAG context |
| `/personal/insights` | **Insight Engine** | Sleep/habit/mood predictions, burnout forecast |
| `/personal/reflect` | **Reflect Journal** | Voice/text journaling + AI emotion tags |
| `/personal/actions` | **Action Hub** | Auto-Routine Builder (personalized daily blocks) |

---

## Professional Portal (B2B)

| Route | Access | Content |
|-------|--------|---------|
| `/manager` | `X-Role: hr` or `doctor` | Anonymized dept stats, alerts, charts |
| `/manager/heatmap` | Professional roles | Department × day burnout heatmap |

**No PII** — journal text, chat, and individual vitals are never exposed to HR/Doctor views.

---

## API Reference

| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/dashboard` | user |
| GET | `/api/v1/triggers` | any |
| POST | `/api/v1/mood` | any |
| POST | `/api/v1/chat` | any |
| GET | `/api/v1/insights/personal` | any |
| POST | `/api/v1/journal` | any |
| GET | `/api/v1/routine` | any |
| GET | `/api/v1/business/insights` | hr, doctor |
| GET | `/api/v1/business/heatmap` | hr, doctor |

### Authentication (hybrid)

1. **Middleware (gatekeeper):** `AuthMiddleware` validates `Authorization: Bearer <JWT>` on every `/api/v1/*` route except login. Business routes return **403** if role is not `hr` or `doctor`.
2. **Route guards (guide):** React `<ProtectedRoute />` and space guards redirect unauthenticated users to `/login`, wrong roles to `/unauthorized`.

**Demo logins:**

| Email | Password | Role |
|-------|----------|------|
| user@ethio.dev | user123 | Personal (B2C) |
| hr@ethio.dev | hr123 | HR / Manager portal |
| doctor@ethio.dev | doc123 | Doctor / Manager portal |

---

## Digital Twin & MQTT

```python
# backend/services/data_store.py
data_store.ingest_reading(
    heart_rate=88,
    stress_level=52,
    source="mqtt",
    simulated_mood="focused",
    sleep_hours=7.0,
)
```

Stop `WellnessSimulator` in `main.py` lifespan when hardware-only mode is desired.

---

## Quick Start

```bash
# Backend
cd backend && pip install -r requirements.txt
cp .env.example .env   # GEMINI_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

API base URL defaults to `http://127.0.0.1:8000` (`frontend/.env.development`).  
Restart `npm run dev` after changing env vars.

- Personal: http://localhost:5173/personal  
- Manager: http://localhost:5173/manager (select HR/Doctor role)

---

## Design

- **Vitality Blue** + **Calm Gray** (Tailwind `vitality-*`, `calm-*`)
- Mobile-first bottom nav (personal); enterprise layout (manager)
- Narrative-driven UX: stress detection → intervention → resolution

---

## License

MIT
