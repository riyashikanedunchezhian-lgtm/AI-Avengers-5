"""
routers/history.py — Patient chat history and symptom log endpoints.
"""

from fastapi import APIRouter
from db.supabase import get_chat_history, get_symptom_logs

router = APIRouter()


@router.get("/chat/{user_id}")
async def chat_history(user_id: str, limit: int = 50):
    return {"history": get_chat_history(user_id, limit)}


@router.get("/symptoms/{user_id}")
async def symptom_history(user_id: str, limit: int = 20):
    return {"logs": get_symptom_logs(user_id, limit)}
