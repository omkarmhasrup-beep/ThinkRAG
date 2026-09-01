from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import database
from .. import models
from ..schemas import schemas
from ..core.security import get_current_user
from sqlalchemy.sql import func
from ..services.rag_service import generate_rag_response

router = APIRouter(tags=["Messages"], prefix="/messages")

@router.get("/{chat_id}", response_model=List[schemas.MessageResponse])
def get_messages(chat_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id, models.Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = db.query(models.Message).filter(models.Message.chat_id == chat_id).order_by(models.Message.created_at.asc()).all()
    return messages

@router.post("/{chat_id}", response_model=schemas.MessageResponse)
def create_message(chat_id: int, message: schemas.MessageCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id, models.Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Save user message
    new_message = models.Message(chat_id=chat_id, role=message.role, content=message.content)
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Update chat updated_at
    chat.updated_at = func.now()
    db.commit()

    return new_message

from fastapi.responses import StreamingResponse
from ..database import SessionLocal

@router.post("/{chat_id}/generate")
def generate_message(chat_id: int, message: schemas.MessageCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    import time
    t_req = time.perf_counter()
    # Verify chat ownership first
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id, models.Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    async def stream_generator():
        import asyncio
        loop = asyncio.get_running_loop()
        queue = asyncio.Queue()
        
        def run_rag():
            gen_db = SessionLocal()
            try:
                # Save user message in background to save 800ms UI delay
                content_to_save = message.content
                if message.image:
                    content_to_save += f"\n\n![Uploaded Image](data:image/jpeg;base64,{message.image})"
                
                user_msg = models.Message(chat_id=chat_id, role=message.role, content=content_to_save)
                gen_db.add(user_msg)
                gen_db.commit()
                
                for chunk in generate_rag_response(current_user.id, message.content, db=gen_db, t_req=t_req, image=message.image):
                    asyncio.run_coroutine_threadsafe(queue.put(chunk), loop)
            except Exception as e:
                asyncio.run_coroutine_threadsafe(queue.put(e), loop)
            finally:
                gen_db.close()
                asyncio.run_coroutine_threadsafe(queue.put(None), loop)
                
        # Start the synchronous generator in a background thread
        import threading
        thread = threading.Thread(target=run_rag)
        thread.start()
        
        full_content = ""
        while True:
            chunk = await queue.get()
            if chunk is None:
                break
            if isinstance(chunk, Exception):
                raise chunk
            full_content += chunk
            yield chunk
            
        gen_db2 = SessionLocal()
        try:
            ai_msg = models.Message(chat_id=chat_id, role="ai", content=full_content)
            gen_db2.add(ai_msg)
            
            from sqlalchemy.sql import func
            chat_obj = gen_db2.query(models.Chat).filter(models.Chat.id == chat_id).first()
            if chat_obj:
                chat_obj.updated_at = func.now()
            
            gen_db2.commit()
        finally:
            gen_db2.close()
            
    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@router.put("/{chat_id}/{message_id}/regenerate")
def regenerate_message(chat_id: int, message_id: int, message: schemas.MessageCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id, models.Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    target_msg = db.query(models.Message).filter(models.Message.id == message_id, models.Message.chat_id == chat_id, models.Message.role == 'user').first()
    if not target_msg:
        raise HTTPException(status_code=404, detail="User message not found")
        
    # Delete all messages that came after this message
    db.query(models.Message).filter(models.Message.chat_id == chat_id, models.Message.id > message_id).delete()
    
    # Update target message content
    target_msg.content = message.content
    db.commit()
    
    def stream_generator():
        gen_db = SessionLocal()
        full_content = ""
        try:
            for chunk in generate_rag_response(current_user.id, message.content, db=gen_db):
                full_content += chunk
                yield chunk
                
            ai_msg = models.Message(chat_id=chat_id, role="ai", content=full_content)
            gen_db.add(ai_msg)
            
            chat_obj = gen_db.query(models.Chat).filter(models.Chat.id == chat_id).first()
            if chat_obj:
                chat_obj.updated_at = func.now()
                
            gen_db.commit()
        except Exception as e:
            yield f"\n\nError: {str(e)}"
        finally:
            gen_db.close()
            
    return StreamingResponse(stream_generator(), media_type="text/plain")
