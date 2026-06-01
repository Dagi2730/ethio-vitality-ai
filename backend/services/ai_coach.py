"""
Vitality AI coach — conversation memory, CBT, role-aware, crisis protocol.
"""
from __future__ import annotations

import os
import re
import time
from typing import Any, Optional

from dotenv import load_dotenv
from google import genai

from services.crisis import BEFRIENDERS_ETHIOPIA, assess_crisis, crisis_payload
from services.language import detect_language
from services.rag_context import get_rag_context
from services.vitality_prompt import (
    AUDIENCE_MODES,
    CRISIS_USER_SIGNALS,
    OVERWHELM_SIGNALS,
    VITALITY_SYSTEM_PROMPT,
)

load_dotenv(override=True)

MAX_RETRIES = 3
RETRY_BASE_DELAY_SEC = 2.0
MAX_HISTORY_TURNS = 24

MOOD_LABELS = {
    "great": "great / positive",
    "okay": "okay / neutral",
    "low": "low / tired",
    "sad": "sad",
    "anxious": "anxious / worried",
    "overwhelmed": "overwhelmed",
}


def _user_message_suggests_crisis(text: str) -> bool:
    lower = text.lower()
    return any(sig in lower for sig in CRISIS_USER_SIGNALS)


def _user_message_suggests_overwhelm(text: str) -> bool:
    lower = text.lower()
    return any(sig in lower for sig in OVERWHELM_SIGNALS)


