import requests
import time
import json
import os

BASE_URL = "http://localhost:8000"
REPORT_FILE = "audit_results.md"

def write_report(content):
    with open(REPORT_FILE, "a", encoding="utf-8") as f:
        f.write(content + "\n")

def run_tests():
    write_report("# RAG Chatbot Audit Report\n")
    
    # ---------------------------------------------------------
    # PHASE 2 - API Testing (Basic Health & Auth Endpoints)
    # ---------------------------------------------------------
    write_report("## Phase 2: API & Backend Health\n")
    
    # Test /docs
    try:
        r = requests.get(f"{BASE_URL}/docs")
        if r.status_code == 200:
            write_report("- ✅ /docs endpoint is accessible")
        else:
            write_report(f"- ❌ /docs endpoint failed with {r.status_code}")
    except Exception as e:
        write_report(f"- ❌ /docs endpoint failed: {e}")

    # ---------------------------------------------------------
    # PHASE 3 - Authentication Testing
    # ---------------------------------------------------------
    write_report("\n## Phase 3: Authentication Testing\n")
    
    # Create test user A
    user_a = {"username": "testuser_a", "email": "a@test.com", "password": "Password123!"}
    requests.post(f"{BASE_URL}/register", json=user_a)
    
    # Create test user B
    user_b = {"username": "testuser_b", "email": "b@test.com", "password": "Password123!"}
    requests.post(f"{BASE_URL}/register", json=user_b)
    
    # Test valid login User A
    r = requests.post(f"{BASE_URL}/login", data={"username": "testuser_a", "password": "Password123!"})
    if r.status_code == 200:
        token_a = r.json().get("access_token")
        write_report("- ✅ Valid login successful")
    else:
        token_a = None
        write_report(f"- ❌ Valid login failed: {r.status_code}")
        
    # Test valid login User B
    r = requests.post(f"{BASE_URL}/login", data={"username": "testuser_b", "password": "Password123!"})
    if r.status_code == 200:
        token_b = r.json().get("access_token")
    else:
        token_b = None

    # Invalid password
    r = requests.post(f"{BASE_URL}/login", data={"username": "testuser_a", "password": "WrongPassword"})
    if r.status_code == 401:
        write_report("- ✅ Invalid password blocked")
    else:
        write_report("- ❌ Invalid password allowed")

    # Unauthorized access
    r = requests.get(f"{BASE_URL}/chats")
    if r.status_code == 401:
        write_report("- ✅ Unauthorized access to protected route blocked")
    else:
        write_report("- ❌ Unauthorized access allowed")
        
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # ---------------------------------------------------------
    # PHASE 6, 7 & 8 - Document, Security, Deletion
    # ---------------------------------------------------------
    write_report("\n## Phase 6-8: Documents & Security\n")
    
    if not token_a or not token_b:
        write_report("❌ Cannot proceed with document tests due to auth failure.")
        return

    # Create dummy files
    with open("dummy_a.txt", "w") as f: f.write("This is a secret document belonging to User A. The secret code is ALPHA-99.")
    with open("dummy_b.txt", "w") as f: f.write("This is User B's file. The secret is BETA-55.")

    # Upload A
    with open("dummy_a.txt", "rb") as f:
        r_up_a = requests.post(f"{BASE_URL}/documents/upload", headers=headers_a, files={"file": f})
    write_report(f"- Upload Document A: {r_up_a.status_code}")
    
    # Upload B
    with open("dummy_b.txt", "rb") as f:
        r_up_b = requests.post(f"{BASE_URL}/documents/upload", headers=headers_b, files={"file": f})
    
    # Wait for background processing (FAISS)
    time.sleep(10)

    # Search knowledge base A
    r_search_a = requests.get(f"{BASE_URL}/documents/search?query=ALPHA-99", headers=headers_a)
    if r_search_a.status_code == 200 and "ALPHA-99" in str(r_search_a.json()):
        write_report("- ✅ Document A correctly indexed and searchable by A")
    else:
        write_report("- ❌ Document A not properly searchable")

    # Multi-user security: B searching for A's secret
    r_search_b = requests.get(f"{BASE_URL}/documents/search?query=ALPHA-99", headers=headers_b)
    if r_search_b.status_code == 200 and "ALPHA-99" not in str(r_search_b.json()):
        write_report("- ✅ User B cannot search User A's documents (Security PASS)")
    else:
        write_report("- 🔴 CRITICAL SECURITY VULNERABILITY: User B can see User A's data!")

    # ---------------------------------------------------------
    # PHASE 9 - Chat Testing
    # ---------------------------------------------------------
    write_report("\n## Phase 9: Chat API\n")
    
    # Create chat
    r_chat = requests.post(f"{BASE_URL}/chats", headers=headers_a, json={"title": "Test Chat"})
    if r_chat.status_code == 200:
        chat_id = r_chat.json()["id"]
        write_report("- ✅ Chat creation successful")
        
        # Send message
        start_time = time.time()
        r_msg = requests.post(f"{BASE_URL}/chats/{chat_id}/messages", headers=headers_a, json={"role": "user", "content": "What is User A's secret code?"})
        # stream processing
        content = ""
        if r_msg.status_code == 200:
            for line in r_msg.iter_lines():
                if line:
                    content += line.decode()
            latency = time.time() - start_time
            write_report(f"- ✅ Message sending and RAG LLM response works (Latency: {latency:.2f}s)")
            if "ALPHA-99" in content:
                write_report("- ✅ RAG successfully retrieved and answered based on document")
            else:
                write_report(f"- ⚠️ RAG answered but missed context: {content}")
        else:
            write_report(f"- ❌ Message sending failed: {r_msg.status_code}")
    else:
        write_report("- ❌ Chat creation failed")

    # ---------------------------------------------------------
    # PHASE 5 & 11 - Hallucination & Prompt Injection
    # ---------------------------------------------------------
    write_report("\n## Phase 5 & 11: Hallucination & Injection\n")
    
    r_hallucinate = requests.post(f"{BASE_URL}/chats/{chat_id}/messages", headers=headers_a, json={"role": "user", "content": "What is the capital of Mars?"})
    hallucinate_text = ""
    for line in r_hallucinate.iter_lines():
        if line: hallucinate_text += line.decode()
    if "Sorry" in hallucinate_text or "not found" in hallucinate_text.lower():
        write_report("- ✅ Chatbot correctly refused to hallucinate")
    else:
        write_report(f"- 🔴 CRITICAL — HALLUCINATION: {hallucinate_text}")
        
    # ---------------------------------------------------------
    # PHASE 7 - Document Deletion
    # ---------------------------------------------------------
    write_report("\n## Phase 7: Document Deletion\n")
    docs_a = requests.get(f"{BASE_URL}/documents", headers=headers_a).json()
    if len(docs_a) > 0:
        doc_id = docs_a[0]["id"]
        r_del = requests.delete(f"{BASE_URL}/documents/{doc_id}", headers=headers_a)
        if r_del.status_code == 200:
            write_report("- ✅ Document deletion API success")
            time.sleep(2)
            # Verify retrieval
            r_search_after = requests.get(f"{BASE_URL}/documents/search?query=ALPHA-99", headers=headers_a)
            if "ALPHA-99" not in str(r_search_after.json()):
                write_report("- ✅ Document completely removed from FAISS")
            else:
                write_report("- 🔴 CRITICAL — VECTOR STORE CLEANUP BUG: Deleted doc still retrievable")
        else:
            write_report(f"- ❌ Document deletion failed: {r_del.status_code}")

    write_report("\nAudit completed.")

if __name__ == "__main__":
    if os.path.exists(REPORT_FILE):
        os.remove(REPORT_FILE)
    try:
        run_tests()
        print("Audit done.")
    except Exception as e:
        write_report(f"Fatal error during audit: {e}")
        print(f"Error: {e}")
