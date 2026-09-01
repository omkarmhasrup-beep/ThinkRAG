import time
import requests
import uuid

email=f'test{uuid.uuid4().hex[:8]}@example.com'
requests.post('http://127.0.0.1:8000/auth/register', json={'username': email, 'email': email, 'password': 'password123'})
res = requests.post('http://127.0.0.1:8000/auth/login', data={'username': email, 'password': 'password123'}).json()
token=res['access_token']
headers={'Authorization': f'Bearer {token}'}

chat_res = requests.post('http://127.0.0.1:8000/chats', json={'title': 'test'}, headers=headers).json()
chat_id = chat_res['id']

t1 = time.time()
chat = requests.post(f'http://127.0.0.1:8000/messages/{chat_id}/generate', json={'role': 'user', 'content': 'what is AI?'}, headers=headers, stream=True)

first = True
for line in chat.iter_lines():
    if line:
        if first:
            print(f'TTFT: {time.time()-t1:.2f}s')
            first = False
        print(f'Chunk: {time.time()-t1:.2f}s - {line.decode("utf-8")}')

print(f'Total Time: {time.time()-t1:.2f}s')
