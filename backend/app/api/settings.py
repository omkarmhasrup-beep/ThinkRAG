from fastapi import APIRouter
from pydantic import BaseModel
from ..core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

# All AI models available for fast inference
AVAILABLE_MODELS = [
    {
        "id": "gemini-3.6-flash",
        "name": "Gemini 3.6 Flash",
        "provider": "Google (Gemini)",
        "speed": 98,
        "quality": 95,
        "context": "1M",
        "description": "⚡ Google's fastest intelligent multimodal reasoning model. Recommended.",
        "recommended": True,
    },
    {
        "id": "gemini-2.0-flash",
        "name": "Gemini 2.0 Flash",
        "provider": "Google (Gemini)",
        "speed": 96,
        "quality": 92,
        "context": "1M",
        "description": "Next-gen multimodal model with low latency.",
        "recommended": False,
    },
    {
        "id": "gemini-1.5-pro",
        "name": "Gemini 1.5 Pro",
        "provider": "Google (Gemini)",
        "speed": 80,
        "quality": 98,
        "context": "2M",
        "description": "Highest intelligence model for complex reasoning and large docs.",
        "recommended": False,
    },
    {
        "id": "gemini-1.5-flash",
        "name": "Gemini 1.5 Flash",
        "provider": "Google (Gemini)",
        "speed": 94,
        "quality": 90,
        "context": "1M",
        "description": "Fast and versatile multimodal model.",
        "recommended": False,
    },
]


class ModelUpdate(BaseModel):
    model_id: str


@router.get("/model")
def get_current_model():
    """Get the currently active AI model."""
    if settings.GEMINI_API_KEY:
        current = settings.GEMINI_MODEL
    else:
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
    if body.model_id.startswith("gemini-"):
        settings.GEMINI_MODEL = body.model_id
    else:
        settings.GROQ_MODEL = body.model_id
    matched = next((m for m in AVAILABLE_MODELS if m["id"] == body.model_id), None)
    return {"message": f"Model switched to {body.model_id}", "model_info": matched}
