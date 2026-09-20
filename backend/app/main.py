import time
import threading
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import engine
from . import models
from .api import (
    conversations,
    chat,
    documents,
    users,
    settings as settings_api,
    auth,
    bookmarks,
    memories,
)
from .core.config import settings


def setup_db():
    try:
        if "sqlite" not in str(engine.url):
            with engine.connect() as conn:
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                    conn.commit()
                except Exception as e:
                    print(f"Warning: Could not create vector extension: {e}")
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database setup failed: {e}")


setup_db()

app = FastAPI(title="AI Chatbot API")

# CORS Allowed Origins
origins = [
    "https://think-rag.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000",
]

# CORS Middleware (सर्व Vercel सबडोमेन्स आणि लोकलहोस्टसाठी)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^(http://localhost(:\d+)?|http://127\.0\.0\.1(:\d+)?|https://.*\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    
    if "chats" in request.url.path and request.method == "GET":
        cl = response.headers.get("Content-Length")
        ce = response.headers.get("Content-Encoding")
        print(f"[DIAGNOSTICS MIDDLEWARE] GET /chats - Content-Length: {cl}, Content-Encoding: {ce}, Internal Processing Time: {process_time:.2f} ms")
        
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


@app.on_event("startup")
async def startup_event():
    from .services.embedding_service import get_embeddings_model

    print("[STARTUP] Loading configuration...")
    # Load embedding model in background thread
    threading.Thread(target=get_embeddings_model, daemon=True).start()

    print(f"[PERF] FastAPI application startup completed: {int(time.time() * 1000)}")
    print("[STARTUP] Application ready.")


# Routers
app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(users.router)
app.include_router(settings_api.router)
app.include_router(auth.router)
app.include_router(bookmarks.router)
app.include_router(memories.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Chatbot API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}