import time
import requests
import uuid
import subprocess
import os
import json

print("Starting background server on port 8001...")
server_process = subprocess.Popen(
    ["venv\\Scripts\\python.exe", "-m", "uvicorn", "app.main:app", "--port", "8001"],
    cwd=r"c:\Users\Baap\Desktop\ThinkRAG\backend",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

# Wait for server to start
time.sleep(15)  # Allow time for huggingface model load

email = f'test{uuid.uuid4().hex[:8]}@example.com'
print("Registering user...")
requests.post('http://127.0.0.1:8001/auth/register', json={'username': email, 'email': email, 'password': 'password123'})
token = requests.post('http://127.0.0.1:8001/auth/login', data={'username': email, 'password': 'password123'}).json()['access_token']
headers = {'Authorization': f'Bearer {token}'}
chat_id = requests.post('http://127.0.0.1:8001/chats', json={'title': 'test'}, headers=headers).json()['id']

# Upload a mock document so the vector store is populated
with open('test_doc.txt', 'w') as f:
    f.write('Artificial Intelligence (AI) is a field of computer science focused on creating intelligent machines.')
with open('test_doc.txt', 'rb') as f:
    requests.post('http://127.0.0.1:8001/documents/upload', files={'file': f}, headers=headers)

print("Sending warmup request...")
res_w = requests.post(f'http://127.0.0.1:8001/messages/{chat_id}/generate', json={'role': 'user', 'content': 'warmup'}, headers=headers, stream=True)
for chunk in res_w.iter_content(chunk_size=1):
    pass
time.sleep(1)

print("Sending chat request...")
t_ui_start = time.perf_counter()
t_req_start = time.perf_counter()
res = requests.post(f'http://127.0.0.1:8001/messages/{chat_id}/generate', json={'role': 'user', 'content': 'What is artificial intelligence?'}, headers=headers, stream=True)

first_chunk_received = False
t_first_chunk = 0
ai_content = ""
for chunk in res.iter_content(chunk_size=1):
    if chunk:
        if not first_chunk_received:
            t_first_chunk = time.perf_counter()
            first_chunk_received = True
        ai_content += chunk.decode('utf-8')
        
t_stream_end = time.perf_counter()

server_process.terminate()
stdout_data, stderr_data = server_process.communicate()
print("\n--- UVICORN LOGS ---")
print(stdout_data.decode('utf-8'))
print(stderr_data.decode('utf-8'))

print("\n--- MEASURED STAGES ---")

with open('perf_diagnostics.json', 'r') as f:
    rag_perf = json.load(f)
    
with open('perf_pgvector.json', 'r') as f:
    pg_perf = json.load(f)

print(f"Stage                         Time")
print(f"------------------------------------------------")
print(f"Authentication (Depends)      <0.0100 s (Estimated)")
print(f"Thread Start & Overhead       {rag_perf['t_context_start'] - rag_perf['t_req']:.4f} s")
print(f"Embedding                     {pg_perf['t_embed_end'] - pg_perf['t_embed_start']:.4f} s")
print(f"Vector search                 {pg_perf['t_search_end'] - pg_perf['t_search_start']:.4f} s")
print(f"Document retrieval (Total)    {rag_perf['t_prompt_start'] - rag_perf['t_context_start']:.4f} s")
print(f"Prompt construction           {rag_perf['t_prompt_end'] - rag_perf['t_prompt_start']:.4f} s")
print(f"Groq connection (start)       {rag_perf['first_token_time'] - rag_perf['llm_start']:.4f} s")
print(f"Groq TTFT                     {rag_perf['first_token_time'] - rag_perf['llm_start']:.4f} s")
print(f"LLM generation                {rag_perf['llm_end'] - rag_perf['first_token_time']:.4f} s")
print(f"Frontend first token          {t_first_chunk - t_ui_start:.4f} s")
print(f"Total UI time                 {t_stream_end - t_ui_start:.4f} s")

