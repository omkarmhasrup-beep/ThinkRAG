from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str = Field(..., min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    image: Optional[str] = None

class MessageResponse(MessageBase):
    id: int
    chat_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    title: str

class ChatCreate(ChatBase):
    pass

class ChatResponse(ChatBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[MessageResponse] = []
    class Config:
        from_attributes = True

class BookmarkCreate(BaseModel):
    id: str
    chat_id: int
    message_idx: int
    content: str
    category: str = "General"

class BookmarkUpdate(BaseModel):
    category: str

class BookmarkResponse(BaseModel):
    id: str
    user_id: int
    chat_id: int
    message_idx: int
    content: str
    category: str
    created_at: datetime
    class Config:
        from_attributes = True

class MemoryCreate(BaseModel):
    id: str
    content: str
    type: str

class MemoryUpdate(BaseModel):
    content: str
    type: str

class MemoryResponse(BaseModel):
    id: str
    user_id: int
    content: str
    type: str
    created_at: datetime
    class Config:
        from_attributes = True
