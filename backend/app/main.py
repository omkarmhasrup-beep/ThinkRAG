from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine
from .models import models
from .routers import auth_router, chat_router, message_router, document_router, analytics_router

def setup_db():
    if "sqlite" not in str(engine.url):
        with engine.connect() as conn:
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                conn.commit()
            except Exception as e:
                print(f"Warning: Could not create vector extension (perhaps already exists or permissions issue): {e}")
    models.Base.metadata.create_all(bind=engine)

setup_db()

app = FastAPI(title="AI Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(chat_router.router)
app.include_router(message_router.router)
app.include_router(document_router.router)
app.include_router(analytics_router.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Chatbot API"}
