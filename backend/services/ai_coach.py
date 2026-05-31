# backend/services/ai_coach.py

def get_proactive_advice(stress_level: int, lang: str):
    """Used for the passive coach alert."""
    if stress_level > 70:
        return "High stress detected. Please take a deep breath." if lang == "en" else "ከፍተኛ ጭንቀት ታይቷል። እባክዎን በጥልቀት ይተንፍሱ።"
    return "Your levels are good."

def get_chat_response(user_input: str, current_data: dict, lang: str):
    """Used for the interactive chatbot."""
    # Build a context-aware prompt
    context = f"User state: {current_data}. User asked: {user_input}. Respond in {lang}."
    
    # Placeholder for your actual LLM call (e.g., Gemini)
    # response = client.models.generate_content(model="gemini-2.0-flash", contents=context)
    return f"AI response based on your current heart rate of {current_data['heart_rate']}."