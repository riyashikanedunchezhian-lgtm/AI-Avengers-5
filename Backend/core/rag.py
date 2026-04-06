"""
core/rag.py — RAG pipeline using FAISS + Groq (llama3-70b, free tier).
"""

import os
from groq import Groq
from langchain_community.vectorstores import FAISS
from core.embeddings import get_embedding_function

FAISS_PATH = os.getenv("CHROMA_DB_PATH", "./faiss_store")
GROQ_KEY   = os.getenv("GROQ_API_KEY")
TOP_K      = 4

SYSTEM_PROMPT = """You are a Domain-Specific AI Patient Assistant built by Team AI Avengers for Medathon'26.
You provide accurate, compassionate, easy-to-understand medical information.

STRICT RULES:
1. Answer ONLY using the provided context from trusted medical sources (WHO, ADA, IDF, CDC, PubMed).
2. If the context does not contain enough information, say:
   "I don't have enough information in my medical knowledge base for this. Please consult a doctor."
3. Always cite your source at the end, e.g., (Source: ADA Standards of Care, 2024).
4. Keep answers simple — no complex medical jargon unless explained.
5. If you detect ANY life-threatening symptoms (DKA, hypoglycaemia below 70 mg/dL,
   chest pain, difficulty breathing), add this line at the end:
   "🚨 EMERGENCY: Please seek immediate medical attention or call emergency services."
6. Never recommend specific drug dosages — advise consulting a doctor.
7. Respond in the same language the patient used to ask the question."""

_vectorstore = None


def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        if not os.path.exists(FAISS_PATH):
            raise RuntimeError("FAISS store not found. Add PDFs to data/pdfs/ and restart.")
        _vectorstore = FAISS.load_local(
            FAISS_PATH,
            get_embedding_function(),
            allow_dangerous_deserialization=True,
        )
    return _vectorstore


def query_rag(question: str, condition: str = None) -> dict:
    """
    Main RAG query function.
    Returns: { answer, sources, is_emergency }
    """
    client = Groq(api_key=GROQ_KEY)

    full_query = question
    if condition:
        full_query = f"[Patient condition: {condition}]\n{question}"

    # Retrieve from FAISS
    try:
        vs   = get_vectorstore()
        docs = vs.similarity_search(full_query, k=TOP_K)
        context = "\n\n---\n\n".join([
            f"Source: {doc.metadata.get('source', 'Medical Knowledge Base')}\n{doc.page_content}"
            for doc in docs
        ])
        sources = list({
            doc.metadata.get("source", "Medical Knowledge Base")
            for doc in docs
        })
    except Exception:
        context = "No specific medical documents available. Answer using general medical knowledge and always recommend consulting a doctor."
        sources = ["General medical knowledge"]

    prompt = f"""{SYSTEM_PROMPT}

CONTEXT FROM TRUSTED MEDICAL SOURCES:
{context}

PATIENT QUESTION:
{full_query}

YOUR ANSWER:"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {full_query}"}
        ],
        temperature=0.3,
        max_tokens=1000,
    )

    answer       = response.choices[0].message.content
    is_emergency = "🚨 EMERGENCY" in answer

    return {
        "answer":       answer,
        "sources":      sources,
        "is_emergency": is_emergency,
    }