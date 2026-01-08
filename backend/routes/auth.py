"""Routes d'authentification"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
import uuid
import logging

from database import db
from models import UserCreate
from utils.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, generate_reset_token, verify_reset_token
)
from services.email_service import send_welcome_email, send_password_reset_email
from config import ALLOWED_COUNTRIES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
async def register(user: UserCreate, background_tasks: BackgroundTasks):
    """Inscription d'un nouvel utilisateur"""
    # Vérifier le pays
    if user.country not in ALLOWED_COUNTRIES:
        raise HTTPException(
            status_code=400, 
            detail=f"Inscription non disponible pour {user.country}. Pays autorisés: {', '.join(ALLOWED_COUNTRIES)}"
        )
    
    # Vérifier si l'email existe
    existing = await db.users.find_one({"email": user.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Créer l'utilisateur
    user_data = {
        "id": str(uuid.uuid4()),
        "email": user.email.lower(),
        "password": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "is_professional": user.is_professional,
        "company_name": user.company_name,
        "siret": user.siret,
        "country": user.country,
        "credits": 1,  # 1 crédit gratuit à l'inscription
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_admin": False,
        "is_verified": False,
        "avatar": None,
        "bio": None,
        "website": None,
        "vacation_mode": False,
        "vacation_message": None,
        "loyalty_points": 0,
        "loyalty_tier": "bronze",
        "referral_code": str(uuid.uuid4())[:8].upper(),
        "referred_by": None,
    }
    
    await db.users.insert_one(user_data)
    
    # Email de bienvenue en arrière-plan
    background_tasks.add_task(send_welcome_email, user.email, user.name)
    
    # Créer le token
    token = create_access_token({"user_id": user_data["id"]})
    
    # Retourner sans le mot de passe
    del user_data["password"]
    user_data.pop("_id", None)
    
    logger.info(f"New user registered: {user.email}")
    
    return {"user": user_data, "token": token}

@router.post("/login")
async def login(credentials: dict):
    """Connexion utilisateur"""
    email = credentials.get("email", "").lower()
    password = credentials.get("password", "")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email et mot de passe requis")
    
    user = await db.users.find_one({"email": email})
    
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Vérifier mode vacances
    if user.get("vacation_mode"):
        logger.info(f"User {email} logged in (vacation mode active)")
    
    # Créer le token
    token = create_access_token({"user_id": user["id"]})
    
    # Retourner sans le mot de passe
    del user["password"]
    user.pop("_id", None)
    
    return {"user": user, "token": token}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Récupérer le profil de l'utilisateur connecté"""
    return current_user

@router.post("/forgot-password")
async def forgot_password(data: dict, background_tasks: BackgroundTasks):
    """Demande de réinitialisation de mot de passe"""
    email = data.get("email", "").lower()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")
    
    user = await db.users.find_one({"email": email})
    
    # Ne pas révéler si l'email existe ou non
    if user:
        reset_token = generate_reset_token(user["id"])
        
        # Sauvegarder le token
        await db.password_resets.insert_one({
            "user_id": user["id"],
            "token": reset_token,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "used": False
        })
        
        # Envoyer l'email en arrière-plan
        background_tasks.add_task(send_password_reset_email, email, reset_token)
        logger.info(f"Password reset requested for: {email}")
    
    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé"}

@router.post("/reset-password")
async def reset_password(data: dict):
    """Réinitialisation du mot de passe"""
    token = data.get("token", "")
    new_password = data.get("password", "")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token et nouveau mot de passe requis")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit faire au moins 6 caractères")
    
    # Vérifier le token
    user_id = verify_reset_token(token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")
    
    # Vérifier que le token n'a pas déjà été utilisé
    reset_record = await db.password_resets.find_one({"token": token, "used": False})
    if not reset_record:
        raise HTTPException(status_code=400, detail="Token déjà utilisé ou invalide")
    
    # Mettre à jour le mot de passe
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password": hash_password(new_password)}}
    )
    
    # Marquer le token comme utilisé
    await db.password_resets.update_one(
        {"token": token},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    logger.info(f"Password reset completed for user: {user_id}")
    
    return {"message": "Mot de passe réinitialisé avec succès"}

@router.post("/change-password")
async def change_password(data: dict, current_user: dict = Depends(get_current_user)):
    """Changement de mot de passe (utilisateur connecté)"""
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Mot de passe actuel et nouveau requis")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit faire au moins 6 caractères")
    
    # Vérifier le mot de passe actuel
    user = await db.users.find_one({"id": current_user["id"]})
    if not verify_password(current_password, user["password"]):
        raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")
    
    # Mettre à jour
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": hash_password(new_password)}}
    )
    
    return {"message": "Mot de passe modifié avec succès"}
