from ..services.document_service import chunk_text, extract_text_from_file
from ..vectorstore import get_vector_store
from ..database import SessionLocal
from ..models import File
from ..services.storage_service import storage_service
import os
import uuid

def process_file_and_embed(file_path: str, file_extension: str, filename: str, user_id: int, file_id: int = None):
    print(f"Processing and embedding {filename} for user {user_id} (file_id={file_id})...")
    try:
        # Extract text in the background task
        text = extract_text_from_file(file_path, file_extension)
        
        # Upload to S3 in the background task
        object_key = f"user_{user_id}/{uuid.uuid4().hex}_{filename}"
        s3_url = storage_service.upload_file(file_path, object_key)
        
        # Update DB record with extracted content and S3 URL
        if file_id is not None:
            db = SessionLocal()
            try:
                file_record = db.query(File).filter(File.id == file_id).first()
                if file_record:
                    file_record.content = text
                    file_record.filepath = s3_url
                    db.commit()
            except Exception as db_e:
                print(f"Database update error for {filename}: {db_e}")
            finally:
                db.close()

        # Chunk and embed
        documents = chunk_text(text, filename)
        if not documents:
            raise ValueError(f"No valid chunks extracted from {filename}")
            
        if file_id is not None:
            for doc in documents:
                doc.metadata["file_id"] = file_id
            
        vector_store = get_vector_store()
        vector_store.add_documents(user_id, documents)
        print(f"Successfully generated vectors for {filename} and stored.")
        
    except Exception as e:
        print(f"Error processing {filename}: {e}")
    finally:
        # Cleanup the temporary physical file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError as e:
                print(f"Error removing file {file_path}: {e}")
