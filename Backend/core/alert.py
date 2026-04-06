"""
core/alert.py — Detects high-risk symptom patterns before even calling Gemini.
Triggers immediate red-alert for life-threatening conditions.
"""

import re

# ── High-risk keyword patterns ────────────────────────────────────────────────
EMERGENCY_PATTERNS = [
    # Diabetic Ketoacidosis (DKA)
    r"fruity breath",
    r"kussmaul",
    r"dka",
    r"diabetic ketoacidosis",
    r"ketones? (are )?(very )?high",
    r"vomiting.{0,30}(cannot|can.t|unable)",
    r"(cannot|can.t|unable).{0,20}keep (food|water|liquid) down",

    # Hypoglycaemia
    r"blood (sugar|glucose).{0,20}(below|under|less than).{0,10}(70|60|50|40)",
    r"bg.{0,10}(below|under|less than).{0,10}(70|60|50|40)",
    r"(very|extreme|severe).{0,15}(shak|trembl|dizzy)",
    r"(lost|losing|losing).{0,10}conscious",
    r"(cannot|can.t|unable).{0,10}(stand|walk|speak)",
    r"pass(ed)? out",
    r"seizure",
    r"unconscious",
    r"hypoglycemi",

    # General life-threatening
    r"chest (pain|pressure|tightness)",
    r"(cannot|can.t|trouble|difficulty).{0,15}breath",
    r"shortness of breath",
    r"heart (attack|racing|pounding)",
    r"stroke",
    r"(not|cannot|can.t).{0,10}(move|feel).{0,20}(arm|leg|face)",
    r"(face|arm|leg).{0,20}(drooping|numb|weak)",
    r"sudden (severe|worst).{0,10}headache",
    r"(very|extremely).{0,10}(pale|cold|clammy)",
]

EMERGENCY_COMPILED = [re.compile(p, re.IGNORECASE) for p in EMERGENCY_PATTERNS]

# Specific DKA symptoms
DKA_PATTERNS = [r"fruity", r"kussmaul", r"dka", r"ketoacidosis", r"ketone"]
DKA_COMPILED = [re.compile(p, re.IGNORECASE) for p in DKA_PATTERNS]

# Hypoglycaemia symptoms
HYPO_PATTERNS = [r"hypo", r"low blood sugar", r"low glucose", r"shak", r"trembl", r"bg.*7[0-9]|bg.*6\d|bg.*[0-5]\d"]
HYPO_COMPILED = [re.compile(p, re.IGNORECASE) for p in HYPO_PATTERNS]


def check_emergency(text: str) -> dict:
    """
    Scans patient message for emergency patterns.
    Returns: { is_emergency, emergency_type, alert_message }
    """
    text_lower = text.lower()

    is_emergency = any(p.search(text_lower) for p in EMERGENCY_COMPILED)
    is_dka       = any(p.search(text_lower) for p in DKA_COMPILED)
    is_hypo      = any(p.search(text_lower) for p in HYPO_COMPILED)

    if not is_emergency:
        return {"is_emergency": False, "emergency_type": None, "alert_message": None}

    if is_dka:
        emergency_type = "DKA"
        alert_message  = (
            "🚨 EMERGENCY — Possible Diabetic Ketoacidosis (DKA) detected.\n"
            "Symptoms like fruity breath, nausea, and high ketones require IMMEDIATE medical attention.\n"
            "Call emergency services (108 / 112) or go to your nearest emergency room NOW."
        )
    elif is_hypo:
        emergency_type = "HYPOGLYCAEMIA"
        alert_message  = (
            "🚨 EMERGENCY — Possible Severe Hypoglycaemia detected.\n"
            "If conscious: consume 15g fast-acting carbs immediately (glucose tablets, juice, or sugar).\n"
            "If unconscious or unable to swallow: Call emergency services (108 / 112) immediately."
        )
    else:
        emergency_type = "GENERAL"
        alert_message  = (
            "🚨 EMERGENCY — Your symptoms may be life-threatening.\n"
            "Please call emergency services (108 / 112) or go to your nearest emergency room immediately.\n"
            "Do not wait — seek medical help NOW."
        )

    return {
        "is_emergency": True,
        "emergency_type": emergency_type,
        "alert_message": alert_message,
    }


def get_severity_level(text: str) -> str:
    """
    Returns severity: 'emergency' | 'high' | 'medium' | 'low'
    Used to colour-code responses in the frontend.
    """
    emergency = check_emergency(text)
    if emergency["is_emergency"]:
        return "emergency"

    high_risk = [
        r"chest", r"breath", r"unconscious", r"seizure",
        r"severe pain", r"vomiting", r"high fever",
    ]
    if any(re.search(p, text, re.IGNORECASE) for p in high_risk):
        return "high"

    medium_risk = [
        r"pain", r"swelling", r"dizzy", r"fever", r"infection",
        r"wound", r"bleed", r"numb",
    ]
    if any(re.search(p, text, re.IGNORECASE) for p in medium_risk):
        return "medium"

    return "low"
