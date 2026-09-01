import requests
import json
import sqlite3
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt

BASE_URL = "http://localhost:8000"
DB_PATH = "rag.db" # The actual db used

def test_flow():
    print("Starting E2E Forgot Password Test...")
    
    # 0. Setup: Create test user
    test_email = "e2etest@example.com"
    test_username = "e2e_user"
    old_password = "old_password123"
    new_password = "new_password456"
    
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "username": test_username,
            "email": test_email,
            "password": old_password
        })
        if res.status_code == 200:
            print("[+] Test user created successfully.")
        else:
            print(f"[*] User might already exist: {res.json()}")
    except requests.exceptions.ConnectionError:
        print("[-] Backend server is not running on port 8000!")
        return

    # Verify old password works
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": test_username, "password": old_password})
    assert res.status_code == 200, "[-] Setup failed: Old password login failed."
    
    # 1. Click/test POST /auth/forgot-password
    res = requests.post(f"{BASE_URL}/auth/forgot-password", json={"email": test_email})
    assert res.status_code == 200, "[-] Forgot password endpoint failed."
    print("[+] /auth/forgot-password endpoint works and returns 200.")
    
    # 2 & 3. Verify token is generated and stored securely in DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT u.id, u.password_hash FROM users u WHERE u.email=?", (test_email,))
    user_row = cursor.fetchone()
    user_id = user_row[0]
    old_hash = user_row[1]
    
    cursor.execute("SELECT id, token_hash, expires_at, used_at FROM password_reset_tokens WHERE user_id=? ORDER BY created_at DESC LIMIT 1", (user_id,))
    token_row = cursor.fetchone()
    
    assert token_row is not None, "[-] Token record not found in database!"
    print(f"[+] Token record found securely in DB. Token hash: {token_row[1][:10]}...")
    
    # We can't easily extract the raw token without parsing the backend stdout or mocking the email sender.
    # Since we can't get the raw token programmatically from the DB (because it's securely hashed), 
    # we'll generate our OWN valid reset token by directly hitting the DB code logic, just to test the reset endpoint.
    import secrets
    import hashlib
    from datetime import datetime, timedelta, timezone
    
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    cursor.execute("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)", 
                  (user_id, token_hash, expires_at))
    conn.commit()
    conn.close()
    print("[+] Inserted a controlled valid token for testing reset flow.")
    
    # 6 & 7. Verify /reset-password works with valid token
    res = requests.post(f"{BASE_URL}/auth/reset-password", json={
        "token": raw_token,
        "new_password": new_password
    })
    assert res.status_code == 200, f"[-] Reset password failed: {res.text}"
    print("[+] Password successfully reset via API.")
    
    # 8. Verify the old password no longer works
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": test_username, "password": old_password})
    assert res.status_code == 401, "[-] Security Flaw: Old password STILL works!"
    print("[+] Verified old password no longer works.")
    
    # 9. Verify the new password works
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": test_username, "password": new_password})
    assert res.status_code == 200, "[-] New password does not work for login!"
    print("[+] Verified new password works for login.")
    
    # 10. Verify used token is rejected
    res = requests.post(f"{BASE_URL}/auth/reset-password", json={
        "token": raw_token,
        "new_password": "another_password"
    })
    assert res.status_code == 400, "[-] Security Flaw: Used token was accepted!"
    print("[+] Verified used token is rejected.")
    
    # 10. Verify expired token is rejected
    raw_token_exp = secrets.token_urlsafe(32)
    token_hash_exp = hashlib.sha256(raw_token_exp.encode()).hexdigest()
    expires_at_exp = datetime.now(timezone.utc) - timedelta(hours=1) # Expired 1 hour ago
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)", 
                  (user_id, token_hash_exp, expires_at_exp))
    conn.commit()
    conn.close()
    
    res = requests.post(f"{BASE_URL}/auth/reset-password", json={
        "token": raw_token_exp,
        "new_password": "another_password"
    })
    assert res.status_code == 400, "[-] Security Flaw: Expired token was accepted!"
    print("[+] Verified expired token is rejected.")
    
    # 10. Verify invalid token is rejected
    res = requests.post(f"{BASE_URL}/auth/reset-password", json={
        "token": "this_is_an_invalid_token",
        "new_password": "another_password"
    })
    assert res.status_code == 400, "[-] Security Flaw: Invalid token was accepted!"
    print("[+] Verified invalid token is rejected.")

    print("\n[SUCCESS] E2E Forgot Password Flow Test Completed Perfectly!")
    
if __name__ == "__main__":
    test_flow()
