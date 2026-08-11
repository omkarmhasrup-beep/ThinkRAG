from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from .. import database
from ..models import models
from ..schemas import schemas
from ..auth.dependencies import get_current_user
from ..services.rag_service import process_file_and_embed, extract_text_from_file, get_rag_stats, search_knowledge_base
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
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in ["pdf", "txt", "docx", "csv", "pptx"]:
        raise HTTPException(status_code=400, detail="Unsupported file format")
        
    file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_{uuid.uuid4().hex}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        process_file_and_embed(file_path, file_extension, current_user.id)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
        
    new_file = models.File(
        user_id=current_user.id,
        filename=file.filename,
        filepath=file_path,
        filetype=file_extension
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return {"message": "File uploaded and processed successfully", "file_id": new_file.id}

@router.get("")
def get_documents(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    files = db.query(models.File).filter(models.File.user_id == current_user.id).all()
    return files

@router.get("/stats")
def get_document_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    total_files = db.query(models.File).filter(models.File.user_id == current_user.id).count()
    stats = get_rag_stats(current_user.id)
    stats["total_files"] = total_files
    
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
        
    try:
        content = extract_text_from_file(file_record.filepath, file_record.filetype)
        return {"filename": filename, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract document text: {str(e)}")

@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    file_record = db.query(models.File).filter(models.File.id == doc_id, models.File.user_id == current_user.id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
        
    try:
        if os.path.exists(file_record.filepath):
            os.remove(file_record.filepath)
    except Exception as e:
        print(f"Failed to delete file {file_record.filepath}: {e}")
        
    db.delete(file_record)
    db.commit()
    return {"message": "Document deleted"}
