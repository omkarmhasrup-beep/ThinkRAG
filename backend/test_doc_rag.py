import time, requests, uuid
email = f'test{uuid.uuid4().hex[:8]}@example.com'
requests.post('http://127.0.0.1:8000/auth/register', json={'username': email, 'email': email, 'password': 'password123'})
token = requests.post('http://127.0.0.1:8000/auth/login', data={'username': email, 'password': 'password123'}).json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Create a mock text file
with open('test_doc.txt', 'w') as f:
    f.write('Artificial Intelligence (AI) is a field of computer science...')

# Upload the file
print('Uploading file...')
with open('test_doc.txt', 'rb') as f:
    requests.post('http://127.0.0.1:8000/documents/upload', files={'file': f}, headers=headers)

chat_id = requests.post('http://127.0.0.1:8000/chats', json={'title': 'test'}, headers=headers).json()['id']

print('Querying chat...')
t1 = time.time()
res = requests.post(f'http://127.0.0.1:8000/messages/{chat_id}/generate', json={'role': 'user', 'content': 'what is artificial intelligence?'}, headers=headers, stream=True)
first = True
for chunk in res.iter_content(chunk_size=1):
    if first:
        print(f'TTFT: {time.time()-t1:.2f}s')
        first = False
print(f'Total: {time.time()-t1:.2f}s')
