from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator


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


class JournalUpdateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)


class HabitsUpdate(BaseModel):
    sleep_hours_avg: Optional[float] = None
    steps_avg: Optional[int] = None
    screen_time_hours: Optional[float] = None
    caffeine_cups: Optional[int] = None
    outdoor_minutes: Optional[int] = None


class PrivacyUpdate(BaseModel):
    share_with_hr: Optional[bool] = None
    share_with_doctor: Optional[bool] = None
    share_vitals: Optional[bool] = None
    share_mood: Optional[bool] = None
    share_journal_summary: Optional[bool] = None


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


class VitalIngestRequest(BaseModel):
    heart_rate: int = Field(..., ge=40, le=200)
    stress_level: int = Field(..., ge=0, le=100)
    spo2: float = Field(default=98.0, ge=70.0, le=100.0)
    source: str = Field(default="proteus", max_length=32)
    sleep_hours: Optional[float] = None


class CommunityPostBody(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    category: str = Field(default="general", max_length=32)
    anonymous: bool = False


class CommunityReplyBody(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    anonymous: bool = False


class MoodResponse(BaseModel):
    status: str = "saved"
    mood: dict[str, Any]
    latest_vitals: dict[str, Any]
    insight: str
    triggers: list[dict[str, Any]] = []


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)


class SignupRequest(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=128)
    department: str = Field(default="General", max_length=128)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class UserProfile(BaseModel):
    email: str
    role: str
    name: str
    department: Optional[str] = None
    user_id: Optional[int] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
