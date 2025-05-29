from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.security import ALGORITHM, SECRET_KEY
from app.db.session import SessionLocal
from app import schemas
from app.crud import user as user_crud
from app.models.user import User
from app.schemas.user import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    print(f"Received token: {token[:20]}..." if token else "No token received")  # Debug log
    
    try:
        print(f"Attempting to decode token with SECRET_KEY: {SECRET_KEY[:10]}...")  # Debug log
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Token payload: {payload}")  # Debug log
        token_data = TokenPayload(**payload)
        print(f"Token data parsed: sub={token_data.sub}")  # Debug log
    except JWTError as e:
        print(f"JWT Error: {e}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    except ValidationError as e:
        print(f"Validation Error: {e}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    if token_data.sub is None:
        print("Token subject is None")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    print(f"Looking up user with ID: {token_data.sub}")  # Debug log
    user = user_crud.get(db, user_id=int(token_data.sub))
    
    if not user:
        print(f"User not found with ID: {token_data.sub}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    print(f"User found: {user.username} (ID: {user.id})")  # Debug log
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not user_crud.is_active(current_user):
        print(f"User {current_user.username} is not active")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not user_crud.is_superuser(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user