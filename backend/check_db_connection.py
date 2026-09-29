import sys
import os
from sqlalchemy import text
from app.database import engine, SessionLocal

def run_diagnostics():
    db = SessionLocal()
    try:
        # Safe engine details
        url = engine.url
        print("=== Database Connection Details ===")
        print(f"Driver: {url.drivername}")
        print(f"Host: {url.host}")
        print(f"Database: {url.database}")
        print(f"Port: {url.port}")
        print("===================================\n")
        
        print("=== Running Diagnostic Queries ===")
        queries = [
            "SELECT current_database();",
            "SELECT current_schema();",
            "SELECT current_user;",
            "SELECT inet_server_addr(), inet_server_port();",
            "SELECT id, username, email FROM public.users WHERE LOWER(TRIM(email)) = LOWER(TRIM('omkarmhasrup492@gmail.com'));"
        ]
        
        for q in queries:
            print(f"Query: {q}")
            try:
                result = db.execute(text(q)).fetchall()
                print(f"Result: {result}\n")
            except Exception as e:
                print(f"Error executing query: {e}\n")
                
    finally:
        db.close()

if __name__ == "__main__":
    run_diagnostics()
