"""
Routes pour la gestion des reversements vendeurs
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from pydantic import BaseModel
from typing import List, Optional, Callable
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payouts", tags=["payouts"])

# Ces variables seront injectées par server.py
db = None
_get_current_user_func = None
payout_service = None


def set_dependencies(_db, _get_current_user, _payout_service):
    """Injection des dépendances depuis server.py"""
    global db, _get_current_user_func, payout_service
    db = _db
    _get_current_user_func = _get_current_user
    payout_service = _payout_service


async def get_current_user_dep(request: Request):
    """Wrapper pour appeler la fonction get_current_user injectée"""
    if _get_current_user_func is None:
        raise HTTPException(status_code=500, detail="Auth not configured")
    return await _get_current_user_func(request)


class PayoutRequest(BaseModel):
    seller_id: str
    order_ids: Optional[List[str]] = None


class ConfirmBankTransferRequest(BaseModel):
    payout_id: str
    reference: Optional[str] = None


class BatchPayoutRequest(BaseModel):
    seller_ids: List[str]


# ================== ADMIN ROUTES ==================

@router.get("/pending")
async def get_pending_payouts(current_user: dict = Depends(get_current_user_dep)):
    """Récupérer tous les reversements en attente"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    orders = await payout_service.get_pending_payouts()
    
    # Grouper par vendeur
    sellers = {}
    for order in orders:
        seller_id = order.get("seller_id")
        if seller_id not in sellers:
            seller = await db.users.find_one(
                {"id": seller_id}, 
                {"_id": 0, "name": 1, "email": 1, "company_name": 1, "iban": 1, "bic": 1, "stripe_account_id": 1}
            )
            sellers[seller_id] = {
                "seller_id": seller_id,
                "seller": seller,
                "total_amount": 0,
                "orders_count": 0,
                "orders": [],
                "has_stripe_connect": bool(seller.get("stripe_account_id") if seller else False),
                "has_bank_details": bool(seller.get("iban") if seller else False)
            }
        
        sellers[seller_id]["total_amount"] += order.get("seller_amount", 0)
        sellers[seller_id]["orders_count"] += 1
        sellers[seller_id]["orders"].append({
            "id": order.get("id"),
            "listing_title": order.get("listing_title"),
            "seller_amount": order.get("seller_amount"),
            "paid_at": order.get("paid_at")
        })
    
    return {
        "sellers": list(sellers.values()),
        "total_pending": sum(s["total_amount"] for s in sellers.values()),
        "total_orders": sum(s["orders_count"] for s in sellers.values())
    }


@router.post("/process")
async def process_payout(request: PayoutRequest, current_user: dict = Depends(lambda: get_current_user)):
    """Traiter le reversement pour un vendeur spécifique"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    # Essayer d'abord Stripe Connect
    result = await payout_service.process_stripe_connect_payout(request.seller_id, request.order_ids)
    
    if result.get("success"):
        return result
    
    # Si pas de Stripe Connect, créer une demande de virement bancaire
    if result.get("fallback") == "bank_transfer":
        bank_result = await payout_service.create_bank_transfer_request(request.seller_id, request.order_ids)
        return bank_result
    
    raise HTTPException(status_code=400, detail=result.get("error", "Erreur lors du reversement"))


@router.post("/process-batch")
async def process_batch_payouts(
    request: BatchPayoutRequest, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(lambda: get_current_user)
):
    """Traiter les reversements pour plusieurs vendeurs en arrière-plan"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    async def process_all():
        results = {"success": [], "errors": []}
        for seller_id in request.seller_ids:
            result = await payout_service.process_stripe_connect_payout(seller_id)
            if result.get("success"):
                results["success"].append(seller_id)
            elif result.get("fallback") == "bank_transfer":
                bank_result = await payout_service.create_bank_transfer_request(seller_id)
                if bank_result.get("success"):
                    results["success"].append(seller_id)
                else:
                    results["errors"].append({"seller_id": seller_id, "error": bank_result.get("error")})
            else:
                results["errors"].append({"seller_id": seller_id, "error": result.get("error")})
        
        logger.info(f"Batch payout completed: {len(results['success'])} success, {len(results['errors'])} errors")
    
    background_tasks.add_task(process_all)
    
    return {
        "message": f"Traitement de {len(request.seller_ids)} reversements lancé en arrière-plan",
        "seller_ids": request.seller_ids
    }


@router.get("/bank-transfers/pending")
async def get_pending_bank_transfers(current_user: dict = Depends(lambda: get_current_user)):
    """Récupérer les virements bancaires en attente de confirmation"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    transfers = await payout_service.get_pending_bank_transfers()
    return {"transfers": transfers, "count": len(transfers)}


@router.post("/bank-transfers/confirm")
async def confirm_bank_transfer(
    request: ConfirmBankTransferRequest, 
    current_user: dict = Depends(lambda: get_current_user)
):
    """Confirmer qu'un virement bancaire a été effectué"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    result = await payout_service.confirm_bank_transfer(
        request.payout_id, 
        current_user["id"], 
        request.reference
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result


@router.post("/auto-process")
async def trigger_auto_payouts(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(lambda: get_current_user)
):
    """Déclencher le traitement automatique de tous les reversements éligibles"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    background_tasks.add_task(payout_service.process_auto_payouts)
    
    return {"message": "Traitement automatique des reversements lancé en arrière-plan"}


@router.get("/history")
async def get_payout_history(
    seller_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(lambda: get_current_user)
):
    """Récupérer l'historique des reversements"""
    # Les vendeurs ne peuvent voir que leurs propres reversements
    if not current_user.get("is_admin"):
        seller_id = current_user["id"]
    
    history = await payout_service.get_payout_history(seller_id, limit)
    return {"payouts": history, "count": len(history)}


@router.get("/stats")
async def get_payout_stats(current_user: dict = Depends(lambda: get_current_user)):
    """Statistiques des reversements"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    # Total reversé
    completed_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": None,
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    completed = await db.payouts.aggregate(completed_pipeline).to_list(1)
    completed_stats = completed[0] if completed else {"total_amount": 0, "count": 0}
    
    # En attente
    pending_pipeline = [
        {"$match": {"status": "pending_transfer"}},
        {"$group": {
            "_id": None,
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    pending = await db.payouts.aggregate(pending_pipeline).to_list(1)
    pending_stats = pending[0] if pending else {"total_amount": 0, "count": 0}
    
    # Par méthode
    by_method_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": "$method",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    by_method = await db.payouts.aggregate(by_method_pipeline).to_list(10)
    
    return {
        "completed": {
            "amount": completed_stats.get("total_amount", 0),
            "count": completed_stats.get("count", 0)
        },
        "pending_transfers": {
            "amount": pending_stats.get("total_amount", 0),
            "count": pending_stats.get("count", 0)
        },
        "by_method": {item["_id"]: {"amount": item["total"], "count": item["count"]} for item in by_method}
    }


# ================== SELLER ROUTES ==================

@router.get("/my-payouts")
async def get_my_payouts(current_user: dict = Depends(lambda: get_current_user)):
    """Récupérer mes reversements (pour vendeur)"""
    history = await payout_service.get_payout_history(current_user["id"], 50)
    pending = await payout_service.get_seller_pending_total(current_user["id"])
    
    return {
        "payouts": history,
        "pending": {
            "amount": pending.get("total_amount", 0),
            "orders_count": pending.get("orders_count", 0)
        }
    }
