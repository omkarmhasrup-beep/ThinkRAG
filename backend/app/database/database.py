from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from ..core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Ensure engine is created with the right URL and proper pooling settings
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_recycle=300, # Recycle connections every 5 minutes
    pool_size=10,
    max_overflow=20,
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enable vector extension dynamically on startup if using postgres
if "postgres" in db_url:
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            print("[DB] Ensured pgvector extension is enabled.")
    except Exception as e:
        print(f"[DB] Could not create vector extension (might already exist or lack permissions): {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
