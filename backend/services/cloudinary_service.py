"""Service Cloudinary pour upload d'images et vidéos"""
import logging
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

# Limites vidéo
VIDEO_FREE_LIMIT = {
    "max_duration": 30,  # seconds
    "max_size_mb": 30,
    "max_count": 1
}

VIDEO_EXTENDED_LIMIT = {
    "max_duration": 120,  # 2 minutes
    "max_size_mb": 100,
    "max_count": 1
}

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]
MAX_IMAGE_SIZE_MB = 10


async def upload_image(file: UploadFile, folder: str = "worldauto") -> dict:
    """
    Upload une image vers Cloudinary
    
    Args:
        file: Fichier uploadé
        folder: Dossier de destination sur Cloudinary
        
    Returns:
        dict avec url, public_id, width, height
    """
    # Valider le type de fichier
    file_ext = file.filename.lower().split('.')[-1] if file.filename else ''
    is_heic = file_ext in ['heic', 'heif']
    
    if file.content_type not in ALLOWED_IMAGE_TYPES and not is_heic:
        raise HTTPException(
            status_code=400, 
            detail="Type de fichier non supporté. Utilisez JPG, PNG, WebP, GIF ou HEIC."
        )
    
    # Lire le contenu
    contents = await file.read()
    
    # Vérifier la taille
    if len(contents) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400, 
            detail=f"L'image est trop volumineuse. Maximum {MAX_IMAGE_SIZE_MB}MB."
        )
    
    try:
        # Upload avec transformations
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image",
            transformation=[
                {"angle": "exif"},  # Auto-fix orientation
                {"width": 1200, "height": 900, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"}  # Auto-convert HEIC to JPG
            ]
        )
        
        logger.info(f"Image uploaded: {result['public_id']}")
        
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height")
        }
    except cloudinary.exceptions.Error as e:
        logger.error(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload de l'image")


async def delete_image(public_id: str) -> dict:
    """
    Supprime une image de Cloudinary
    
    Args:
        public_id: ID public de l'image sur Cloudinary
        
    Returns:
        dict avec status et result
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        logger.info(f"Image deleted: {public_id}")
        return {"status": "success", "result": result}
    except cloudinary.exceptions.Error as e:
        logger.error(f"Cloudinary delete error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression de l'image")


async def upload_video(file: UploadFile, user: dict, folder: str = "worldauto_videos") -> dict:
    """
    Upload une vidéo vers Cloudinary avec limites selon le plan utilisateur
    
    Args:
        file: Fichier vidéo uploadé
        user: Dictionnaire utilisateur pour vérifier les droits
        folder: Dossier de destination
        
    Returns:
        dict avec url, public_id, duration, etc.
    """
    if not file.content_type or not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une vidéo")
    
    # Vérifier si l'utilisateur a des crédits vidéo étendus
    has_extended = user.get("extended_video_credits", 0) > 0 or user.get("is_professional", False)
    
    # Définir les limites selon le plan
    if has_extended:
        max_size = VIDEO_EXTENDED_LIMIT["max_size_mb"] * 1024 * 1024
        max_duration = VIDEO_EXTENDED_LIMIT["max_duration"]
        limit_label = "2 minutes / 100 Mo"
    else:
        max_size = VIDEO_FREE_LIMIT["max_size_mb"] * 1024 * 1024
        max_duration = VIDEO_FREE_LIMIT["max_duration"]
        limit_label = "30 secondes / 30 Mo"
    
    # Lire et vérifier la taille
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400, 
            detail=f"Vidéo trop volumineuse. Limite: {limit_label}. Achetez l'option vidéo étendue pour 1€."
        )
    
    try:
        # Upload vers Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            resource_type="video",
            folder=folder,
            transformation=[
                {"width": 1280, "height": 720, "crop": "limit"},
                {"quality": "auto:good"}
            ],
            eager=[
                {"width": 640, "height": 360, "crop": "limit", "format": "mp4"}
            ],
            eager_async=True
        )
        
        # Vérifier la durée
        duration = result.get("duration", 0)
        if duration > max_duration:
            # Supprimer la vidéo trop longue
            cloudinary.uploader.destroy(result["public_id"], resource_type="video")
            raise HTTPException(
                status_code=400,
                detail=f"Vidéo trop longue ({int(duration)}s). Limite: {max_duration}s."
            )
        
        logger.info(f"Video uploaded: {result['public_id']} ({duration}s)")
        
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "duration": duration,
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
            "thumbnail_url": result.get("secure_url", "").replace("/upload/", "/upload/so_0/")
        }
    except cloudinary.exceptions.Error as e:
        logger.error(f"Cloudinary video upload error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload de la vidéo")


async def delete_video(public_id: str) -> dict:
    """
    Supprime une vidéo de Cloudinary
    
    Args:
        public_id: ID public de la vidéo sur Cloudinary
        
    Returns:
        dict avec status et result
    """
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="video")
        logger.info(f"Video deleted: {public_id}")
        return {"status": "success", "result": result}
    except cloudinary.exceptions.Error as e:
        logger.error(f"Cloudinary video delete error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression de la vidéo")
