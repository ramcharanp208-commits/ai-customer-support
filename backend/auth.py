import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User

# Secret key for JWT signing — change this in production
SECRET_KEY = "supersecretkey123"
ALGORITHM  = "HS256"
TOKEN_EXPIRE_MINUTES = 60

# bcrypt password hashing
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# Hash a plain password
def hash_password(plain_password):
    return pwd_context.hash(plain_password)


# Check plain password against stored hash
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# Create a JWT token
def create_token(data: dict):
    payload = data.copy()
    expire  = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# Get the logged-in user from the token (used as a dependency in routes)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# Only allow customers (and above)
def require_customer(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["customer", "agent", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user


# Only allow agents (and admins)
def require_agent(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["agent", "admin"]:
        raise HTTPException(status_code=403, detail="Agents only")
    return current_user


# Only allow admins
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return current_user
