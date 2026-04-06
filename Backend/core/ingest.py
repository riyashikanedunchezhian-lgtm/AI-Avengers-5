"""
core/ingest.py — Loads medical PDFs into FAISS vector store at startup.
Skips corrupted or invalid PDF files automatically.
"""

import os
import glob
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from core.embeddings import get_embedding_function

FAISS_PATH = os.getenv("CHROMA_DB_PATH", "./faiss_store")
DATA_DIR   = os.getenv("DATA_DIR", "../data/pdfs")

SOURCE_METADATA = {
    "who":    "WHO Global Report on Diabetes, 2016",
    "ada":    "ADA Standards of Medical Care in Diabetes, 2024",
    "idf":    "IDF Diabetes Atlas, 10th Edition, 2021",
    "cdc":    "CDC Diabetes Statistics Report, 2023",
    "pubmed": "PubMed Peer-Reviewed Abstracts",
    "niddk":  "NIDDK Diabetes Guide",
    "nice":   "NICE Diabetes Guidelines",
    "nhs":    "NHS Diabetes Patient Guide",
}


def is_valid_pdf(path):
    """Check if file is a real PDF by reading its header."""
    try:
        with open(path, 'rb') as f:
            header = f.read(5)
            return header == b'%PDF-'
    except Exception:
        return False


def ingest_documents():
    embedding_fn = get_embedding_function()

    if os.path.exists(FAISS_PATH) and os.listdir(FAISS_PATH):
        print("📚 FAISS store already populated — skipping ingestion.")
        return

    pdf_files = glob.glob(os.path.join(DATA_DIR, "*.pdf"))
    if not pdf_files:
        print(f"⚠️  No PDFs found in {DATA_DIR}. Add medical PDFs and restart.")
        return

    print(f"📄 Ingesting {len(pdf_files)} medical document(s)...")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n\n", "\n", ".", " "],
    )

    all_chunks = []
    skipped    = []

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path).lower()

        # Skip corrupted or fake PDFs
        if not is_valid_pdf(pdf_path):
            print(f"  ⚠️  Skipping invalid PDF: {filename}")
            skipped.append(filename)
            continue

        source_label = next(
            (label for key, label in SOURCE_METADATA.items() if key in filename),
            filename,
        )

        try:
            loader = PyPDFLoader(pdf_path)
            pages  = loader.load()

            if not pages:
                print(f"  ⚠️  Empty PDF skipped: {filename}")
                skipped.append(filename)
                continue

            chunks = splitter.split_documents(pages)
            for chunk in chunks:
                chunk.metadata["source"] = source_label
                chunk.metadata["file"]   = filename

            all_chunks.extend(chunks)
            print(f"  ✔ {filename}: {len(chunks)} chunks")

        except Exception as e:
            print(f"  ❌ Error reading {filename}: {e} — skipping")
            skipped.append(filename)
            continue

    if not all_chunks:
        print("⚠️  No valid content found in any PDF. Server will run without knowledge base.")
        return

    os.makedirs(FAISS_PATH, exist_ok=True)
    vectorstore = FAISS.from_documents(all_chunks, embedding_fn)
    vectorstore.save_local(FAISS_PATH)

    print(f"✅ Ingested {len(all_chunks)} chunks from {len(pdf_files) - len(skipped)} PDFs.")
    if skipped:
        print(f"⚠️  Skipped {len(skipped)} invalid files: {', '.join(skipped)}")