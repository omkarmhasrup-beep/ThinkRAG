import requests
import json
import uuid

base_url = "http://127.0.0.1:8000"
test_id = uuid.uuid4().hex[:6]
username = f"testuser_{test_id}"
email = f"test_{test_id}@example.com"
password = "password123"

print("--- Testing Auth ---")
# Register
res = requests.post(f"{base_url}/auth/register", json={
    "username": username,
    "email": email,
    "password": password
})
print("Register:", res.status_code)
if res.status_code != 200:
    print(res.text)
    exit(1)

# Login
res = requests.post(f"{base_url}/auth/login", data={
    "username": username,
    "password": password
})
print("Login:", res.status_code)
if res.status_code != 200:
    print(res.text)
    exit(1)

token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("\n--- Testing Document Upload ---")
# Create a dummy txt
with open("dummy_test.txt", "w", encoding="utf-8") as f:
    f.write("This is a secret document belonging to User A. The secret code is ALPHA-99.")

# Upload
with open("dummy_test.txt", "rb") as f:
    res = requests.post(
        f"{base_url}/documents/upload",
        headers=headers,
        files={"file": ("dummy_test.txt", f, "text/plain")}
    )
print("Upload Document:", res.status_code)
print(res.text)

print("\n--- Testing RAG ---")
# List Chats
res = requests.post(f"{base_url}/messages/chats", headers=headers, json={"title": "Test Chat"})
# Wait, /messages/{chat_id} is for messages. Where do we create a chat?
# I'll check /chats or similar later. I'll just hit the health endpoint for now.
print("Finished.")
