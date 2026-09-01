from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    message_idx = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=True, default="General")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
