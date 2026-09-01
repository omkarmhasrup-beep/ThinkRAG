import os
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from ..core.config import settings
from ..models import File
from ..database.database import SessionLocal
from .document_service import extract_text_from_file
from .llm_service import generate_llm_response
from ..vectorstore import get_vector_store


def _get_basic_conversation_response(question: str):
    """
    Handle basic greetings and conversational messages without
    performing RAG/vector search.

    Returns:
        str | None
        A response for recognized basic messages, otherwise None.
    """
    q = question.strip().lower()

    # Remove common punctuation for easier matching
    normalized = q.strip(" \t\n\r!?.,;:")

    responses = {
        "hi": "Hi! How can I help you?",
        "hii": "Hi! How can I help you?",
        "hiii": "Hi! How can I help you?",
        "hello": "Hello! How can I help you?",
        "hey": "Hey! How can I help you?",
        "good morning": "Good morning! How can I help you?",
        "good afternoon": "Good afternoon! How can I help you?",
        "good evening": "Good evening! How can I help you?",
        "thanks": "You're welcome!",
        "thank you": "You're welcome!",
        "thank you so much": "You're welcome!",
        "thx": "You're welcome!",
        "bye": "Goodbye! Have a great day!",
        "goodbye": "Goodbye! Have a great day!",
    }

    # Exact matches
    if normalized in responses:
        return responses[normalized]

    # Common conversational phrases
    conversational_responses = {
        "how are you": "I'm doing well! How can I help you?",
        "how are you doing": "I'm doing well! How can I help you?",
        "what's up": "I'm here and ready to help! What would you like to know?",
        "whats up": "I'm here and ready to help! What would you like to know?",
    }

    if normalized in conversational_responses:
        return conversational_responses[normalized]

    return None


