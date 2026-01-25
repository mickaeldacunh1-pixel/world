"""
Routes pour la gestion des commandes (orders)
Module extrait de server.py pour améliorer la maintenabilité

IMPORTANT: Ce module est préparé mais pas encore activé dans server.py
Pour l'activer, ajouter dans server.py:
    from routes.orders import router as orders_router
    app.include_router(orders_router, prefix="/api")
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timezone
import logging

from database import db
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Orders"])


# ================== LECTURE (GET) ==================

@router.get("/orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    """
    Récupérer mes commandes (achats et ventes)
    
    Returns:
        Liste des commandes avec le rôle de l'utilisateur (buyer/seller)
    """
    cursor = db.orders.find(
        {"$or": [{"buyer_id": current_user["id"]}, {"seller_id": current_user["id"]}]},
        {"_id": 0}
    ).sort("created_at", -1)
    orders = await cursor.to_list(100)
    
    # Ajouter l'info du rôle
    for order in orders:
        order["role"] = "buyer" if order["buyer_id"] == current_user["id"] else "seller"
    
    return orders


@router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """
    Récupérer une commande spécifique
    
    Args:
        order_id: ID de la commande
        
    Returns:
        Détails de la commande
    """
    order = await db.orders.find_one(
        {"id": order_id, "$or": [{"buyer_id": current_user["id"]}, {"seller_id": current_user["id"]}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    order["role"] = "buyer" if order["buyer_id"] == current_user["id"] else "seller"
    return order


@router.get("/marketplace/orders")
async def get_marketplace_orders(current_user: dict = Depends(get_current_user)):
    """
    Récupérer les commandes pour le marketplace (ventes de l'utilisateur)
    Utilisé dans le tableau de bord vendeur
    """
    cursor = db.orders.find(
        {"seller_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1)
    orders = await cursor.to_list(100)
    return orders


# ================== STATISTIQUES ==================

@router.get("/orders/stats/summary")
async def get_orders_summary(current_user: dict = Depends(get_current_user)):
    """
    Récupérer un résumé des commandes de l'utilisateur
    
    Returns:
        Statistiques: total achats, total ventes, en attente, livrées
    """
    # Achats
    purchases = await db.orders.count_documents({"buyer_id": current_user["id"]})
    purchases_delivered = await db.orders.count_documents({
        "buyer_id": current_user["id"], 
        "status": "delivered"
    })
    purchases_pending = await db.orders.count_documents({
        "buyer_id": current_user["id"], 
        "status": {"$nin": ["delivered", "cancelled", "refunded"]}
    })
    
    # Ventes
    sales = await db.orders.count_documents({"seller_id": current_user["id"]})
    sales_delivered = await db.orders.count_documents({
        "seller_id": current_user["id"], 
        "status": "delivered"
    })
    sales_pending = await db.orders.count_documents({
        "seller_id": current_user["id"], 
        "status": {"$nin": ["delivered", "cancelled", "refunded"]}
    })
    
    # Calcul du CA total
    pipeline = [
        {"$match": {"seller_id": current_user["id"], "status": "delivered"}},
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$total_amount", "$price"]}}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "purchases": {
            "total": purchases,
            "delivered": purchases_delivered,
            "pending": purchases_pending
        },
        "sales": {
            "total": sales,
            "delivered": sales_delivered,
            "pending": sales_pending,
            "revenue": total_revenue
        }
    }


# ================== DOCUMENTS PDF ==================
# Note: Ces routes nécessitent BordereauGenerator qui est dans server.py
# Elles seront activées quand BordereauGenerator sera extrait dans un service

# @router.get("/orders/{order_id}/shipping-slip")
# async def download_shipping_slip(order_id: str, current_user: dict = Depends(get_current_user)):
#     """Télécharger le bordereau d'expédition PDF"""
#     pass

# @router.get("/orders/{order_id}/invoice")
# async def download_invoice(order_id: str, current_user: dict = Depends(get_current_user)):
#     """Télécharger la facture PDF"""
#     pass


# ================== ÉCRITURE (POST/PUT/DELETE) - À ACTIVER PLUS TARD ==================
# Ces fonctions sont préparées mais commentées pour éviter les conflits avec server.py

# @router.post("/orders")
# async def create_order(...):
#     """Créer une commande pour un article"""
#     pass

# @router.post("/orders/checkout")
# async def checkout_cart(...):
#     """Créer plusieurs commandes depuis le panier (checkout groupé)"""
#     pass

# @router.put("/orders/{order_id}/status")
# async def update_order_status(...):
#     """Mettre à jour le statut d'une commande"""
#     pass

# @router.post("/orders/{order_id}/return")
# async def request_return(...):
#     """Demander un retour pour une commande"""
#     pass
