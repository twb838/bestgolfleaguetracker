from datetime import datetime, timedelta
from typing import Any, Optional
import os
import secrets

from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

# Generate a secure secret key if not provided
def get_secret_key() -> str:
    """Get secret key from environment or generate a secure one"""
    secret_key = os.getenv("SECRET_KEY")
    
    if not secret_key:
        # Generate a secure random key if none is provided
        secret_key = secrets.token_urlsafe(32)
        print("WARNING: No SECRET_KEY found in environment. Generated a temporary one.")
        print("Please set SECRET_KEY in your environment variables for production!")
    
    return secret_key

SECRET_KEY = get_secret_key()
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT token for the user"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    print(f"Creating token for subject: {subject} with expiry: {expire}")  # Debug log
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Token created successfully")  # Debug log
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    result = pwd_context.verify(plain_password, hashed_password)
    print(f"Password verification result: {result}")  # Debug log
    return result

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)