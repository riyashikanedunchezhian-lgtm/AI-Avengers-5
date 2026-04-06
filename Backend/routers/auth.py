"""
routers/auth.py — Auth via Supabase (signup, login, logout).
Supabase handles all token management — we just proxy the calls.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.supabase import get_supabase

router = APIRouter()


class AuthRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
async def signup(req: AuthRequest):
    try:
        db = get_supabase()
        result = db.auth.sign_up({"email": req.email, "password": req.password})
        return {"user_id": result.user.id, "message": "Signup successful. Check your email to confirm."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(req: AuthRequest):
    try:
        db = get_supabase()
        result = db.auth.sign_in_with_password({"email": req.email, "password": req.password})
        return {
            "user_id":      result.user.id,
            "access_token": result.session.access_token,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials.")


@router.post("/logout")
async def logout():
    db = get_supabase()
    db.auth.sign_out()
    return {"message": "Logged out successfully."}
