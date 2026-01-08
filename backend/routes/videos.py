"""Routes pour les fonctionnalités vidéo"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import stripe
import logging

from database import db
from utils.auth import get_current_user
from config import STRIPE_API_KEY, SITE_URL
from models import VIDEO_PACKAGE_PRICES, VIDEO_BOOST_PRICES

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Videos"])

@router.get("/listings/videos")
async def get_video_listings(
    page: int = 1,
    limit: int = 12,
    category: Optional[str] = None,
    sort: str = "recent",
    search: Optional[str] = None
):
    """Get all listings that have videos"""
    query = {
        "status": "active",
        "video_url": {"$exists": True, "$ne": None, "$ne": ""}
    }
    
    if category and category != "all":
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
    
    # Sort options
    sort_options = {
        "recent": [("created_at", -1)],
        "popular": [("views", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)]
    }
    sort_field = sort_options.get(sort, [("created_at", -1)])
    
    skip = (page - 1) * limit
    
    # Get listings
    listings = await db.listings.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(limit + 1).to_list(limit + 1)
    
    has_more = len(listings) > limit
    listings = listings[:limit]
    
    # Enrich with user info
    now = datetime.now(timezone.utc).isoformat()
    for listing in listings:
        user = await db.users.find_one({"id": listing.get("user_id")}, {"_id": 0, "password": 0})
        listing["user"] = user
        # Check if video boost is active
        boost_end = listing.get("video_boost_end")
        listing["video_boost_active"] = boost_end and boost_end > now
    
    return {"listings": listings, "has_more": has_more, "page": page}

@router.get("/videos/featured")
async def get_featured_videos(limit: int = 6):
    """Get videos that are currently boosted/featured"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Get boosted videos first
    boosted = await db.listings.find({
        "status": "active",
        "video_url": {"$exists": True, "$ne": None, "$ne": ""},
        "video_boost_end": {"$gt": now}
    }, {"_id": 0}).sort("video_boost_end", 1).to_list(limit)
    
    # Mark as boosted
    for listing in boosted:
        listing["video_boost_active"] = True
        user = await db.users.find_one({"id": listing.get("user_id")}, {"_id": 0, "password": 0})
        listing["user"] = user
    
    # If not enough boosted, fill with recent videos
    if len(boosted) < limit:
        remaining = limit - len(boosted)
        boosted_ids = [l["id"] for l in boosted]
        
        recent = await db.listings.find({
            "status": "active",
            "video_url": {"$exists": True, "$ne": None, "$ne": ""},
            "id": {"$nin": boosted_ids}
        }, {"_id": 0}).sort("created_at", -1).to_list(remaining)
        
        for listing in recent:
            listing["video_boost_active"] = False
            user = await db.users.find_one({"id": listing.get("user_id")}, {"_id": 0, "password": 0})
            listing["user"] = user
        
        boosted.extend(recent)
    
    return boosted

