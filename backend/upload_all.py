import os
import sys

# Ensure app module is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import SessionLocal
from app.models.document import File
from app.services.document_service import extract_text_from_file
from app.workers.document_worker import process_file_and_embed

kb_dir = "../knowledge base"
user_id = 2

db = SessionLocal()

def main():
    if not os.path.exists(kb_dir):
        print(f"Directory {kb_dir} not found")
        return

    files = [f for f in os.listdir(kb_dir) if f.lower().endswith(".pdf")]
    print(f"Found {len(files)} PDFs in {kb_dir}")

    for filename in files:
        file_path = os.path.join(kb_dir, filename)
        print(f"--- Processing {filename} ---")
        
        extracted_text = extract_text_from_file(file_path, "pdf")
        if not extracted_text.strip():
            print(f"Failed to extract text from {filename}, skipping.")
            continue
            
        # Check if already exists for user
        existing = db.query(File).filter(File.filename == filename, File.user_id == user_id).first()
        if existing:
            print(f"File {filename} already exists in DB, skipping.")
            continue
            
        new_file = File(
            user_id=user_id,
            filename=filename,
            filepath=file_path,
            filetype="pdf",
            content=extracted_text
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        
        try:
            process_file_and_embed(extracted_text, filename, user_id, file_id=new_file.id)
            print(f"Successfully processed {filename}")
        except Exception as e:
            db.delete(new_file)
            db.commit()
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    main()
