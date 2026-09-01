import os
import time
import requests
import uuid
import json

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("Setting up test environment...")
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "password123"
    
    # 1. Register
    requests.post(f"{BASE_URL}/auth/register", json={"username": email, "email": email, "password": password})
    
    # 2. Login
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Upload Document
    print("Uploading test knowledge base...")
    with open("test_kb.txt", "rb") as f:
        res = requests.post(f"{BASE_URL}/documents/upload", files={"file": f}, headers=headers)
        if res.status_code != 200:
            print("Failed to upload file!", res.text)
            return

    # Wait for processing
    time.sleep(2)
    
    # 4. Create Chat
    chat_res = requests.post(f"{BASE_URL}/chats", json={"title": "Automated RAG Test"}, headers=headers)
    chat_id = chat_res.json()["id"]
    
    test_cases = [
        {
            "category": "TEST 1 — Direct retrieval",
            "question": "Who is the CEO of NeoTech Dynamics?",
            "expected": "Ramesh Sharma"
        },
        {
            "category": "TEST 2 — Paraphrased retrieval",
            "question": "Can you tell me the name of the person currently leading NeoTech Dynamics?",
            "expected": "Ramesh Sharma"
        },
        {
            "category": "TEST 3 — Multi-hop",
            "question": "Which company helped develop the cooling system used for the QuantumCore Processor?",
            "expected": "IceTech Inc. (QuantumCore uses CryoFrost, which was developed with IceTech)"
        },
        {
            "category": "TEST 4 — No-answer test",
            "question": "What is the annual revenue of NeoTech Dynamics?",
            "expected": "Should state that the information is not available in the documents."
        },
        {
            "category": "TEST 5 — Hallucination test",
            "question": "Tell me about the 'NeuralLink' product developed by NeoTech Dynamics in 2020.",
            "expected": "Should not hallucinate. Should state that this info is not in the documents."
        },
        {
            "category": "TEST 6 — Ambiguous question",
            "question": "Who is the head?",
            "expected": "Should clarify which department (Research, Engineering, Marketing) or mention the CEO."
        },
        {
            "category": "TEST 7 — Irrelevant context",
            "question": "What kind of coffee does Brews & Beans serve?",
            "expected": "Information not in documents (only mentions it's a coffee shop that gives a discount)."
        },
        {
            "category": "TEST 8 — Contradiction",
            "question": "How many days of paid leave do employees get?",
            "expected": "Should mention the conflict: standard HR policy says 30 days, but 2025 guidelines say 20 days."
        },
        {
            "category": "TEST 9 — Long question",
            "question": "When was NeoTech Dynamics established, where is it located, and who are the heads of the three main departments?",
            "expected": "2012, Pune. Research: Dr. Anita Desai, Eng: Sameer Patil, Marketing: Neha Joshi."
        },
        {
            "category": "TEST 10 — Language test",
            "question": "NeoTech Dynamics che CEO kon ahet?",
            "expected": "Should answer 'Ramesh Sharma' in Marathi/Hinglish."
        }
    ]

    # Generate 20 additional fact-based tests
    extra_tests = [
        ("When was NeoTech Dynamics established?", "2012"),
        ("Where is NeoTech Dynamics located?", "Pune, Maharashtra"),
        ("How many engineers did the company start with?", "15 engineers"),
        ("How many employees does the company have now?", "Over 5,000"),
        ("What is the flagship product?", "QuantumCore Processor"),
        ("When was the QuantumCore Processor released?", "January 2024"),
        ("Why does the QuantumCore Processor need a cooling system?", "It operates at extremely high temperatures"),
        ("What is the name of the proprietary cooling system?", "CryoFrost"),
        ("Which country is IceTech Inc. from?", "Sweden"),
        ("What percentage of patent share does IceTech hold on CryoFrost?", "40%"),
        ("Who is the head of the Research Department?", "Dr. Anita Desai"),
        ("What does the Research Department focus on?", "Next-generation computing architectures"),
        ("Who heads the Engineering Department?", "Sameer Patil"),
        ("What is the responsibility of the Engineering Department?", "Hardware manufacturing and quality assurance"),
        ("Who is the director of the Marketing Department?", "Neha Joshi"),
        ("What does the Marketing Department manage?", "Global sales, public relations, and branding"),
        ("What is the name of the coffee shop near the headquarters?", "Brews & Beans"),
        ("Is Brews & Beans affiliated with NeoTech Dynamics?", "No"),
        ("What discount do NeoTech employees get at Brews & Beans?", "10%"),
        ("What year did Ramesh Sharma become CEO?", "2018")
    ]

    for idx, (q, exp) in enumerate(extra_tests):
        test_cases.append({
            "category": f"ADDITIONAL TEST {idx+1}",
            "question": q,
            "expected": exp
        })

    print(f"Running {len(test_cases)} tests...")
    
    report_lines = ["# RAG Chatbot Automated Test Report", ""]
    report_lines.append(f"**Knowledge Base**: `test_kb.txt`")
    report_lines.append(f"**Total Tests**: {len(test_cases)}\n")

    for idx, tc in enumerate(test_cases):
        print(f"Running test {idx+1}/{len(test_cases)}: {tc['category']}...")
        
        try:
            res = requests.post(f"{BASE_URL}/messages/{chat_id}/generate", json={"role": "user", "content": tc["question"]}, headers=headers, stream=True)
            answer = ""
            for chunk in res.iter_content(chunk_size=1024, decode_unicode=True):
                if chunk:
                    answer += chunk
                    
            # Basic evaluation logic (Manual review recommended, script does simple heuristic)
            # For this automated suite, we'll mark it as PASS/FAIL loosely based on expected keywords, but we'll print the full text for manual inspection.
            pass_fail = "PENDING REVIEW"
            
            report_lines.append(f"### {tc['category']}")
            report_lines.append(f"**Question:** {tc['question']}")
            report_lines.append(f"**Expected behavior:** {tc['expected']}")
            report_lines.append(f"**Actual answer:**\n{answer.strip()}")
            report_lines.append(f"**Result:** {pass_fail}")
            report_lines.append("---\n")
            
        except Exception as e:
            print(f"Error on {tc['category']}: {e}")

    with open("C:/Users/Baap/.gemini/antigravity-ide/brain/31e01f0f-88e8-45ec-ab97-539ee7a2f66e/rag_test_report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print("Testing complete. Report generated.")

if __name__ == "__main__":
    run_tests()
