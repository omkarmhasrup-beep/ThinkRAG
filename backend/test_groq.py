import os
from dotenv import load_dotenv
from groq import Groq
import traceback

load_dotenv()

try:
    api_key = os.getenv("GROQ_API_KEY")
    print(f"API Key read: '{api_key}' (length: {len(api_key) if api_key else 0})")
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": "Hello"}
        ]
    )
    print("Success! Response:")
    print(response.choices[0].message.content)
except Exception as e:
    print("Failed to call Groq API!")
    traceback.print_exc()
