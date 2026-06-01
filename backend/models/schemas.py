from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    input: str = Field(..., min_length=1, max_length=4000)
    lang: Literal["en", "am"] = "en"
    auto_detect_lang: bool = True
    messages: list[ChatMessage] = Field(default_factory=list, max_length=30)


class MoodRequest(BaseModel):
    sentiment: Literal["great", "okay", "low", "sad", "anxious", "overwhelmed"]
    emoji: str = Field(..., min_length=1, max_length=8)


class JournalRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)
    source: Literal["text", "voice"] = "text"


class HabitsUpdate(BaseModel):
    sleep_hours_avg: Optional[float] = None
    steps_avg: Optional[int] = None
    screen_time_hours: Optional[float] = None
    caffeine_cups: Optional[int] = None
    outdoor_minutes: Optional[int] = None


class CrisisInfo(BaseModel):
    active: bool
    severity: str


class ChatResponse(BaseModel):
    reply: str
    lang: str
    detected_lang: str
    recommended_action: str
    crisis: CrisisInfo
    crisis_support: Optional[dict[str, Any]] = None
    anomaly_prompt: Optional[str] = None


class MoodResponse(BaseModel):
    mood: dict[str, Any]
    latest_vitals: dict[str, Any]
    insight: str
    triggers: list[dict[str, Any]] = []


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)


class UserProfile(BaseModel):
    email: str
    role: str
    name: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
