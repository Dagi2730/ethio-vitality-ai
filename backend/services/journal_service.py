"""
Reflect Journal: store entries + Gemini emotion extraction.
"""
from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from google import genai

from services import data_store
from services.rag_context import get_rag_context

load_dotenv(override=True)

EMOTION_PROMPT = """
Analyze this journal entry. Return ONLY valid JSON:
{"emotion": "joy|calm|anxiety|sadness|anger|distress|neutral", "intensity": 0.0-1.0, "themes": ["theme1"], "summary_one_line": "..."}
Context: Ethiopian wellness, culturally sensitive.
"""


def _extract_emotion(text: str) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "extracted_emotion": "neutral",
            "intensity": 0.5,
            "themes": [],
            "summary_one_line": text[:80],
        }

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"{EMOTION_PROMPT}\n\nEntry:\n{text}",
            config={"thinking_config": {"include_thoughts": False}},
        )
        raw = (response.text or "").strip()
        if "```" in raw:
            raw = raw.split("```")[1].replace("json", "").strip()
        import json

        parsed = json.loads(raw)
        return {
            "extracted_emotion": parsed.get("emotion", "neutral"),
            "intensity": float(parsed.get("intensity", 0.5)),
            "themes": parsed.get("themes", []),
            "summary_one_line": parsed.get("summary_one_line", ""),
        }
    except Exception:
        lower = text.lower()
        if any(w in lower for w in ("anxious", "worried", "ጭንቀት")):
            emo = "anxiety"
        elif any(w in lower for w in ("sad", "ሀዘን", "depressed")):
            emo = "sadness"
        else:
            emo = "neutral"
        return {
            "extracted_emotion": emo,
            "intensity": 0.5,
            "themes": [],
            "summary_one_line": text[:80],
        }


def create_journal_entry(text: str, *, source: str = "text") -> dict[str, Any]:
    analysis = _extract_emotion(text)
    entry = data_store.add_journal_entry(
        text=text,
        source=source,
        extracted_emotion=analysis["extracted_emotion"],
        intensity=analysis["intensity"],
        themes=analysis["themes"],
        summary=analysis["summary_one_line"],
    )
    return entry
