"""
routers/reminders.py — Medicine reminder CRUD endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.supabase import save_reminder, get_reminders, delete_reminder

router = APIRouter()


class ReminderCreate(BaseModel):
    user_id: str
    medicine: str
    dose: str
    frequency: str          # e.g. "twice daily"
    times: list[str]        # e.g. ["08:00", "20:00"]


@router.post("/")
async def create_reminder(req: ReminderCreate):
    save_reminder(req.user_id, req.medicine, req.dose, req.frequency, req.times)
    return {"status": "created"}


@router.get("/{user_id}")
async def list_reminders(user_id: str):
    return {"reminders": get_reminders(user_id)}


@router.delete("/{reminder_id}")
async def remove_reminder(reminder_id: str, user_id: str):
    delete_reminder(reminder_id, user_id)
    return {"status": "deleted"}
