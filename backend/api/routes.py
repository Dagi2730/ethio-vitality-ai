"""
API routes — JWT enforced by AuthMiddleware; RBAC via Depends(is_authorized(...)).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from models.schemas import (
    ChatRequest,
    ChatResponse,
    CrisisInfo,
    HabitsUpdate,
    JournalRequest,
    MoodRequest,
    MoodResponse,
)
from services import data_store
from services.ai_coach import get_psychologist_response
from services.analytics import aggregate_business_insights
from services.anomalies import detect_anomalies, latest_anomaly_prompt
from services.insights_engine import generate_personal_insights
from services.journal_service import create_journal_entry
from services.language import detect_language
from services.rbac import Role, get_current_role, get_current_user, mask_for_professional
from services.routine_builder import build_daily_routine
from services.triggers import detect_triggers, narrative_stage

router = APIRouter(prefix="/api/v1")


def _mood_insight(sentiment: str, stress: int, lang: str) -> str:
    high_stress = stress >= 70
    if lang == "am":
        if high_stress and sentiment in ("sad", "anxious", "overwhelmed"):
            return "ጭንቀትዎ ከፍ ያለ እና ስሜትዎ ከባድ ይመስላል — እንደገና እንነጋገር።"
        if high_stress:
            return "የሰውነት ጭንቀት ከፍ ብሏል።"
        return "ስሜትዎ ተመዝግቧል።"
    if high_stress and sentiment in ("sad", "anxious", "overwhelmed"):
        return "Stress is elevated and your mood feels heavy — explore together in Coach."
    if high_stress:
        return "Physiological stress is high. How does that match what you feel?"
    return "Mood logged. Your Digital Twin will correlate this with vitals."


@router.get("/dashboard")
async def personal_dashboard(_: dict = Depends(get_current_user)):
    return {
        "vitals": data_store.get_latest(),
        "mood": data_store.get_latest_mood(),
        "triggers": detect_triggers(),
        "narrative": narrative_stage(),
        "anomalies": detect_anomalies(data_store.get_history(limit=120))[-3:],
    }


@router.get("/sensors/latest")
async def sensors_latest():
    return data_store.get_latest()


@router.get("/sensors/anomalies")
async def sensors_anomalies():
    history = data_store.get_history(limit=120)
    anomalies = detect_anomalies(history)
    latest = anomalies[-1] if anomalies else None
    return {
        "anomalies": anomalies,
        "latest": latest,
        "prompt_en": latest_anomaly_prompt(latest, "en"),
        "prompt_am": latest_anomaly_prompt(latest, "am"),
    }


@router.get("/triggers")
async def list_triggers():
    return {"triggers": detect_triggers(), "narrative": narrative_stage()}


@router.post("/mood", response_model=MoodResponse)
async def log_mood(request: MoodRequest):
    mood = data_store.record_mood(request.sentiment, request.emoji)
    vitals = data_store.get_latest()
    stress = int(vitals.get("stress_level", 0))
    lang = "am" if request.emoji and ord(request.emoji[0]) > 127 else "en"
    return MoodResponse(
        mood=mood,
        latest_vitals=vitals,
        insight=_mood_insight(request.sentiment, stress, lang),
        triggers=detect_triggers(),
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    latest = data_store.get_latest()
    mood = data_store.get_latest_mood()
    history = data_store.get_history(limit=120)
    anomalies = detect_anomalies(history)
    latest_anomaly = anomalies[-1] if anomalies else None
    detected_preview = detect_language(request.input, hint=request.lang)
    anomaly_note = latest_anomaly_prompt(latest_anomaly, detected_preview)

    role = current_user.get("role", "user")
    journal_summaries = None
    org_insights = None
    if role == "doctor":
        journal_summaries = data_store.get_journal_entries(limit=5)
    elif role == "hr":
        org_insights = aggregate_business_insights()

    conv = [{"role": m.role, "content": m.content} for m in request.messages]

    out = get_psychologist_response(
        request.input,
        latest,
        lang_hint=None if request.auto_detect_lang else request.lang,
        mood=mood if role == "user" else None,
        anomaly_note=anomaly_note,
        audience_role=role,
        journal_summaries=journal_summaries,
        org_insights=org_insights,
        conversation=conv,
        sensor_history=history if role == "user" else None,
    )

    return ChatResponse(
        reply=out["reply"],
        lang=request.lang,
        detected_lang=out["detected_lang"],
        recommended_action=out["recommended_action"],
        crisis=CrisisInfo(**out["crisis"]),
        crisis_support=out.get("crisis_support"),
        anomaly_prompt=anomaly_note,
    )


@router.get("/insights/personal")
async def personal_insights():
    return generate_personal_insights()


@router.post("/journal")
async def journal_entry(request: JournalRequest):
    entry = create_journal_entry(request.text, source=request.source)
    return {"entry": entry, "triggers": detect_triggers()}


@router.get("/journal")
async def list_journal():
    return {"entries": data_store.get_journal_entries(limit=30)}


@router.get("/routine")
async def get_routine(lang: str = "en"):
    routine = build_daily_routine(lang if lang in ("en", "am") else "en")
    data_store.cache_routine(routine)
    return routine


@router.patch("/habits")
async def update_habits(body: HabitsUpdate):
    updates = body.model_dump(exclude_none=True)
    return data_store.update_habits(updates)


@router.get("/business/insights")
async def business_insights(role: Role = Depends(get_current_role)):
    data = aggregate_business_insights()
    return mask_for_professional(data, role)


@router.get("/business/heatmap")
async def business_heatmap(role: Role = Depends(get_current_role)):
    data = aggregate_business_insights()
    return {
        "privacy_notice": data.get("privacy_notice"),
        "burnout_heatmap": data.get("burnout_heatmap"),
        "organization": mask_for_professional(data.get("organization", {}), role),
    }
