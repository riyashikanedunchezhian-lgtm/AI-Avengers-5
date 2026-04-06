"""
routers/chat.py — Main /chat endpoint.
Flow: Emergency check → RAG query → Save to Supabase → Return response.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.rag import query_rag
from core.alert import check_emergency, get_severity_level
from db.supabase import save_chat_message

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None       # None = anonymous user
    condition: Optional[str] = None     # set by symptom checker
    session_context: Optional[str] = "" # symptom checker answers as context
    language: Optional[str] = "en"


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    is_emergency: bool
    emergency_type: Optional[str]
    alert_message: Optional[str]
    severity: str


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # ── Step 1: Emergency pre-check (before even calling Gemini) ──────────────
    emergency = check_emergency(req.message)
    severity  = get_severity_level(req.message)

    # If emergency, still run RAG for guidance but flag it
    # ── Step 2: RAG query ─────────────────────────────────────────────────────
    # Merge session context (symptom checker answers) + current message
    full_query = req.message
    if req.session_context:
        full_query = f"{req.session_context}\n\nPatient question: {req.message}"

    rag_result = query_rag(full_query, condition=req.condition)

    # Emergency from RAG overrides if not already flagged
    if rag_result["is_emergency"]:
        emergency = check_emergency(req.message + " " + rag_result["answer"])
        severity  = "emergency"

    # ── Step 3: Save to Supabase (only for logged-in users) ───────────────────
    if req.user_id:
        save_chat_message(
            user_id=req.user_id,
            message=req.message,
            response=rag_result["answer"],
            condition=req.condition,
            sources=rag_result["sources"],
            is_emergency=emergency["is_emergency"],
            severity=severity,
        )

    return ChatResponse(
        answer=rag_result["answer"],
        sources=rag_result["sources"],
        is_emergency=emergency["is_emergency"],
        emergency_type=emergency.get("emergency_type"),
        alert_message=emergency.get("alert_message"),
        severity=severity,
    )
