import requests
import uuid

base_url = "http://127.0.0.1:8000"
test_id = uuid.uuid4().hex[:6]
username = f"search_user_{test_id}"
email = f"search_{test_id}@example.com"
password = "password123"

# Register
requests.post(f"{base_url}/auth/register", json={"username": username, "email": email, "password": password})
# Login
token = requests.post(f"{base_url}/auth/login", data={"username": username, "password": password}).json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Upload
with open("dummy_search.txt", "w", encoding="utf-8") as f:
    f.write("This is a secret document belonging to User A. The secret code is ALPHA-99.")
with open("dummy_search.txt", "rb") as f:
    requests.post(f"{base_url}/documents/upload", headers=headers, files={"file": ("dummy_search.txt", f, "text/plain")})

# Search
res = requests.get(f"{base_url}/documents/search?query=ALPHA", headers=headers)
print("Search Response:", res.status_code, res.text)
