from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database
from .. import models
from ..schemas import schemas
from ..core.security import get_current_user

router = APIRouter(tags=["Memories"], prefix="/memories")

@router.get("/", response_model=List[schemas.MemoryResponse])
def get_memories(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    memories = db.query(models.Memory).filter(models.Memory.user_id == current_user.id).order_by(models.Memory.created_at.desc()).all()
    return memories

@router.post("/", response_model=schemas.MemoryResponse)
def create_memory(memory: schemas.MemoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Memory).filter(models.Memory.id == memory.id).first()
    if existing:
        return existing
        
    new_memory = models.Memory(
        id=memory.id,
        user_id=current_user.id,
        content=memory.content,
        type=memory.type
    )
    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)
    return new_memory

@router.put("/{memory_id}", response_model=schemas.MemoryResponse)
def update_memory(memory_id: str, memory_update: schemas.MemoryUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    memory = db.query(models.Memory).filter(models.Memory.id == memory_id, models.Memory.user_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
        
    memory.content = memory_update.content
    memory.type = memory_update.type
    db.commit()
    db.refresh(memory)
    return memory

@router.delete("/{memory_id}")
def delete_memory(memory_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    memory = db.query(models.Memory).filter(models.Memory.id == memory_id, models.Memory.user_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
        
    db.delete(memory)
    db.commit()
    return {"message": "Memory deleted successfully"}
