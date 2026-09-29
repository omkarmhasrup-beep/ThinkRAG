import os
import requests
import time
import uuid

BASE_URL = "http://localhost:8000"

def create_user(username, email, password):
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    return r.json()

def login_user(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", data={
        "username": username,
        "password": password
    })
    return r.json().get("access_token")

def upload_document(token, content, filename):
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": (filename, content, "text/plain")}
    r = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files)
    return r.json()

def search_documents(token, query):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/documents/search?query={query}", headers=headers)
    return r.json()

def get_conversations(token):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/chats", headers=headers)
    return r.json()

def get_messages(token, chat_id):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/messages/{chat_id}", headers=headers)
    return r

def delete_document(token, doc_id):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.delete(f"{BASE_URL}/documents/{doc_id}", headers=headers)
    return r

def run_test():
    suffix = str(uuid.uuid4())[:8]
    user_a = f"usera_{suffix}"
    user_b = f"userb_{suffix}"
    
    print("Creating User A and B...")
    create_user(user_a, f"{user_a}@test.com", "password")
    create_user(user_b, f"{user_b}@test.com", "password")
    
    token_a = login_user(user_a, "password")
    token_b = login_user(user_b, "password")
    
    secret_a = f"SECRET_A_{suffix}"
    secret_b = f"SECRET_B_{suffix}"
    
    print("Uploading docs...")
    res_doc_a = upload_document(token_a, f"This is a doc containing {secret_a}", "docA.txt")
    res_doc_b = upload_document(token_b, f"This is a doc containing {secret_b}", "docB.txt")
    
    doc_a_id = res_doc_a.get("files", [{}])[0].get("file_id")
    
    print("Waiting for embeddings...")
    time.sleep(5)
    
    print("User A searching for Secret B...")
    res_a = search_documents(token_a, secret_b)
    print("User A results:", res_a)
    
    print("User B searching for Secret A...")
    res_b = search_documents(token_b, secret_a)
    print("User B results:", res_b)
    
    # Test document deletion cross-access
    del_res = delete_document(token_b, doc_a_id)
    print("User B trying to delete User A doc:", del_res.status_code)

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print("Error:", e)
