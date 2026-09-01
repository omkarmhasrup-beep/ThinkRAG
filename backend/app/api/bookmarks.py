from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database
from .. import models
from ..schemas import schemas
from ..core.security import get_current_user

router = APIRouter(tags=["Bookmarks"], prefix="/bookmarks")

@router.get("/", response_model=List[schemas.BookmarkResponse])
def get_bookmarks(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    bookmarks = db.query(models.Bookmark).filter(models.Bookmark.user_id == current_user.id).order_by(models.Bookmark.created_at.desc()).all()
    return bookmarks

@router.post("/", response_model=schemas.BookmarkResponse)
def create_bookmark(bookmark: schemas.BookmarkCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Bookmark).filter(models.Bookmark.id == bookmark.id).first()
    if existing:
        # Avoid duplicates
        return existing
        
    new_bookmark = models.Bookmark(
        id=bookmark.id,
        user_id=current_user.id,
        chat_id=bookmark.chat_id,
        message_idx=bookmark.message_idx,
        content=bookmark.content,
        category=bookmark.category
    )
    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)
    return new_bookmark

@router.put("/{bookmark_id}", response_model=schemas.BookmarkResponse)
def update_bookmark(bookmark_id: str, bookmark_update: schemas.BookmarkUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    bookmark = db.query(models.Bookmark).filter(models.Bookmark.id == bookmark_id, models.Bookmark.user_id == current_user.id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
        
    bookmark.category = bookmark_update.category
    db.commit()
    db.refresh(bookmark)
    return bookmark

@router.delete("/{bookmark_id}")
def delete_bookmark(bookmark_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    bookmark = db.query(models.Bookmark).filter(models.Bookmark.id == bookmark_id, models.Bookmark.user_id == current_user.id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
        
    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark deleted successfully"}
