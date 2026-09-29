import sys
import os
from sqlalchemy import text
from app.database import engine, SessionLocal

def run_diagnostics():
    db = SessionLocal()
    try:
        print("=== Database Connection Details ===")
        print(f"Host: {engine.url.host}")
        print("===================================\n")
        
        print("=== Users ===")
        result = db.execute(text("SELECT id, username, email FROM public.users")).fetchall()
        for r in result:
            print(r)
                
    finally:
        db.close()

if __name__ == "__main__":
    run_diagnostics()
