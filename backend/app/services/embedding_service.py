import os
import threading
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings

_embeddings_model = None
_lock = threading.Lock()


def get_embeddings_model():
    global _embeddings_model
    if _embeddings_model is None:
        with _lock:
            if _embeddings_model is None:
                import time

                start_time = int(time.time() * 1000)
                print(f"[PERF] Chatbot initialization started: {start_time}")
                print("[STARTUP] Loading Cloud HuggingFace Inference API...")

                hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("HF_TOKEN")

                # सर्व्हर रॅमचा वापर टाळण्यासाठी मोफत क्लाउड API द्वारे 384-dim वेक्टर्स मिळवणे
                _embeddings_model = HuggingFaceInferenceAPIEmbeddings(
                    api_key=hf_token,
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                )

                init_time = int(time.time() * 1000) - start_time
                print("[STARTUP] Cloud Embedding model ready.")
                print(
                    f"[PERF] Chatbot initialization completed: {int(time.time() * 1000)} (took {init_time}ms)"
                )
                print(f"[PERF] Embedding initialization: {init_time} ms")
    return _embeddings_model