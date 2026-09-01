from fastapi import APIRouter
from pydantic import BaseModel
from ..core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

# All Groq models available for fast inference (verified working as of Aug 2026)
AVAILABLE_MODELS = [
    {
        "id": "qwen/qwen3.6-27b",
        "name": "Qwen 3.6 27B",
        "provider": "Qwen (Groq)",
        "speed": 90,
        "quality": 92,
        "context": "32K",
        "description": "⚡ Fast & smart. Best balance of speed and quality. Recommended.",
        "recommended": True,
    },
    {
        "id": "openai/gpt-oss-20b",
        "name": "GPT OSS 20B",
        "provider": "OpenAI (Groq)",
        "speed": 88,
        "quality": 88,
        "context": "32K",
        "description": "OpenAI open-source 20B model. Fast and reliable.",
        "recommended": False,
    },
    {
        "id": "qwen/qwen3.8-27b",
        "name": "Qwen 3.8 27B",
        "provider": "Qwen (Groq)",
        "speed": 85,
        "quality": 94,
        "context": "32K",
        "description": "Latest Qwen model. Higher quality, slightly slower.",
        "recommended": False,
    },
    {
        "id": "openai/gpt-oss-120b",
        "name": "GPT OSS 120B",
        "provider": "OpenAI (Groq)",
        "speed": 65,
        "quality": 97,
        "context": "32K",
        "description": "Highest quality model. Best for complex reasoning tasks.",
        "recommended": False,
    },
    {
        "id": "groq/compound",
        "name": "Groq Compound",
        "provider": "Groq",
        "speed": 80,
        "quality": 90,
        "context": "128K",
        "description": "Groq's own compound model. Long context support.",
        "recommended": False,
    },
    {
        "id": "groq/compound-mini",
        "name": "Groq Compound Mini",
        "provider": "Groq",
        "speed": 95,
        "quality": 82,
        "context": "128K",
        "description": "Ultra-fast compact model. Great for quick Q&A.",
        "recommended": False,
    },
]


class ModelUpdate(BaseModel):
    model_id: str


@router.get("/model")
def get_current_model():
    """Get the currently active AI model."""
    current = settings.GROQ_MODEL
    matched = next((m for m in AVAILABLE_MODELS if m["id"] == current), None)
    return {
        "current_model": current,
        "model_info": matched,
        "available_models": AVAILABLE_MODELS,
    }


@router.post("/model")
def set_model(body: ModelUpdate):
    """Switch the active AI model at runtime (no restart needed)."""
    valid_ids = [m["id"] for m in AVAILABLE_MODELS]
    if body.model_id not in valid_ids:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid model id. Choose from: {valid_ids}")
    settings.GROQ_MODEL = body.model_id
    matched = next((m for m in AVAILABLE_MODELS if m["id"] == body.model_id), None)
    return {"message": f"Model switched to {body.model_id}", "model_info": matched}
