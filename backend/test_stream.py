import requests
import time
import random

def get_token():
    user = f"testuser_{random.randint(1000, 9999)}"
    data = {"username": user, "password": "password123"}
    # Register test user
    res = requests.post("http://localhost:8000/auth/register", json={"username": user, "email": f"{user}@example.com", "password": "password123"})
    res = requests.post("http://localhost:8000/auth/login", data=data)
    return res.json()["access_token"]

def test_stream():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Create chat
    res = requests.post("http://localhost:8000/chats", headers=headers, json={"title": "Test Chatbot"})
    chat_id = res.json()["id"]
    
    print("Testing generate endpoint...")
    t0 = time.time()
    
    # Stream
    with requests.post(f"http://localhost:8000/messages/{chat_id}/generate", headers=headers, json={"role": "user", "content": "Hello!"}, stream=True) as r:
        first = False
        full_response = ""
        for chunk in r.iter_content(chunk_size=None):
            if chunk:
                if not first:
                    print(f"Time to first token: {(time.time() - t0):.2f}s")
                    first = True
                decoded = chunk.decode("utf-8")
                full_response += decoded
                print(decoded, end="", flush=True)
                
        print(f"\n\nTotal time: {(time.time() - t0):.2f}s")

if __name__ == "__main__":
    test_stream()
