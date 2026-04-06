"""
db/supabase.py — Supabase client for patient history, reminders, and auth.
Free tier: 500MB storage, unlimited API calls.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase: Client = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
        _supabase = create_client(url, key)
    return _supabase


# ── Chat History ──────────────────────────────────────────────────────────────

def save_chat_message(
    user_id: str,
    message: str,
    response: str,
    condition: str = None,
    sources: list = None,
    is_emergency: bool = False,
    severity: str = "low",
):
    """Save a chat exchange to Supabase."""
    db = get_supabase()
    db.table("chat_history").insert({
        "user_id":       user_id,
        "message":       message,
        "response":      response,
        "condition":     condition,
        "sources":       sources or [],
        "is_emergency":  is_emergency,
        "severity":      severity,
    }).execute()


def get_chat_history(user_id: str, limit: int = 50) -> list:
    """Fetch last N messages for a user."""
    db = get_supabase()
    result = (
        db.table("chat_history")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


# ── Reminders ─────────────────────────────────────────────────────────────────

def save_reminder(user_id: str, medicine: str, dose: str, frequency: str, times: list):
    db = get_supabase()
    db.table("reminders").insert({
        "user_id":   user_id,
        "medicine":  medicine,
        "dose":      dose,
        "frequency": frequency,
        "times":     times,
        "active":    True,
    }).execute()


def get_reminders(user_id: str) -> list:
    db = get_supabase()
    result = (
        db.table("reminders")
        .select("*")
        .eq("user_id", user_id)
        .eq("active", True)
        .execute()
    )
    return result.data or []


def delete_reminder(reminder_id: str, user_id: str):
    db = get_supabase()
    db.table("reminders").update({"active": False}).eq("id", reminder_id).eq("user_id", user_id).execute()


# ── Symptom Log ───────────────────────────────────────────────────────────────

def save_symptom_log(user_id: str, condition: str, answers: list, severity: str):
    db = get_supabase()
    db.table("symptom_logs").insert({
        "user_id":   user_id,
        "condition": condition,
        "answers":   answers,
        "severity":  severity,
    }).execute()


def get_symptom_logs(user_id: str, limit: int = 20) -> list:
    db = get_supabase()
    result = (
        db.table("symptom_logs")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []
