import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app.database.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"Username: {u.username}, Email: {u.email}, Hash: {u.password_hash}")
