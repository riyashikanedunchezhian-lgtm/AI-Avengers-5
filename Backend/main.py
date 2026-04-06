"""
main.py — FastAPI entry point for Domain-Specific AI Patient Assistant
Team: AI Avengers | Medathon'26
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import chat, symptom, reminders, history, auth
from core.ingest import ingest_documents

load_dotenv()

app = FastAPI(
    title="AI Patient Assistant API",
    description="Domain-Specific AI Patient Assistant — Medathon'26",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173"), "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(chat.router,      prefix="/chat",      tags=["Chat"])
app.include_router(symptom.router,   prefix="/symptom",   tags=["Symptom"])
app.include_router(reminders.router, prefix="/reminders", tags=["Reminders"])
app.include_router(history.router,   prefix="/history",   tags=["History"])


# ── Startup: ingest medical PDFs into ChromaDB ────────────────────────────────
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting AI Patient Assistant...")
    ingest_documents()
    print("✅ Medical knowledge base ready.")


@app.get("/")
def root():
    return {
        "status": "online",
        "project": "Domain-Specific AI Patient Assistant",
        "team": "AI Avengers",
        "event": "Medathon'26",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ── Run locally ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
