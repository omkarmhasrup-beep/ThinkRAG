from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from .. import database
from .. import models
from ..schemas import schemas
from ..core.security import get_current_user
from ..services.document_service import extract_text_from_file
from ..services.rag_service import get_rag_stats, search_knowledge_base
from ..workers.document_worker import process_file_and_embed
from ..core.config import settings
import os
import shutil
import uuid

router = APIRouter(tags=["Documents"], prefix="/documents")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    files = [file]
    uploaded = []
    for file in files:
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in ["pdf", "txt", "docx", "csv", "pptx"]:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {file.filename}")
            
        file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_{uuid.uuid4().hex}_{file.filename}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract text immediately
        extracted_text = extract_text_from_file(file_path, file_extension)
            
        # Upload the original file to S3 (if configured)
        from ..services.storage_service import storage_service
        object_key = f"user_{current_user.id}/{uuid.uuid4().hex}_{file.filename}"
        s3_url = storage_service.upload_file(file_path, object_key)
            
        # Create DB record first to get a valid auto-incremented file ID
        new_file = models.File(
            user_id=current_user.id,
            filename=file.filename,
            filepath=s3_url,
            filetype=file_extension,
            content=extracted_text
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        
        # Immediately delete the physical file as it's no longer needed
        if os.path.exists(file_path):
            os.remove(file_path)
        
        try:
            process_file_and_embed(extracted_text, file.filename, current_user.id, file_id=new_file.id)
        except Exception as e:
            # Clean up the DB record if processing/embedding fails
            db.delete(new_file)
            db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
            
        uploaded.append({"file_id": new_file.id, "filename": file.filename})
    
    return {"message": f"{len(uploaded)} file(s) uploaded and processed successfully", "files": uploaded}

@router.get("")
def get_documents(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    files = db.query(models.File).filter(models.File.user_id == current_user.id).all()
    return files

@router.get("/stats")
def get_document_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    total_files = db.query(models.File).filter(models.File.user_id == current_user.id).count()
    stats = get_rag_stats(current_user.id)
    stats["total_files"] = total_files
    
    # Add vector database type label
    stats["vector_database"] = "PGVECTOR"
    
    # Format storage used
    bytes_used = stats["storage_used_bytes"]
    if bytes_used < 1024:
        stats["storage_used"] = f"{bytes_used} B"
    elif bytes_used < 1024 * 1024:
        stats["storage_used"] = f"{bytes_used / 1024:.1f} KB"
    else:
        stats["storage_used"] = f"{bytes_used / (1024 * 1024):.1f} MB"
        
    return stats

@router.get("/search")
def search_documents(
    query: str, 
    types: str = "", # comma separated like "pdf,txt"
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if not query.strip():
        return []
        
    results = search_knowledge_base(current_user.id, query)
    
    # Filter by file type in-memory
    if types:
        allowed_types = [t.strip().lower() for t in types.split(",")]
        filtered_results = []
        for r in results:
            # simple check of file extension from source
            ext = r["source"].split(".")[-1].lower() if "." in r["source"] else ""
            if ext in allowed_types:
                filtered_results.append(r)
        return filtered_results
        
    return results

@router.get("/content")
def get_document_content(filename: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    file_record = db.query(models.File).filter(models.File.filename == filename, models.File.user_id == current_user.id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
        
    return {"filename": filename, "content": file_record.content or ""}

@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    file_record = db.query(models.File).filter(models.File.id == doc_id, models.File.user_id == current_user.id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
        
    # Delete from S3 storage if applicable
    from ..services.storage_service import storage_service
    storage_service.delete_file(file_record.filepath)

    db.delete(file_record)
    db.commit()

    # Delete from vector store
    try:
        from ..vectorstore import get_vector_store
        vs = get_vector_store()
        if hasattr(vs, "delete_document"):
            vs.delete_document(current_user.id, doc_id)
        elif hasattr(vs, "evict_user_cache"):
            vs.evict_user_cache(current_user.id)
    except Exception as e:
        print(f"Warning: Could not delete vector store documents for user {current_user.id}: {e}")

    return {"message": "Document deleted"}
