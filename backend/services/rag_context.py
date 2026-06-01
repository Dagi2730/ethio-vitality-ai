"""
Ethiopian health & wellness RAG knowledge (static corpus for Gemini injection).
Replace with vector DB + embeddings in production.
"""

ETHIOPIAN_WELLNESS_CORPUS = """
## Nutrition & diet
- Teff injera provides sustained energy; pair with legumes (shiro) for balanced meals.
- Moderate berbere; hydration matters at Addis altitude (~2,400m).
- Coffee ceremony: cultural ritual — limit late-afternoon caffeine for sleep hygiene.

## Traditional wellness
- Herbal teas: tenadam (rue), ginger, fenugreek — gentle stress support, not medical treatment.
- Light movement after desk work; Entoto/Bole walks support circulation and mood.

## Lifestyle (Addis Ababa)
- High-pressure work culture; commute peaks 7–9 AM and 5–7 PM elevate cortisol patterns.
- Community and family support are protective factors in Ethiopian mental health norms.
- Respect fasting seasons (Tsom); adjust energy and meal timing compassionately.

## Clinical boundary
Always encourage professional care for persistent depression, panic attacks, or self-harm thoughts.
"""


def get_rag_context(query_hint: str = "") -> str:
    return ETHIOPIAN_WELLNESS_CORPUS
