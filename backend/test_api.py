import requests
import json
import uuid
import sys

base_url = "http://127.0.0.1:8000"
test_id = uuid.uuid4().hex[:6]
username = f"testuser_{test_id}"
email = f"test_{test_id}@example.com"
password = "password123"

def print_err(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)

print("--- Testing Auth ---")
# Register
res = requests.post(f"{base_url}/register", json={
    "username": username,
    "email": email,
    "password": password
})
print("Register:", res.status_code)
if res.status_code != 200:
    print_err(res.text)

# Login
res = requests.post(f"{base_url}/login", data={
    "username": username,
    "password": password
})
print("Login:", res.status_code)
if res.status_code != 200:
    print_err(res.text)

token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# Profile
res = requests.get(f"{base_url}/profile", headers=headers)
print("Profile:", res.status_code)
if res.status_code != 200:
    print_err(res.text)

print("\n--- Testing Chat ---")
# Create chat
res = requests.post(f"{base_url}/chats", headers=headers, json={"title": "Test Chat"})
print("Create Chat:", res.status_code)
if res.status_code != 200:
    print_err(res.text)

chat_id = res.json().get("id")
print(f"Chat ID: {chat_id}")

# Send Message (using normal message endpoint if exists)
# Let's check /chats list
res = requests.get(f"{base_url}/chats", headers=headers)
print("List Chats:", res.status_code)

print("\n--- Testing Document ---")
# Create a dummy pdf
with open("dummy_test.pdf", "wb") as f:
    f.write(b"%PDF-1.4\n%EOF\n")

# Upload
with open("dummy_test.pdf", "rb") as f:
    res = requests.post(
        f"{base_url}/documents/upload",
        headers=headers,
        files={"file": ("dummy_test.pdf", f, "application/pdf")}
    )
print("Upload Document:", res.status_code)

# List
res = requests.get(f"{base_url}/documents", headers=headers)
print("List Documents:", res.status_code)
if res.status_code != 200:
    print_err(res.text)
else:
    docs = res.json()
    if len(docs) > 0:
        print(f"Docs count: {len(docs)}")
        doc_id = docs[0].get("id")
        # Delete
        res = requests.delete(f"{base_url}/documents/{doc_id}", headers=headers)
        print("Delete Document:", res.status_code)

print("All tests finished.")
