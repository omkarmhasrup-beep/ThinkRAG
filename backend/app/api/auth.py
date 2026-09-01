from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
import secrets
import hashlib
import smtplib
from email.message import EmailMessage
from .. import database, models
from ..schemas import schemas
from ..core.security import verify_password, get_password_hash, create_access_token, get_current_user
from ..core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    user.email = user.email.strip()
    user.username = user.username.strip()
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    db_user_username = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user_username:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(database.get_db)
):
    username_or_email = form_data.username.strip()
    from sqlalchemy import or_
    user = db.query(models.User).filter(
        or_(models.User.username == username_or_email, models.User.email == username_or_email)
    ).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user:
        # Generate token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        # Save to DB
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        reset_token = models.PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()
        
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        
        # Send Email
        if settings.SMTP_HOST and settings.SMTP_PORT and settings.SMTP_USERNAME and settings.SMTP_PASSWORD and settings.SMTP_FROM:
            try:
                msg = EmailMessage()
                msg.set_content(f"You requested a password reset. Click the link below to reset your password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email.")
                msg['Subject'] = 'Password Reset Request'
                msg['From'] = settings.SMTP_FROM
                msg['To'] = user.email

                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[EMAIL] Password reset email sent successfully to {user.email}")
            except Exception as e:
                print(f"[EMAIL ERROR] Failed to send email: {e}")
        else:
            # Fallback for development if SMTP is not configured
            print(f"\n========== PASSWORD RESET LINK (SMTP NOT CONFIGURED) ==========\n{reset_link}\n===============================================================\n")
        
    # Always return success to prevent email enumeration
    return {"message": "If an account with this email exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    # Hash the provided token
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    
    # Find the token
    reset_token = db.query(models.PasswordResetToken).filter(models.PasswordResetToken.token_hash == token_hash).first()
    
    if not reset_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
        
    if reset_token.used_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has already been used")
        
    if reset_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired")
        
    # Update password
    user = db.query(models.User).filter(models.User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
        
    user.password_hash = get_password_hash(request.new_password)
    reset_token.used_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": "Password successfully reset"}
