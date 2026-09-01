import requests
import json
import sqlite3

BASE_URL = "http://localhost:8000"

def test_flow():
    print("Testing Forgot Password Flow...")
    
    # Register a test user if not exists
    try:
        requests.post(f"{BASE_URL}/auth/register", json={
            "username": "resetuser",
            "email": "resetuser@example.com",
            "password": "oldpassword123"
        })
    except Exception as e:
        pass
        
    # Test forgot password
    res = requests.post(f"{BASE_URL}/auth/forgot-password", json={
        "email": "resetuser@example.com"
    })
    print("Forgot Password Response:", res.json())
    
    # We need to get the token. Since we print it in auth.py, we can extract it from the DB
    # Actually, the token is hashed in DB. So this test can't easily get the raw token 
    # unless we parse the console output of the backend server.
    # We'll just verify the DB has the token record.
    
    conn = sqlite3.connect("app/rag_global.db") # Or whichever db is used
    try:
        conn = sqlite3.connect("rag.db")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1")
        record = cursor.fetchone()
        print("Latest Token Record in DB:", record)
    except Exception as e:
        print("Could not query DB:", e)
        
    print("Done testing.")
    
if __name__ == "__main__":
    test_flow()
