import requests
import json

base_url = "http://127.0.0.1:8000"

# Register a user
print("Registering user...")
res = requests.post(f"{base_url}/register", json={
    "username": "testuser_upload",
    "email": "test_upload@example.com",
    "password": "password"
})

# Login
print("Logging in...")
res = requests.post(f"{base_url}/login", data={
    "username": "testuser_upload",
    "password": "password"
})
if res.status_code != 200:
    print(f"Login failed: {res.text}")
    exit(1)
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a dummy pdf
with open("dummy.pdf", "wb") as f:
    f.write(b"%PDF-1.4\n%EOF\n")

# Upload
print("Uploading file...")
with open("dummy.pdf", "rb") as f:
    res = requests.post(
        f"{base_url}/documents/upload",
        headers=headers,
        files={"file": ("dummy.pdf", f, "application/pdf")}
    )
print(f"Upload response: {res.status_code}")
print(res.text)

# List
res = requests.get(f"{base_url}/documents", headers=headers)
print(f"List response: {res.text}")
