import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app.database.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    if u.username != u.username.strip():
        print(f"Fixing username '{u.username}' -> '{u.username.strip()}'")
        u.username = u.username.strip()

db.commit()
print("Done fixing spaces.")