@router.get("/videos/homepage-showcase")
async def get_homepage_showcase_videos(limit: int = 5):
    """Get videos for the homepage showcase player - prioritize boosted"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Get boosted videos first
    boosted = await db.listings.find({
        "status": "active",
        "video_url": {"$exists": True, "$ne": None, "$ne": ""},
        "video_boost_end": {"$gt": now}
    }, {"_id": 0}).sort([("video_boost_priority", -1), ("video_boost_end", 1)]).to_list(limit)
    
    for listing in boosted:
        listing["video_boost_active"] = True
        user = await db.users.find_one({"id": listing.get("user_id")}, {"_id": 0, "password": 0})
        listing["user"] = user
    
    # Fill with recent if needed
    if len(boosted) < limit:
        remaining = limit - len(boosted)
        boosted_ids = [l["id"] for l in boosted]
        
        recent = await db.listings.find({
            "status": "active",
            "video_url": {"$exists": True, "$ne": None, "$ne": ""},
            "id": {"$nin": boosted_ids}
        }, {"_id": 0}).sort("views", -1).to_list(remaining)
        
        for listing in recent:
            listing["video_boost_active"] = False
            user = await db.users.find_one({"id": listing.get("user_id")}, {"_id": 0, "password": 0})
            listing["user"] = user
        
        boosted.extend(recent)
    
    return boosted

@router.post("/video/boost/checkout")
async def create_video_boost_checkout(
    listing_id: str,
    duration: str = "1h",
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for video boost"""
    stripe.api_key = STRIPE_API_KEY
    
    # Verify listing exists and belongs to user
    listing = await db.listings.find_one({"id": listing_id, "user_id": current_user["id"]})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    if not listing.get("video_url"):
        raise HTTPException(status_code=400, detail="Cette annonce n'a pas de vidéo")
    
    price = VIDEO_BOOST_PRICES.get(duration, 0.50)
    duration_text = "1 heure" if duration == "1h" else "24 heures"
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'Boost Vidéo - {duration_text}',
                        'description': f'Mise en avant de votre vidéo sur la page d\'accueil pendant {duration_text}',
                    },
                    'unit_amount': int(price * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{SITE_URL}/tableau-de-bord?video_boost_success=true",
            cancel_url=f"{SITE_URL}/tableau-de-bord?video_boost_cancelled=true",
            metadata={
                "user_id": current_user["id"],
                "listing_id": listing_id,
                "type": "video_boost",
                "boost_duration": duration
            },
            customer_email=current_user.get("email")
        )
        
        return {"checkout_url": checkout_session.url}
        
    except Exception as e:
        logger.error(f"Stripe video boost checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video/package/checkout")
async def create_video_package_checkout(
    package: str = "intermediate",
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for video package (intermediate or pro)"""
    stripe.api_key = STRIPE_API_KEY
    
    if package not in ["extended", "intermediate", "pro"]:
        raise HTTPException(status_code=400, detail="Forfait invalide")
    
    price = VIDEO_PACKAGE_PRICES.get(package, 2.99)
    
    package_details = {
        "extended": {
            "name": "Forfait Vidéo Étendue",
            "description": "Vidéo jusqu'à 2 minutes et 100 Mo",
            "duration": 120,
            "size_mb": 100
        },
        "intermediate": {
            "name": "Forfait Vidéo Intermédiaire",
            "description": "Vidéo jusqu'à 3 minutes et 150 Mo",
            "duration": 180,
            "size_mb": 150
        },
        "pro": {
            "name": "Forfait Vidéo PRO Présentation",
            "description": "Vidéo jusqu'à 10 minutes et 500 Mo - Idéal pour présentations détaillées",
            "duration": 600,
            "size_mb": 500
        }
    }
    
    details = package_details[package]
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': details["name"],
                        'description': details["description"],
                    },
                    'unit_amount': int(price * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{SITE_URL}/deposer?video_package_success={package}",
            cancel_url=f"{SITE_URL}/deposer?video_package_cancelled=true",
            metadata={
                "user_id": current_user["id"],
                "type": "video_package",
                "package": package,
                "duration": details["duration"],
                "size_mb": details["size_mb"]
            },
            customer_email=current_user.get("email")
        )
        
        return {"checkout_url": checkout_session.url}
        
    except Exception as e:
        logger.error(f"Stripe video package checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/me/video-packages")
async def get_user_video_packages(current_user: dict = Depends(get_current_user)):
    """Get user's available video packages/credits"""
    return {
        "extended_credits": current_user.get("extended_video_credits", 0),
        "intermediate_credits": current_user.get("intermediate_video_credits", 0),
        "pro_credits": current_user.get("pro_video_credits", 0),
        "is_professional": current_user.get("is_professional", False),
        "limits": {
            "standard": {"duration": 30, "size_mb": 30},
            "extended": {"duration": 120, "size_mb": 100},
            "intermediate": {"duration": 180, "size_mb": 150},
            "pro": {"duration": 600, "size_mb": 500}
        }
    }