def generate_rag_response(user_id: int, question: str, db=None, t_req=None, image=None):
    import time

    # ============================================================
    # BASIC GREETING / CONVERSATION HANDLING
    # ============================================================
    # These messages do not require Knowledge Base retrieval.
    # This keeps greetings fast and prevents unnecessary vector search.
    basic_response = _get_basic_conversation_response(question)

    if basic_response is not None:
        logger.info(
            f"[RAG] Basic conversation detected. "
            f"Skipping vector search for: {question!r}"
        )

        yield basic_response
        return

    # ============================================================
    # NORMAL RAG PIPELINE
    # ============================================================

    t_context_start = time.perf_counter()

    logger.info(
        f"[PERF DIAGNOSTICS] [PERF 8] "
        f"Retrieved documents count / Context building START at "
        f"{t_context_start}"
    )

    context_text = ""
    sources_used = []

    vector_store = get_vector_store()

    results = vector_store.search(
        user_id,
        question,
        k=4,
        db=db
    )

    t_prompt_start = time.perf_counter()

    logger.info(
        f"[PERF DIAGNOSTICS] [PERF 10] "
        f"Prompt construction START at {t_prompt_start}"
    )

    if results:
        for i, res in enumerate(results):
            source = res["source"]
            sim_pct = res["score"]
            content = res["content"]

            sources_used.append({
                "chunk_id": i + 1,
                "source": source,
                "content": content,
                "score": sim_pct
            })

            # Cap each chunk to keep the total payload
            # well within model limits.
            context_text += (
                f"\n--- Excerpt {i+1} from {source} ---\n"
                f"{content[:800]}\n"
            )

    # ============================================================
    # FALLBACK TO FILE READING
    # ============================================================

    if not context_text.strip():
        local_db = db if db else SessionLocal()

        try:
            files = (
                local_db.query(File)
                .filter(File.user_id == user_id)
                .all()
            )

            for i, file in enumerate(files[:1]):
                content = extract_text_from_file(
                    file.filepath,
                    file.filetype
                )

                if content:
                    sources_used.append({
                        "chunk_id": i + 1,
                        "source": file.filename,
                        "content": content[:400],
                        "score": 100
                    })

                    context_text += (
                        f"\n--- Start of {file.filename} ---\n"
                        f"{content[:800]}\n"
                    )

        finally:
            if not db:
                local_db.close()

    # ============================================================
    # CONTEXT SIZE LIMIT
    # ============================================================

    if len(context_text) > 3000:
        context_text = (
            context_text[:3000]
            + "\n[... context truncated ...]"
        )

    # ============================================================
    # BASE SYSTEM PROMPT
    # ============================================================

    base_prompt = (
        "You are a precise, helpful AI assistant that answers "
        "questions based on provided documents. "
        "IMPORTANT RULES:\n"
        "1. Answer ONLY using the provided context. "
        "Do NOT use any prior knowledge.\n"
        "2. NEVER show your reasoning, thinking steps, analysis, "
        "chain-of-thought, or any intermediate processing. "
        "Output ONLY the final answer.\n"
        "3. Match the language of the user's question "
        "(English or Marathi).\n"
    )

    # ============================================================
    # SYSTEM PROMPT WITH / WITHOUT CONTEXT
    # ============================================================

    if context_text.strip():

        system_prompt = base_prompt + (
            "TASK: Answer the user's question strictly based "
            "on the context below.\n"

            "If the answer is not present in the context, "
            "respond by saying that you don't have enough "
            "information in the provided knowledge base to "
            "answer that. "

            "CRITICAL: You MUST translate this fallback response "
            "into the SAME LANGUAGE as the user's question "
            "(e.g. if the user asks in Marathi, reply in Marathi).\n\n"

            "Context:\n"
            + context_text
        )

    else:

        system_prompt = base_prompt + (
            "TASK: No documents were found. "

            "Respond by saying that you don't have enough "
            "information in the provided knowledge base to "
            "answer that. "

            "CRITICAL: You MUST translate this fallback response "
            "into the SAME LANGUAGE as the user's question "
            "(e.g. if the user asks in Marathi, reply in Marathi)."
        )

    t_prompt_end = time.perf_counter()

    logger.info(
        f"[PERF DIAGNOSTICS] [PERF 10] "
        f"Prompt construction END at {t_prompt_end}"
    )

    # ============================================================
    # LLM REQUEST
    # ============================================================

    llm_start = time.perf_counter()

    logger.info(
        f"[PERF DIAGNOSTICS] [PERF 11] "
        f"Groq request START at {llm_start}"
    )

    first_token_received = False
    first_token_time = None

    for chunk in generate_llm_response(
        system_prompt,
        question,
        image=image
    ):

        if not first_token_received:
            first_token_time = time.perf_counter()

            logger.info(
                f"[PERF DIAGNOSTICS] [PERF 12] "
                f"Groq TTFT / first token at {first_token_time}"
            )

            first_token_received = True

        yield chunk

    # ============================================================
    # LLM COMPLETE
    # ============================================================

    llm_end = time.perf_counter()

    logger.info(
        f"[PERF DIAGNOSTICS] [PERF 13] "
        f"Groq streaming complete at {llm_end}"
    )

    logger.info(
        f"[PERF DIAGNOSTICS] [PERF 14] "
        f"Backend response sent "
        f"(handled by FastAPI streaming) at {llm_end}"
    )

    # ============================================================
    # PERFORMANCE DIAGNOSTICS
    # ============================================================

    if t_req:

        total_time = llm_end - t_req

        logger.info(
            f"[PERF DIAGNOSTICS] [PERF 15] "
            f"Total backend time inside generator: "
            f"{total_time:.4f} s"
        )

        try:

            perf_data = {
                "t_req": t_req,
                "t_context_start": t_context_start,
                "t_prompt_start": t_prompt_start,
                "t_prompt_end": t_prompt_end,
                "llm_start": llm_start,
                "first_token_time": (
                    first_token_time
                    if first_token_received
                    else None
                ),
                "llm_end": llm_end,
                "total_time": total_time
            }

            with open(
                "perf_diagnostics.json",
                "w"
            ) as f:
                json.dump(
                    perf_data,
                    f
                )

        except Exception:
            pass

    # ============================================================
    # SOURCES
    # ============================================================

    if sources_used:

        sources_md = (
            "\n\n```rag-context\n"
            + json.dumps(sources_used)
            + "\n```\n"
        )

        yield sources_md


def get_rag_stats(user_id: int):

    vector_store = get_vector_store()

    stats = vector_store.get_stats(user_id)

    db = SessionLocal()

    try:

        files = (
            db.query(File)
            .filter(File.user_id == user_id)
            .all()
        )

        for file in files:

            if os.path.exists(file.filepath):

                # We do not want to double count storage here,
                # assuming stats already accounted for vector size.
                pass

                # Update last_updated if no vector index exists.
                if not stats["last_updated"]:

                    import datetime

                    mtime = os.path.getmtime(
                        file.filepath
                    )

                    stats["last_updated"] = (
                        datetime.datetime
                        .fromtimestamp(mtime)
                        .isoformat()
                    )

    finally:
        db.close()

    return stats


def search_knowledge_base(
    user_id: int,
    query: str,
    k: int = 20
):
    vector_store = get_vector_store()

    return vector_store.search(
        user_id,
        query,
        k=k
    )