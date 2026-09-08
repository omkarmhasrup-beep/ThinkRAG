import os
import threading
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

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
                print(
                    "[STARTUP] Loading FastEmbed (local lightweight ONNX CPU)..."
                )

                # जुन्या डेटाबेसशी मॅच होण्यासाठी 384-डायमेन्शनचे ऑल-मिनीएलएम मॉडेल
                _embeddings_model = FastEmbedEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2"
                )

                init_time = int(time.time() * 1000) - start_time
                print("[STARTUP] FastEmbed model loaded successfully.")
                print(
                    f"[PERF] Chatbot initialization completed: {int(time.time() * 1000)} (took {init_time}ms)"
                )
    return _embeddings_model