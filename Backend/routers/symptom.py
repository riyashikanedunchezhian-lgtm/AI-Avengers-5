"""
routers/symptom.py — Symptom checker endpoints.
Returns guided questions and processes answers to build patient context.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from core.symptom_checker import (
    detect_condition,
    get_questions_for_condition,
    build_context_from_answers,
)
from core.alert import check_emergency
from db.supabase import save_symptom_log

router = APIRouter()


class DetectRequest(BaseModel):
    initial_message: str


class DetectResponse(BaseModel):
    condition: str
    questions: list


class AnswersRequest(BaseModel):
    condition: str
    answers: list           # [{ question, answer }]
    user_id: Optional[str] = None


class AnswersResponse(BaseModel):
    session_context: str    # prepended to all future chat queries
    is_emergency: bool
    alert_message: Optional[str]
    severity: str


@router.post("/detect", response_model=DetectResponse)
async def detect_condition_endpoint(req: DetectRequest):
    """Step 1: Detect condition from patient's first message, return questions."""
    condition = detect_condition(req.initial_message)
    questions = get_questions_for_condition(condition)

    # Check for immediate emergency in opening message
    emergency = check_emergency(req.initial_message)
    if emergency["is_emergency"]:
        # Return empty questions — emergency takes priority
        return DetectResponse(condition="emergency", questions=[])

    return DetectResponse(condition=condition, questions=questions)


@router.post("/submit", response_model=AnswersResponse)
async def submit_answers(req: AnswersRequest):
    """Step 2: Process symptom checker answers, build session context."""
    context  = build_context_from_answers(req.answers)
    answers_text = " ".join(str(a.get("answer", "")) for a in req.answers)
    emergency    = check_emergency(answers_text)

    severity = "emergency" if emergency["is_emergency"] else "low"

    # Save symptom log for logged-in users
    if req.user_id:
        save_symptom_log(
            user_id=req.user_id,
            condition=req.condition,
            answers=req.answers,
            severity=severity,
        )

    return AnswersResponse(
        session_context=context,
        is_emergency=emergency["is_emergency"],
        alert_message=emergency.get("alert_message"),
        severity=severity,
    )
