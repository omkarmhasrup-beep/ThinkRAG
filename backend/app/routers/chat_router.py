from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import database
from ..models import models
from ..schemas import schemas
from ..auth.dependencies import get_current_user

router = APIRouter(tags=["Chats"], prefix="/chats")

@router.get("", response_model=List[schemas.ChatResponse])
def get_chats(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    chats = db.query(models.Chat).filter(models.Chat.user_id == current_user.id).order_by(models.Chat.updated_at.desc()).all()
    return chats

@router.post("", response_model=schemas.ChatResponse)
def create_chat(chat: schemas.ChatCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_chat = models.Chat(title=chat.title, user_id=current_user.id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

@router.put("/{chat_id}", response_model=schemas.ChatResponse)
def update_chat(chat_id: int, chat: schemas.ChatCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_chat = db.query(models.Chat).filter(models.Chat.id == chat_id, models.Chat.user_id == current_user.id).first()
    if not db_chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db_chat.title = chat.title
    from sqlalchemy.sql import func
    db_chat.updated_at = func.now()
    db.commit()
    db.refresh(db_chat)
    return db_chat

@router.delete("/{chat_id}")
def delete_chat(chat_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_chat = db.query(models.Chat).filter(models.Chat.id == chat_id, models.Chat.user_id == current_user.id).first()
    if not db_chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.delete(db_chat)
    db.commit()
    return {"message": "Chat deleted successfully"}
