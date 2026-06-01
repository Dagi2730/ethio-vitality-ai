"""
API routes — JWT enforced by AuthMiddleware; RBAC via Depends(is_authorized(...)).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request

from db.database import SessionLocal
from db import repository
from models.schemas import (
    ChatRequest,
    ChatResponse,
    CrisisInfo,
    HabitsUpdate,
    JournalRequest,
    JournalUpdateRequest,
    MoodRequest,
    MoodResponse,
    PrivacyUpdate,
)
from services import data_store
from services.activity import log_user_activity
from services.ai_coach import get_psychologist_response
from services.analytics import aggregate_business_insights
from services.anomalies import detect_anomalies, latest_anomaly_prompt
from services.insights_engine import generate_personal_insights
from services.journal_service import create_journal_entry
from services.language import detect_language
from services.rbac import (
    Role,
    get_current_role,
    get_current_user,
    mask_for_professional,
    require_doctor,
    require_hr,
    require_professional,
    require_user,
)
from services.routine_builder import build_daily_routine
from services.triggers import detect_triggers, narrative_stage

router = APIRouter(prefix="/api/v1")


def _uid(user: dict) -> int:
    uid = user.get("user_id")
    if not uid:
        raise HTTPException(401, "Invalid session — please sign in again")
    return int(uid)


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
async def personal_dashboard(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    uid = _uid(user)
    log_user_activity(uid, "view", "dashboard", request=None)
    return {
        "vitals": data_store.get_latest(uid),
        "mood": data_store.get_latest_mood(uid),
        "triggers": detect_triggers(uid),
        "narrative": narrative_stage(uid),
        "anomalies": detect_anomalies(data_store.get_history(uid, limit=120))[-3:],
    }


@router.get("/sensors/latest")
async def sensors_latest(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    return data_store.get_latest(_uid(user))


@router.get("/sensors/anomalies")
async def sensors_anomalies(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    uid = _uid(user)
    history = data_store.get_history(uid, limit=120)
    anomalies = detect_anomalies(history)
    latest = anomalies[-1] if anomalies else None
    return {
        "anomalies": anomalies,
        "latest": latest,
        "prompt_en": latest_anomaly_prompt(latest, "en"),
        "prompt_am": latest_anomaly_prompt(latest, "am"),
    }


@router.get("/triggers")
async def list_triggers(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    uid = _uid(user)
    return {"triggers": detect_triggers(uid), "narrative": narrative_stage(uid)}


@router.post("/mood", response_model=MoodResponse)
async def log_mood(
    request: MoodRequest,
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    uid = _uid(user)
    mood = data_store.record_mood(uid, request.sentiment, request.emoji)
    vitals = data_store.get_latest(uid)
    stress = int(vitals.get("stress_level", 0))
    lang = "am" if request.emoji and ord(request.emoji[0]) > 127 else "en"
    log_user_activity(uid, "log_mood", "mood", detail=request.sentiment)
    return MoodResponse(
        mood=mood,
        latest_vitals=vitals,
        insight=_mood_insight(request.sentiment, stress, lang),
        triggers=detect_triggers(uid),
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    uid = _uid(current_user)
    role = current_user.get("role", "user")
    latest = data_store.get_latest(uid)
    mood = data_store.get_latest_mood(uid)
    history = data_store.get_history(uid, limit=120)
    anomalies = detect_anomalies(history)
    latest_anomaly = anomalies[-1] if anomalies else None
    detected_preview = detect_language(request.input, hint=request.lang)
    anomaly_note = latest_anomaly_prompt(latest_anomaly, detected_preview)

    journal_summaries = None
    org_insights = None
    if role == "doctor":
        db = SessionLocal()
        try:
            journal_summaries = []
            for p in repository.get_clinical_patients(db):
                pid = int(p["id"])
                priv = repository.get_privacy(db, pid)
                if priv.share_journal_summary:
                    journal_summaries.extend(data_store.get_journal_entries(pid, limit=3))
        finally:
            db.close()
    elif role == "hr":
        org_insights = aggregate_business_insights(Role.HR)

    conv = [{"role": m.role, "content": m.content} for m in request.messages]
    log_user_activity(uid, "chat", "coach", detail=request.input[:80])

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
async def personal_insights(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    uid = _uid(user)
    db = SessionLocal()
    try:
        repository.ensure_daily_reminders(db, uid)
    finally:
        db.close()
    return generate_personal_insights(uid)


@router.post("/journal")
async def journal_entry(
    request: JournalRequest,
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    uid = _uid(user)
    entry = create_journal_entry(uid, request.text, source=request.source)
    log_user_activity(uid, "create", "journal")
    return {"entry": entry, "triggers": detect_triggers(uid)}


@router.put("/journal/{entry_id}")
async def update_journal_entry(
    entry_id: int,
    body: JournalUpdateRequest,
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    uid = _uid(user)
    entry = data_store.update_journal_entry(uid, entry_id, body.text)
    if not entry:
        raise HTTPException(404, "Journal entry not found")
    log_user_activity(uid, "update", "journal", detail=str(entry_id))
    return {"entry": entry}


@router.get("/journal")
async def list_journal(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    return {"entries": data_store.get_journal_entries(_uid(user), limit=30)}


@router.get("/routine")
async def get_routine(
    lang: str = "en",
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    uid = _uid(user)
    routine = build_daily_routine(uid, lang if lang in ("en", "am") else "en")
    data_store.cache_routine(uid, routine)
    return routine


@router.patch("/habits")
async def update_habits(
    body: HabitsUpdate,
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    updates = body.model_dump(exclude_none=True)
    return data_store.update_habits(_uid(user), updates)


@router.get("/privacy")
async def get_privacy_settings(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    db = SessionLocal()
    try:
        row = repository.get_privacy(db, _uid(user))
        return {
            "share_with_hr": row.share_with_hr,
            "share_with_doctor": row.share_with_doctor,
            "share_vitals": row.share_vitals,
            "share_mood": row.share_mood,
            "share_journal_summary": row.share_journal_summary,
        }
    finally:
        db.close()


@router.patch("/privacy")
async def update_privacy_settings(
    body: PrivacyUpdate,
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(400, "No privacy fields to update")
    db = SessionLocal()
    try:
        row = repository.update_privacy(db, _uid(user), updates)
        log_user_activity(_uid(user), "update", "privacy")
        return {
            "share_with_hr": row.share_with_hr,
            "share_with_doctor": row.share_with_doctor,
            "share_vitals": row.share_vitals,
            "share_mood": row.share_mood,
            "share_journal_summary": row.share_journal_summary,
        }
    finally:
        db.close()


@router.get("/notifications")
async def list_notifications(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    db = SessionLocal()
    try:
        uid = _uid(user)
        repository.ensure_daily_reminders(db, uid)
        return {"notifications": repository.get_notifications(db, uid)}
    finally:
        db.close()


@router.post("/notifications/{notification_id}/read")
async def mark_notification(
    notification_id: int,
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_user),
):
    db = SessionLocal()
    try:
        ok = repository.mark_notification_read(db, _uid(user), notification_id)
        if not ok:
            raise HTTPException(404, "Notification not found")
        return {"ok": True}
    finally:
        db.close()


@router.get("/activity")
async def activity_log(
    user: dict = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        uid = _uid(user)
        role = user.get("role")
        if role not in ("user", "hr", "doctor"):
            raise HTTPException(403, "Forbidden")
        return {"logs": repository.list_activity_logs(db, uid, limit=50)}
    finally:
        db.close()


@router.get("/business/insights")
async def business_insights(
    user: dict = Depends(get_current_user),
    role: Role = Depends(require_hr),
):
    log_user_activity(_uid(user), "view", "business_insights")
    data = aggregate_business_insights(Role.HR)
    return mask_for_professional(data, role)


@router.get("/business/heatmap")
async def business_heatmap(role: Role = Depends(require_hr)):
    data = aggregate_business_insights(Role.HR)
    return {
        "privacy_notice": data.get("privacy_notice"),
        "burnout_heatmap": data.get("burnout_heatmap"),
        "organization": mask_for_professional(data.get("organization", {}), role),
    }


@router.get("/clinical/ward")
async def clinical_ward(
    user: dict = Depends(get_current_user),
    _: Role = Depends(require_doctor),
):
    db = SessionLocal()
    try:
        patients = repository.get_clinical_patients(db)
        log_user_activity(_uid(user), "view", "clinical_ward")
    finally:
        db.close()
    return {"patients": patients}


@router.get("/clinical/patients/{patient_id}/trend")
async def clinical_patient_trend(
    patient_id: int,
    _: Role = Depends(require_doctor),
):
    db = SessionLocal()
    try:
        trend = repository.get_patient_stress_trend(db, patient_id)
    finally:
        db.close()
    return {"trend": trend}
