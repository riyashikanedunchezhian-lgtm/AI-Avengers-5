"""
core/symptom_checker.py — Guided 3–5 question symptom triage flow.
Detects patient condition and routes to the right knowledge context.
"""

# ── Condition detection keywords ──────────────────────────────────────────────
CONDITION_KEYWORDS = {
    "diabetes_type1": [
        "type 1", "t1d", "type1", "juvenile diabetes", "insulin dependent",
        "childhood diabetes", "autoimmune diabetes",
    ],
    "diabetes_type2": [
        "type 2", "t2d", "type2", "adult onset", "metformin", "oral medication",
        "diet controlled", "prediabetes", "pre-diabetes",
    ],
    "diabetes_gestational": [
        "gestational", "pregnancy diabetes", "pregnant", "gdm",
    ],
    "hypoglycaemia": [
        "low blood sugar", "low glucose", "hypoglycemia", "hypoglycaemia",
        "shaking", "sweating", "bg below 70", "blood sugar low",
    ],
    "hyperglycaemia": [
        "high blood sugar", "high glucose", "hyperglycemia", "hyperglycaemia",
        "bg above 180", "blood sugar high",
    ],
    "dka": [
        "dka", "ketoacidosis", "ketones", "fruity breath", "kussmaul",
    ],
    "shoulder_injury": [
        "shoulder", "rotator cuff", "shoulder pain", "shoulder injury",
        "shoulder dislocation", "shoulder strain",
    ],
    "general": [],  # fallback
}

# ── Symptom checker question trees per condition ──────────────────────────────
QUESTION_TREES = {
    "diabetes": [
        {
            "id": "q1",
            "question": "What type of diabetes have you been diagnosed with?",
            "options": ["Type 1", "Type 2", "Gestational", "Not yet diagnosed / Not sure"],
        },
        {
            "id": "q2",
            "question": "How long have you been living with diabetes?",
            "options": ["Less than 1 year", "1–5 years", "More than 5 years", "Just diagnosed"],
        },
        {
            "id": "q3",
            "question": "What is your current blood glucose level (if you have a reading)?",
            "options": [
                "Below 70 mg/dL (very low)",
                "70–130 mg/dL (normal range)",
                "131–180 mg/dL (slightly high)",
                "Above 180 mg/dL (high)",
                "I don't have a reading right now",
            ],
        },
        {
            "id": "q4",
            "question": "Are you currently experiencing any of these symptoms?",
            "options": [
                "Excessive thirst or frequent urination",
                "Shaking, sweating, confusion (low sugar symptoms)",
                "Fruity breath, nausea, vomiting (possible DKA)",
                "Fatigue, blurred vision",
                "None of the above",
            ],
            "multi_select": True,
        },
        {
            "id": "q5",
            "question": "What medications or insulin are you currently taking?",
            "options": [
                "Insulin (basal only)",
                "Insulin (basal + bolus)",
                "Oral medications (e.g. Metformin)",
                "Both insulin and oral medications",
                "None / diet controlled",
                "I'm not sure",
            ],
        },
    ],
    "general": [
        {
            "id": "q1",
            "question": "What is the main health concern you need help with today?",
            "options": [
                "Diabetes management",
                "Blood sugar levels",
                "Diet and nutrition",
                "Medications and dosage guidance",
                "Symptoms I'm experiencing",
                "General health question",
            ],
        },
        {
            "id": "q2",
            "question": "How severe are your current symptoms?",
            "options": [
                "Mild — manageable at home",
                "Moderate — concerning but not urgent",
                "Severe — I may need medical attention",
                "I have no symptoms, just a question",
            ],
        },
        {
            "id": "q3",
            "question": "Do you have any existing diagnosed medical conditions?",
            "options": [
                "Type 1 Diabetes",
                "Type 2 Diabetes",
                "Gestational Diabetes",
                "Heart disease",
                "Kidney disease",
                "None",
                "Prefer not to say",
            ],
            "multi_select": True,
        },
    ],
}


def detect_condition(text: str) -> str:
    """
    Scans patient's initial message for condition keywords.
    Returns the most likely condition string.
    """
    text_lower = text.lower()
    scores = {condition: 0 for condition in CONDITION_KEYWORDS}

    for condition, keywords in CONDITION_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[condition] += 1

    # If diabetes-related, group under 'diabetes'
    diabetes_score = (
        scores.get("diabetes_type1", 0)
        + scores.get("diabetes_type2", 0)
        + scores.get("diabetes_gestational", 0)
        + scores.get("hypoglycaemia", 0)
        + scores.get("hyperglycaemia", 0)
        + scores.get("dka", 0)
    )
    if diabetes_score > 0:
        return "diabetes"

    best = max(scores, key=lambda c: scores[c])
    return best if scores[best] > 0 else "general"


def get_questions_for_condition(condition: str) -> list:
    """Returns the question tree for the detected condition."""
    return QUESTION_TREES.get(condition, QUESTION_TREES["general"])


def build_context_from_answers(answers: list) -> str:
    """
    Converts symptom checker answers into a rich context string
    that gets prepended to every RAG query for this session.
    """
    if not answers:
        return ""

    lines = ["Patient symptom profile:"]
    for item in answers:
        lines.append(f"  - {item['question']}: {item['answer']}")

    # Auto-detect emergency from answers
    answer_text = " ".join(str(a.get("answer", "")) for a in answers)
    if "below 70" in answer_text.lower() or "fruity breath" in answer_text.lower():
        lines.append("  ⚠️  Possible emergency indicators detected in answers.")

    return "\n".join(lines)
