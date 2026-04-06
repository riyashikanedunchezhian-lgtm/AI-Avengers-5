"""
core/embeddings.py — Sentence-transformers embedding function for ChromaDB.
Runs entirely on CPU — no GPU needed.
"""

from langchain_community.embeddings import HuggingFaceEmbeddings

# all-MiniLM-L6-v2: small (80MB), fast on CPU, great for medical Q&A retrieval
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

_embedding_fn = None  # singleton — load once, reuse everywhere


def get_embedding_function() -> HuggingFaceEmbeddings:
    global _embedding_fn
    if _embedding_fn is None:
        print(f"🔧 Loading embedding model: {MODEL_NAME}")
        _embedding_fn = HuggingFaceEmbeddings(
            model_name=MODEL_NAME,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        print("✅ Embedding model loaded.")
    return _embedding_fn
