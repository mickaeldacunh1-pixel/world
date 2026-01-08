"""Utilitaires d'authentification"""
import bcrypt
import jwt
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import JWT_SECRET, JWT_ALGORITHM

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Vérifie un mot de passe contre son hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[Dict]:
    """Décode un token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None

async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[Dict]:
    """Récupère l'utilisateur courant si authentifié (optionnel)"""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        return None
    
    user_id = payload.get("user_id")
    if not user_id:
        return None
    
    # Import here to avoid circular import
    from database import db
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return user

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """Récupère l'utilisateur courant (obligatoire)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Import here to avoid circular import
    from database import db
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

async def get_admin_user(current_user: Dict = Depends(get_current_user)) -> Dict:
    """Vérifie que l'utilisateur est admin"""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def generate_reset_token(user_id: str) -> str:
    """Génère un token de réinitialisation de mot de passe"""
    return create_access_token(
        {"user_id": user_id, "type": "password_reset"},
        expires_delta=timedelta(hours=1)
    )

def verify_reset_token(token: str) -> Optional[str]:
    """Vérifie un token de réinitialisation et retourne le user_id"""
    payload = decode_token(token)
    
    if not payload:
        return None
    
    if payload.get("type") != "password_reset":
        return None
    
    return payload.get("user_id")
