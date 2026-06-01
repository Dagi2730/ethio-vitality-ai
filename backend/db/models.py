from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="user", nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    department: Mapped[str] = mapped_column(String(128), default="General", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    privacy: Mapped["PrivacySettings"] = relationship(back_populates="user", uselist=False)
    vitals: Mapped[list["VitalReading"]] = relationship(back_populates="user")
    moods: Mapped[list["MoodEntry"]] = relationship(back_populates="user")
    journals: Mapped[list["JournalEntry"]] = relationship(back_populates="user")
    habits: Mapped["HabitsProfile"] = relationship(back_populates="user", uselist=False)
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")
    activity_logs: Mapped[list["ActivityLog"]] = relationship(back_populates="user")


class PrivacySettings(Base):
    __tablename__ = "privacy_settings"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    share_with_hr: Mapped[bool] = mapped_column(Boolean, default=True)
    share_with_doctor: Mapped[bool] = mapped_column(Boolean, default=True)
    share_vitals: Mapped[bool] = mapped_column(Boolean, default=True)
    share_mood: Mapped[bool] = mapped_column(Boolean, default=True)
    share_journal_summary: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="privacy")


class VitalReading(Base):
    __tablename__ = "vital_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    heart_rate: Mapped[int] = mapped_column(Integer)
    stress_level: Mapped[int] = mapped_column(Integer)
    simulated_mood: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    sleep_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="simulation")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="vitals")


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    sentiment: Mapped[str] = mapped_column(String(32))
    emoji: Mapped[str] = mapped_column(String(16))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="moods")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(16), default="text")
    extracted_emotion: Mapped[str] = mapped_column(String(32), default="neutral")
    intensity: Mapped[float] = mapped_column(Float, default=0.5)
    themes: Mapped[str] = mapped_column(Text, default="[]")
    summary_one_line: Mapped[str] = mapped_column(String(512), default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="journals")


class HabitsProfile(Base):
    __tablename__ = "habits_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    sleep_hours_avg: Mapped[float] = mapped_column(Float, default=6.2)
    steps_avg: Mapped[int] = mapped_column(Integer, default=5200)
    screen_time_hours: Mapped[float] = mapped_column(Float, default=7.5)
    caffeine_cups: Mapped[int] = mapped_column(Integer, default=3)
    outdoor_minutes: Mapped[int] = mapped_column(Integer, default=25)

    user: Mapped["User"] = relationship(back_populates="habits")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(64))
    resource: Mapped[str] = mapped_column(String(128), default="")
    detail: Mapped[str] = mapped_column(Text, default="")
    ip_address: Mapped[str] = mapped_column(String(64), default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="activity_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(128))
    message: Mapped[str] = mapped_column(Text)
    ntype: Mapped[str] = mapped_column(String(32), default="reminder")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="notifications")
