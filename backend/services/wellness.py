from .translator import get_tip

def generate_wellness_advice(stress_level: int, lang: str = "en"):
    status = "high" if stress_level > 70 else "normal"
    tip = get_tip(status, lang)
    
    # FUTURE: Integrate Gemini API here
    # response = gemini_client.generate_content(f"In {lang}, suggest a tip for stress {stress_level}")
    
    return {"wellness_tip": tip}