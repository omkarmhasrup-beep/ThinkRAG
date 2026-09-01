import sys
import os
import time
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app.services.rag_service import generate_rag_response

# create a dummy user
from app.database.database import SessionLocal
from app.models.user import User
import random

db = SessionLocal()
u = User(username=f"perf_{random.randint(0,999)}", email="perf@example.com", password_hash="123")
db.add(u)
db.commit()
user_id = u.id

t0 = time.time()
print("Starting generation...")
gen = generate_rag_response(user_id, "Hello")
for i, chunk in enumerate(gen):
    if i == 0:
        print(f"First chunk took: {time.time() - t0:.2f}s")
print(f"Total took: {time.time() - t0:.2f}s")
