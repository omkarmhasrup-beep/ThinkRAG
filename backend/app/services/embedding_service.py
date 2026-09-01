import threading

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
                print("[STARTUP] Loading embedding model...")
                from langchain_community.embeddings import HuggingFaceEmbeddings
                _embeddings_model = HuggingFaceEmbeddings(
                    model_name="all-MiniLM-L6-v2",
                    model_kwargs={"local_files_only": True}
                )
                init_time = int(time.time() * 1000) - start_time
                print("[STARTUP] Embedding model loaded.")
                print(f"[PERF] Chatbot initialization completed: {int(time.time() * 1000)} (took {init_time}ms)")
                print(f"[PERF] Embedding initialization: {init_time} ms")
    return _embeddings_model
