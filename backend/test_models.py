import os
import requests
import json

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
}

response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
print(json.dumps(response.json(), indent=2))
