from __future__ import annotations
import os
import time
from typing import Any, Optional, List, Dict
from dotenv import load_dotenv
from google import genai
from google.genai import types

from services.crisis import BEFRIENDERS_ETHIOPIA, assess_crisis
from services.language import detect_language

load_dotenv(override=True)

# Cooldown state
_LAST_CALL_TIME = 0

def _get_system_persona() -> str:
    return (
        "You are 'Vitality', a companion who balances the wisdom of a psychologist with the warmth of a friend. "
        "1. BE HUMAN: No 'As an AI' or robotic phrases. Talk naturally. "
        "2. THERAPEUTIC DEPTH: Reflect on emotions; explore the 'why'. "
        "3. FRIENDLY LEVITY: Use dry, gentle humor to break tension. "
        "4. ADVICE STYLE: Weave insights from research into stories naturally. "
        "5. NO STATISTICS: Never list heart rate or stress percentages."
    )

def get_psychologist_response(
    user_input: str,
    current_data: dict,
    *,
    lang_hint: Optional[str] = "en",
    conversation: Optional[List[dict]] = None,
    **kwargs
) -> Dict[str, Any]:
    
    global _LAST_CALL_TIME
    conv = conversation or []
    detected_lang = detect_language(user_input, hint=lang_hint)
    
    hr = int(current_data.get("heart_rate", 72))
    stress = int(current_data.get("stress_level", 35))
    crisis = assess_crisis(hr, stress)
    
    result = {
        "reply": "",
        "detected_lang": detected_lang,
        "recommended_action": "none",
        "crisis": {"active": crisis["active"], "severity": crisis["severity"]},
    }

    if time.time() - _LAST_CALL_TIME < 15:
        result["reply"] = "I'm still thinking—give me a moment to catch up with you."
        return result

    api_key = os.getenv("GEMINI_API_KEY")
    try:
        _LAST_CALL_TIME = time.time()
        client = genai.Client(api_key=api_key)
        
        history_str = "\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in conv[-8:]])
        prompt = f"{_get_system_persona()}\n\nHistory:\n{history_str}\nUSER: {user_input}\nVITALITY:"

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.75)
        )
        
        # --- FIX: Explicitly access only the text content ---
        if response.text:
            result["reply"] = response.text.strip()
        else:
            # Fallback if the response is empty for some reason
            result["reply"] = "I'm listening—what's been on your mind lately?"
        
    except Exception as e:
        print(f"API Error: {e}")
        result["reply"] = "I'm listening—what's been on your mind lately?"
        
    return result