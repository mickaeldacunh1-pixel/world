"""
Routes pour la gestion des annonces (listings)
Module extrait de server.py pour améliorer la maintenabilité

IMPORTANT: Ce module est préparé mais pas encore activé dans server.py
Pour l'activer, ajouter dans server.py:
    from routes.listings import router as listings_router
    app.include_router(listings_router, prefix="/api")
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging

from database import db
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Listings"])


# ================== LECTURE (GET) ==================

@router.get("/listings")
async def get_listings(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    brand: Optional[str] = None,
    model: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    condition: Optional[str] = None,
    postal_code: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    compatible_brand: Optional[str] = None,
    oem_reference: Optional[str] = None,
    sort: str = "recent",
    page: int = 1,
    limit: int = 20
):
    """
    Récupérer la liste des annonces avec filtres et pagination
    
    - category: Catégorie (pieces, voitures, motos, etc.)
    - subcategory: Sous-catégorie
    - brand: Marque du véhicule/pièce
    - model: Modèle
    - min_price/max_price: Fourchette de prix
    - min_year/max_year: Fourchette d'années
    - condition: État (neuf, occasion, reconditionne)
    - postal_code: Filtrer par code postal (2 premiers chiffres)
    - region: Région française
    - search: Recherche textuelle
    - compatible_brand: Filtrer par marque compatible
    - oem_reference: Recherche par référence OEM/équipementier
    - sort: Tri (recent, price_asc, price_desc, views)
    - page: Numéro de page
    - limit: Nombre par page
    """
    query = {"status": "active"}
    
    # Filtres de base
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if brand:
        query["brand"] = {"$regex": brand, "$options": "i"}
    if model:
        query["model"] = {"$regex": model, "$options": "i"}
    if condition:
        query["condition"] = condition
    if region:
        query["region"] = region
    if compatible_brand:
        query["compatible_brands"] = compatible_brand
    
    # Filtres de prix
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    # Filtres d'année
    if min_year is not None:
        query["year"] = {"$gte": min_year}
    if max_year is not None:
        query.setdefault("year", {})["$lte"] = max_year
    
    # Filtre par code postal (département)
    if postal_code:
        query["postal_code"] = {"$regex": f"^{postal_code[:2]}"}
    
    # Recherche par référence OEM
    if oem_reference:
        query["$or"] = query.get("$or", []) + [
            {"oem_reference": {"$regex": oem_reference, "$options": "i"}},
            {"aftermarket_reference": {"$regex": oem_reference, "$options": "i"}}
        ]
    
    # Recherche textuelle
    if search:
        search_conditions = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"oem_reference": {"$regex": search, "$options": "i"}},
            {"aftermarket_reference": {"$regex": search, "$options": "i"}}
        ]
        if "$or" in query:
            query["$and"] = [{"$or": query.pop("$or")}, {"$or": search_conditions}]
        else:
            query["$or"] = search_conditions
    
    # Options de tri (boosted en premier)
    sort_options = {
        "recent": [("is_boosted", -1), ("created_at", -1)],
        "price_asc": [("is_boosted", -1), ("price", 1)],
        "price_desc": [("is_boosted", -1), ("price", -1)],
        "views": [("is_boosted", -1), ("views", -1)]
    }
    
    # Pagination
    skip = (page - 1) * limit
    cursor = db.listings.find(query, {"_id": 0}).sort(
        sort_options.get(sort, [("created_at", -1)])
    ).skip(skip).limit(limit)
    listings = await cursor.to_list(limit)
    
    total = await db.listings.count_documents(query)
    
    return {
        "listings": listings,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/listings/featured")
async def get_featured_listings(limit: int = 8):
    """
    Récupérer les annonces mises en avant
    Priorité: boosted > récentes avec bonnes vues
    """
    # D'abord les annonces boostées
    boosted = await db.listings.find(
        {"status": "active", "is_boosted": True},
        {"_id": 0}
    ).sort("boosted_at", -1).limit(limit).to_list(limit)
    
    if len(boosted) >= limit:
        return boosted
    
    # Compléter avec des annonces populaires récentes
    remaining = limit - len(boosted)
    boosted_ids = [l["id"] for l in boosted]
    
    popular = await db.listings.find(
        {"status": "active", "id": {"$nin": boosted_ids}},
        {"_id": 0}
    ).sort([("views", -1), ("created_at", -1)]).limit(remaining).to_list(remaining)
    
    return boosted + popular


@router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    """
    Récupérer une annonce par son ID
    Incrémente automatiquement le compteur de vues
    """
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Incrémenter les vues
    await db.listings.update_one({"id": listing_id}, {"$inc": {"views": 1}})
    listing["views"] = listing.get("views", 0) + 1
    
    # Vérifier si le vendeur a Stripe Connect configuré
    seller = await db.users.find_one(
        {"id": listing.get("seller_id")}, 
        {"_id": 0, "stripe_connected": 1}
    )
    listing["seller_stripe_connected"] = seller.get("stripe_connected", False) if seller else False
    
    # Vérifier si le vendeur est vérifié (5+ ventes, note >= 4.0)
    sold_count = await db.listings.count_documents({
        "seller_id": listing.get("seller_id"), 
        "status": "sold"
    })
    reviews = await db.reviews.find(
        {"seller_id": listing.get("seller_id")}, 
        {"_id": 0, "rating": 1}
    ).to_list(100)
    avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 5
    listing["seller_is_verified"] = sold_count >= 5 and avg_rating >= 4.0
    
    # Compteur de visiteurs actifs (5 dernières minutes)
    five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    viewers_count = await db.listing_viewers.count_documents({
        "listing_id": listing_id,
        "last_seen": {"$gte": five_min_ago}
    })
    listing["active_viewers"] = viewers_count
    
    return listing


@router.get("/listings/{listing_id}/price-history")
async def get_price_history(listing_id: str):
    """
    Récupérer l'historique des prix d'une annonce
    Retourne la timeline complète avec prix initial et modifications
    """
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Récupérer l'historique
    history = await db.price_history.find(
        {"listing_id": listing_id}, 
        {"_id": 0}
    ).sort("changed_at", 1).to_list(100)
    
    # Construire la timeline
    timeline = []
    
    # Prix initial (création de l'annonce)
    timeline.append({
        "price": listing.get("price"),
        "date": listing.get("created_at"),
        "type": "initial"
    })
    
    # Modifications de prix
    for entry in history:
        timeline.append({
            "price": entry["new_price"],
            "date": entry["changed_at"],
            "type": "change",
            "old_price": entry["old_price"]
        })
    
    return {
        "listing_id": listing_id,
        "current_price": listing.get("price"),
        "initial_price": listing.get("price") if not history else history[0]["old_price"],
        "timeline": timeline,
        "total_changes": len(history)
    }


@router.post("/listings/{listing_id}/view")
async def track_listing_view(listing_id: str, request: Request):
    """
    Tracker un visiteur sur une annonce (pour preuve sociale)
    Utilisé pour afficher "X personnes regardent cette annonce"
    """
    visitor_id = request.headers.get("X-Visitor-ID", str(uuid.uuid4()))
    
    # Upsert du record visiteur
    await db.listing_viewers.update_one(
        {"listing_id": listing_id, "visitor_id": visitor_id},
        {"$set": {"last_seen": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    # Compter les visiteurs actifs
    five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    viewers_count = await db.listing_viewers.count_documents({
        "listing_id": listing_id,
        "last_seen": {"$gte": five_min_ago}
    })
    
    return {"viewers": viewers_count}


@router.get("/my-listings")
async def get_my_listings(current_user: dict = Depends(get_current_user)):
    """
    Récupérer les annonces de l'utilisateur connecté
    """
    cursor = db.listings.find(
        {"seller_id": current_user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1)
    listings = await cursor.to_list(100)
    return listings


# ================== ÉCRITURE (POST/PUT/DELETE) - À ACTIVER PLUS TARD ==================
# Ces fonctions sont préparées mais commentées pour éviter les conflits avec server.py
# Décommenter après avoir commenté les versions dans server.py

# @router.post("/listings")
# async def create_listing(...):
#     pass

# @router.put("/listings/{listing_id}")  
# async def update_listing(...):
#     pass

# @router.delete("/listings/{listing_id}")
# async def delete_listing(...):
#     pass