def _build_vitals_trend(sensor_history: list[dict]) -> str:
    if len(sensor_history) < 3:
        return ""
    recent = sensor_history[-48:]
    stress_vals = [int(h.get("stress_level", 0)) for h in recent if h.get("stress_level") is not None]
    sleep_vals = [float(h.get("sleep_hours", 0)) for h in recent if h.get("sleep_hours")]
    if not stress_vals:
        return ""
    avg_stress = sum(stress_vals) / len(stress_vals)
    latest_stress = stress_vals[-1]
    trend = "stable"
    if len(stress_vals) >= 6:
        early = sum(stress_vals[: len(stress_vals) // 2]) / (len(stress_vals) // 2)
        late = sum(stress_vals[len(stress_vals) // 2 :]) / (len(stress_vals) - len(stress_vals) // 2)
        if late - early >= 8:
            trend = "climbing"
        elif early - late >= 8:
            trend = "easing"
    sleep_line = ""
    if sleep_vals:
        avg_sleep = sum(sleep_vals) / len(sleep_vals)
        sleep_line = f" Avg sleep (sim): {avg_sleep:.1f}h."
    return (
        f"Vitals trend (use to open conversation when relevant): stress now {latest_stress}%, "
        f"recent avg {avg_stress:.0f}%, trend {trend}.{sleep_line}\n"
    )


def _build_conversation_note(conversation: list[dict]) -> str:
    if not conversation:
        return "\nThis is the start of the conversation. Do NOT use a generic opener you've used before.\n"
    n_user = sum(1 for m in conversation if m.get("role") == "user")
    n_all = len(conversation)
    return (
        f"\nConversation turn: user message #{n_user + 1} ({n_all} prior messages in transcript). "
        "Read the full transcript below — never act like the chat just started.\n"
    )


def _build_gemini_contents(
    conversation: list[dict],
    user_input: str,
    mood_context: str = "",
) -> list[dict[str, Any]]:
    contents: list[dict[str, Any]] = []
    for msg in conversation[-MAX_HISTORY_TURNS:]:
        role = msg.get("role", "user")
        text = (msg.get("content") or "").strip()[:2000]
        if not text:
            continue
        gemini_role = "user" if role == "user" else "model"
        contents.append({"role": gemini_role, "parts": [{"text": text}]})
    final = f"{mood_context}{user_input}".strip()
    contents.append({"role": "user", "parts": [{"text": final}]})
    return contents


def _build_audience_data_context(
    audience_role: str,
    *,
    journal_summaries: Optional[list[dict]] = None,
    org_insights: Optional[dict] = None,
) -> str:
    if audience_role == "doctor" and journal_summaries:
        lines = ["Clinical context (summaries only — not raw journal unless marked shared):"]
        for j in journal_summaries[-5:]:
            lines.append(
                f"- {j.get('timestamp', '')}: emotion={j.get('extracted_emotion')}, "
                f"summary={j.get('summary_one_line', j.get('text_preview', ''))}"
            )
        return "\n".join(lines) + "\n"
    if audience_role == "hr" and org_insights:
        org = org_insights.get("organization", {})
        depts = org_insights.get("departments", [])[:5]
        lines = [
            "Anonymized organizational data:",
            f"- Org avg stress: {org.get('average_stress')}% ({org.get('classification')})",
            f"- Active alerts: {org.get('active_alerts', 0)}",
        ]
        for d in depts:
            lines.append(
                f"- {d.get('department')}: avg {d.get('average_stress')}% "
                f"({d.get('burnout_risk')} risk)"
            )
        return "\n".join(lines) + "\n"
    return ""


def _build_instruction(
    lang: str,
    current_data: dict,
    mood: dict | None,
    crisis: dict,
    anomaly_note: str | None,
    audience_role: str = "user",
    user_input: str = "",
    audience_context: str = "",
    conversation: Optional[list[dict]] = None,
    vitals_trend: str = "",
) -> str:
    hr = current_data.get("heart_rate", "—")
    stress = current_data.get("stress_level", "—")
    sleep = current_data.get("sleep_hours", "—")
    sim_mood = current_data.get("simulated_mood", "—")

    mood_line = ""
    if mood:
        sent = mood.get("sentiment", "")
        mood_line = (
            f"Mood check-in: {MOOD_LABELS.get(sent, sent)} {mood.get('emoji', '')} "
            f"at {mood.get('timestamp', '')}\n"
        )

    crisis_line = ""
    if crisis.get("active") or _user_message_suggests_crisis(user_input):
        crisis_line = (
            f"\nCRISIS: Ask 'Are you safe right now?' Stay present. "
            f"Befrienders Ethiopia: {BEFRIENDERS_ETHIOPIA}. Do not pivot away quickly.\n"
        )
    elif _user_message_suggests_overwhelm(user_input):
        crisis_line = (
            "\nOVERWHELM: Offer 4-4-6 breathing BEFORE continuing the conversation.\n"
        )

    twin_block = ""
    if audience_role == "user" and (hr != "—" or stress != "—"):
        twin_block = (
            f"Digital Twin snapshot — HR: {hr} BPM, Stress: {stress}%, "
            f"Sleep (sim): {sleep}h, Twin mood: {sim_mood}.\n"
            + vitals_trend
            + mood_line
        )

    anomaly_line = f"\nRecent vitals anomaly: {anomaly_note}\n" if anomaly_note else ""
    mode = AUDIENCE_MODES.get(audience_role, AUDIENCE_MODES["user"])
    conv_note = _build_conversation_note(conversation or [])

    return (
        VITALITY_SYSTEM_PROMPT
        + mode
        + conv_note
        + "\n--- Ethiopian wellness knowledge (RAG) ---\n"
        + get_rag_context()
        + audience_context
        + f"\nLanguage preference (auto-match user): {lang}\n"
        + twin_block
        + crisis_line
        + anomaly_line
    )


def _is_rate_limit_error(exc: Exception) -> bool:
    msg = str(exc).upper()
    return "429" in msg or "RESOURCE_EXHAUSTED" in msg or "RATE" in msg


def _infer_recommended_action(crisis: dict, reply: str, user_input: str) -> str:
    if crisis.get("active") or _user_message_suggests_crisis(user_input):
        return "breathing_exercise" if crisis.get("severity") != "none" else "crisis_support"
    if _user_message_suggests_overwhelm(user_input):
        return "breathing_exercise"
    lower = reply.lower()
    if "breath" in lower or "inhale" in lower or "እስትንፋስ" in reply:
        return "breathing_exercise"
    if "crisis" in lower or "befrienders" in lower or BEFRIENDERS_ETHIOPIA in reply:
        return "crisis_support"
    return crisis.get("recommended_action") or "none"


def _contextual_fallback(
    lang: str,
    user_input: str,
    audience_role: str,
    conversation: list[dict],
    crisis: dict,
) -> str:
    text = user_input.strip().lower()
    turn = sum(1 for m in conversation if m.get("role") == "user")

    if _user_message_suggests_crisis(user_input) or (
        crisis.get("active") and crisis.get("severity") in ("critical", "elevated")
    ):
        payload = crisis_payload(lang)
        if lang == "am":
            return (
                "እዚህ ነኝ — አንድ ደቂታ እንቆም።\n\n"
                + payload["breathing_guide"]
                + f"\n\nአሁን ደህንነትዎ እንዳለ ያስታውሱኝ? Befrienders Ethiopia: {BEFRIENDERS_ETHIOPIA}\n"
                "ከእኔ ጋር ቆይ — እንወያይ።"
            )
        return (
            "Stay with me for a moment — try this breath first:\n\n"
            + payload["breathing_guide"]
            + f"\n\nAre you safe right now? Befrienders Ethiopia: {BEFRIENDERS_ETHIOPIA}\n"
            "I'm not going anywhere. Talk to me."
        )

    if re.search(r"hear me|can you hear|ስማ", text):
        if lang == "am":
            return "አዎን፣ በጥሩ ሁኔታ እሰማዎታለሁ። ስለ ምን እንደሚያስጨንቅዎ — አሁን ወይስ ቀደም ብሎ?"
        return "Yes — I hear you clearly. What's hitting you right now, or has it been building?"

    if "stress" in text or "ጭንቀት" in text or "stressed" in text:
        if lang == "am":
            return "ጭንቀት — ትክክል ነው። አሁን እየመጣ ነው ወይስ ቀደም ብሎ እየጠገበ ነው?"
        return "Stress — okay. Is it hitting you right now, or has it been building for a while?"

    if audience_role == "hr":
        return (
            "This week's anonymized data suggests elevated stress in some departments. "
            "Consider reviewing morning meeting load — not individual targeting."
            if lang == "en"
            else "የዚህ ሳምንት ውሂብ ከፍተኛ ጭንቀት ያሳያል። የጠዋት ስብሰባ መጠን ይገምገሙ።"
        )

    if audience_role == "doctor":
        return (
            "Trend: stress markers elevated in recent samples. "
            "Pattern: possible sleep disruption. "
            "Flag: late-afternoon spikes. "
            "Suggested inquiry: workload and deadline structure this week."
            if lang == "en"
            else "የቅርብ ጊዜ ውሂብ ከፍተኛ ጭንቀት ያሳያል። የስራ ጫን መጠን ይጠይቁ።"
        )

    if turn > 0:
        if lang == "am":
            return "እያዳምጥሁ ነው — ቀጥል።"
        return "I'm following — keep going."

    if lang == "am":
        return "እዚህ ነኝ Vitality። ዛሬ ምን እያሰብክ ነው?"
    return "I'm Vitality. What's actually on your mind right now?"


def get_psychologist_response(
    user_input: str,
    current_data: dict,
    *,
    lang_hint: str | None = "en",
    mood: dict | None = None,
    anomaly_note: str | None = None,
    audience_role: str = "user",
    journal_summaries: Optional[list[dict]] = None,
    org_insights: Optional[dict] = None,
    conversation: Optional[list[dict]] = None,
    sensor_history: Optional[list[dict]] = None,
) -> dict[str, Any]:
    """Returns structured Vitality response for the API layer."""
    conv = conversation or []
    detected_lang = detect_language(user_input, hint=lang_hint)
    hr = int(current_data.get("heart_rate", 72))
    stress = int(current_data.get("stress_level", 35))
    crisis = assess_crisis(hr, stress)
    vitals_trend = _build_vitals_trend(sensor_history or []) if audience_role == "user" else ""

    crisis_active = crisis["active"] or _user_message_suggests_crisis(user_input)

    result: dict[str, Any] = {
        "reply": "",
        "detected_lang": detected_lang,
        "recommended_action": crisis.get("recommended_action", "none"),
        "crisis": {
            "active": crisis_active,
            "severity": crisis["severity"],
        },
    }

    if crisis_active:
        result["crisis_support"] = crisis_payload(detected_lang)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        result["reply"] = (
            "Vitality needs GEMINI_API_KEY in backend/.env."
            if detected_lang == "en"
            else "Vitality — GEMINI_API_KEY ያስፈልጋል።"
        )
        result["recommended_action"] = _infer_recommended_action(
            crisis, result["reply"], user_input
        )
        return result

    audience_context = _build_audience_data_context(
        audience_role,
        journal_summaries=journal_summaries,
        org_insights=org_insights,
    )

    client = genai.Client(api_key=api_key)
    system_instruction = _build_instruction(
        detected_lang,
        current_data,
        mood,
        crisis,
        anomaly_note,
        audience_role=audience_role,
        user_input=user_input,
        audience_context=audience_context,
        conversation=conv,
        vitals_trend=vitals_trend,
    )

    mood_context = ""
    if mood and audience_role == "user":
        mood_context = f"[Mood check-in: {mood.get('sentiment')} {mood.get('emoji')}]\n"

    contents = _build_gemini_contents(conv, user_input, mood_context)
    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=contents,
                config={
                    "system_instruction": system_instruction,
                    "thinking_config": {"include_thoughts": False},
                },
            )
            text = response.text or ""
            result["reply"] = text.strip() or _contextual_fallback(
                detected_lang, user_input, audience_role, conv, crisis
            )
            result["recommended_action"] = _infer_recommended_action(
                crisis, result["reply"], user_input
            )
            return result
        except Exception as e:
            last_error = e
            if _is_rate_limit_error(e) and attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_BASE_DELAY_SEC * (2**attempt))
                continue
            break

    if last_error and _is_rate_limit_error(last_error):
        result["reply"] = (
            "Vitality is briefly at capacity — try again in a moment."
            if detected_lang == "en"
            else "Vitality ትንሽ ቆይቷል — እባክዎ ይሞክሩ።"
        )
    else:
        result["reply"] = _contextual_fallback(
            detected_lang, user_input, audience_role, conv, crisis
        )

    result["recommended_action"] = _infer_recommended_action(
        crisis, result["reply"], user_input
    )
    if crisis_active:
        result["crisis_support"] = crisis_payload(detected_lang)
    return result


def get_ai_response(user_input: str, current_data: dict, lang: str = "en") -> str:
    out = get_psychologist_response(user_input, current_data, lang_hint=lang)
    return out["reply"]
