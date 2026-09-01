from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..database import get_db
from ..core.security import get_current_user
from .. import models

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("")
def get_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        # Total counts
        total_chats = db.query(models.Chat).filter(models.Chat.user_id == current_user.id).count()
        total_messages = db.query(models.Message).join(models.Chat).filter(models.Chat.user_id == current_user.id).count()
        total_documents = db.query(models.File).filter(models.File.user_id == current_user.id).count()

        # Activity over time (Last 7 days)
        today = datetime.utcnow().date()
        date_list = [(today - timedelta(days=x)) for x in range(6, -1, -1)]
        
        # Ensure we cover the full day 7 days ago
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_chats = db.query(models.Chat).filter(
            models.Chat.user_id == current_user.id,
            models.Chat.created_at >= seven_days_ago
        ).all()
        
        recent_messages = db.query(models.Message).join(models.Chat).filter(
            models.Chat.user_id == current_user.id,
            models.Message.created_at >= seven_days_ago
        ).all()

        recent_files = db.query(models.File).filter(
            models.File.user_id == current_user.id,
            models.File.created_at >= seven_days_ago
        ).all()

        activity_data = []
        for d in date_list:
            day_str = d.strftime('%Y-%m-%d')
            day_name = d.strftime('%a')
            

            m_count = sum(1 for m in recent_messages if m.created_at and m.created_at.date() == d)
            f_count = sum(1 for f in recent_files if f.created_at and f.created_at.date() == d)
            
            activity_data.append({
                "name": day_name,
                "fullDate": day_str,
                "queries": m_count, # Messages sent/received
                "documents": f_count # Files uploaded
            })

        return {
            "total_chats": total_chats,
            "total_messages": total_messages,
            "total_documents": total_documents,
            "activity": activity_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
