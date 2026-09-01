import time, httpx
from app.core.config import settings

client = httpx.Client()

def test_groq():
    t0 = time.time()
    with client.stream(
        "POST",
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
        json={
            "model": settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": "system"},
                {"role": "user", "content": "what is AI?"}
            ],
            "stream": True,
            "max_tokens": 100,
            "temperature": 0.7
        }
    ) as response:
        for line in response.iter_lines():
            if line.startswith("data: "):
                print(f"TTFT with client: {time.time()-t0:.2f}s")
                break

test_groq()
test_groq()
