import sys
import os
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import PasswordResetToken

def test_insert():
    try:
        db = SessionLocal()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        reset_token = PasswordResetToken(
            user_id=1, # Assuming user 1 exists, or it will fail foreign key. Let's just create a test one or see the exact error.
            token_hash="testhash",
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()
        print("Insert successful!")
    except Exception as e:
        print("Insert failed:", e)

if __name__ == "__main__":
    test_insert()
