import requests
import json
import base64

# Base URL for API
API_URL = "http://localhost:8000"

def get_token():
    # Login as an existing user or register one
    user_data = {"username": "testuser", "email": "test@example.com", "password": "password123"}
    # Register (may fail if exists, ignore)
    requests.post(f"{API_URL}/auth/register", json=user_data)
    # Login
    resp = requests.post(f"{API_URL}/auth/login", data={"username": "testuser", "password": "password123"})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    else:
        print("Login failed:", resp.text)
        return None

def test_chat():
    token = get_token()
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n--- Testing Text Only ---")
    chat_resp = requests.post(f"{API_URL}/chats", json={"title": "Test Chat"}, headers=headers)
    chat_id = chat_resp.json()["id"]
    
    payload = {"role": "user", "content": "What is 2+2?"}
    msg_resp = requests.post(f"{API_URL}/messages/{chat_id}/generate", json=payload, headers=headers)
    print("Text Only Response Status:", msg_resp.status_code)
    # the response is streaming, so let's read the stream
    for line in msg_resp.iter_lines():
        if line:
            print(line.decode('utf-8'), end="")
    print("\n")

    print("\n--- Testing Image + Text ---")
    # Generate a dummy 1x1 pixel base64 image (gif)
    dummy_base64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    
    payload_image = {"role": "user", "content": "What is in this image?", "image": dummy_base64}
    msg_resp2 = requests.post(f"{API_URL}/messages/{chat_id}/generate", json=payload_image, headers=headers)
    print("Image+Text Response Status:", msg_resp2.status_code)
    for line in msg_resp2.iter_lines():
        if line:
            print(line.decode('utf-8'), end="")
    print("\n")

if __name__ == "__main__":
    test_chat()
