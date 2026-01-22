"""
Service d'automatisation des reversements vendeurs
Gère les virements automatiques via Stripe ou SEPA
"""

import os
import uuid
import logging
import stripe
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
PAYOUT_DELAY_DAYS = int(os.environ.get('PAYOUT_DELAY_DAYS', '7'))  # Délai avant reversement (protection acheteur)
AUTO_PAYOUT_ENABLED = os.environ.get('AUTO_PAYOUT_ENABLED', 'false').lower() == 'true'
MIN_PAYOUT_AMOUNT = float(os.environ.get('MIN_PAYOUT_AMOUNT', '10.0'))  # Montant minimum pour un reversement


class PayoutService:
    """Service de gestion des reversements automatiques"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        stripe.api_key = STRIPE_API_KEY
    
    async def get_pending_payouts(self, min_days_old: int = None) -> List[Dict]:
        """
        Récupérer les commandes éligibles au reversement
        - Statut: paid ou delivered
        - Pas encore reversées (payout_status = pending)
        - Plus vieilles que le délai de protection
        """
        if min_days_old is None:
            min_days_old = PAYOUT_DELAY_DAYS
        
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=min_days_old)).isoformat()
        
        query = {
            "payment_method": "stripe_direct",
            "status": {"$in": ["paid", "delivered", "completed"]},
            "payout_status": {"$in": ["pending", None]},
            "paid_at": {"$lt": cutoff_date}
        }
        
        cursor = self.db.orders.find(query, {"_id": 0})
        orders = await cursor.to_list(length=1000)
        
        return orders
    
    async def get_seller_pending_total(self, seller_id: str) -> Dict:
        """Calculer le total en attente pour un vendeur"""
        pipeline = [
            {
                "$match": {
                    "seller_id": seller_id,
                    "payment_method": "stripe_direct",
                    "status": {"$in": ["paid", "delivered", "completed"]},
                    "payout_status": {"$in": ["pending", None]}
                }
            },
            {
                "$group": {
                    "_id": "$seller_id",
                    "total_amount": {"$sum": "$seller_amount"},
                    "orders_count": {"$sum": 1},
                    "order_ids": {"$push": "$id"}
                }
            }
        ]
        
        results = await self.db.orders.aggregate(pipeline).to_list(1)
        if results:
            return results[0]
        return {"total_amount": 0, "orders_count": 0, "order_ids": []}
    
    async def process_stripe_connect_payout(self, seller_id: str, order_ids: List[str] = None) -> Dict:
        """
        Effectuer un reversement via Stripe Connect (pour vendeurs avec compte connecté)
        """
        # Récupérer le vendeur
        seller = await self.db.users.find_one({"id": seller_id}, {"_id": 0})
        if not seller:
            return {"success": False, "error": "Vendeur non trouvé"}
        
        stripe_account_id = seller.get("stripe_account_id")
        if not stripe_account_id:
            return {"success": False, "error": "Vendeur sans compte Stripe Connect", "fallback": "bank_transfer"}
        
        # Vérifier que le compte est actif
        try:
            account = stripe.Account.retrieve(stripe_account_id)
            if not account.charges_enabled or not account.payouts_enabled:
                return {"success": False, "error": "Compte Stripe non complètement configuré", "fallback": "bank_transfer"}
        except Exception as e:
            logger.error(f"Erreur vérification compte Stripe {stripe_account_id}: {e}")
            return {"success": False, "error": str(e), "fallback": "bank_transfer"}
        
        # Calculer le montant à reverser
        if order_ids:
            query = {"id": {"$in": order_ids}, "seller_id": seller_id, "payout_status": {"$in": ["pending", None]}}
        else:
            pending = await self.get_seller_pending_total(seller_id)
            order_ids = pending.get("order_ids", [])
            query = {"id": {"$in": order_ids}}
        
        orders = await self.db.orders.find(query, {"_id": 0}).to_list(1000)
        total_amount = sum(o.get("seller_amount", 0) for o in orders)
        
        if total_amount < MIN_PAYOUT_AMOUNT:
            return {"success": False, "error": f"Montant minimum non atteint ({MIN_PAYOUT_AMOUNT}€)", "amount": total_amount}
        
        # Créer le transfert Stripe
        try:
            transfer = stripe.Transfer.create(
                amount=int(total_amount * 100),  # Stripe utilise les centimes
                currency="eur",
                destination=stripe_account_id,
                description=f"Reversement WorldAutoFrance - {len(orders)} vente(s)",
                metadata={
                    "seller_id": seller_id,
                    "order_ids": ",".join(order_ids[:10]),  # Limiter la taille des metadata
                    "orders_count": len(orders)
                }
            )
            
            # Marquer les commandes comme reversées
            payout_id = f"PAY-{uuid.uuid4().hex[:12].upper()}"
            await self.db.orders.update_many(
                {"id": {"$in": order_ids}},
                {"$set": {
                    "payout_status": "completed",
                    "payout_at": datetime.now(timezone.utc).isoformat(),
                    "payout_id": payout_id,
                    "payout_method": "stripe_connect",
                    "stripe_transfer_id": transfer.id
                }}
            )
            
            # Enregistrer le reversement
            await self.db.payouts.insert_one({
                "id": payout_id,
                "seller_id": seller_id,
                "amount": total_amount,
                "currency": "EUR",
                "method": "stripe_connect",
                "stripe_transfer_id": transfer.id,
                "order_ids": order_ids,
                "orders_count": len(orders),
                "status": "completed",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Notifier le vendeur
            await self._notify_seller(seller_id, total_amount, len(orders), "stripe_connect")
            
            logger.info(f"✅ Reversement Stripe Connect {payout_id}: {total_amount}€ vers {seller_id}")
            
            return {
                "success": True,
                "payout_id": payout_id,
                "amount": total_amount,
                "orders_count": len(orders),
                "method": "stripe_connect",
                "stripe_transfer_id": transfer.id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Erreur Stripe Transfer: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_bank_transfer_request(self, seller_id: str, order_ids: List[str] = None) -> Dict:
        """
        Créer une demande de virement bancaire (pour vendeurs sans Stripe Connect)
        L'admin devra effectuer le virement manuellement
        """
        seller = await self.db.users.find_one({"id": seller_id}, {"_id": 0})
        if not seller:
            return {"success": False, "error": "Vendeur non trouvé"}
        
        # Vérifier les coordonnées bancaires
        iban = seller.get("iban")
        if not iban:
            return {"success": False, "error": "IBAN non renseigné par le vendeur"}
        
        # Calculer le montant
        if order_ids:
            query = {"id": {"$in": order_ids}, "seller_id": seller_id, "payout_status": {"$in": ["pending", None]}}
        else:
            pending = await self.get_seller_pending_total(seller_id)
            order_ids = pending.get("order_ids", [])
            query = {"id": {"$in": order_ids}}
        
        orders = await self.db.orders.find(query, {"_id": 0}).to_list(1000)
        total_amount = sum(o.get("seller_amount", 0) for o in orders)
        
        if total_amount < MIN_PAYOUT_AMOUNT:
            return {"success": False, "error": f"Montant minimum non atteint ({MIN_PAYOUT_AMOUNT}€)", "amount": total_amount}
        
        # Créer la demande de virement
        payout_id = f"PAY-{uuid.uuid4().hex[:12].upper()}"
        
        payout_request = {
            "id": payout_id,
            "seller_id": seller_id,
            "seller_name": seller.get("name") or seller.get("company_name"),
            "seller_email": seller.get("email"),
            "amount": total_amount,
            "currency": "EUR",
            "method": "bank_transfer",
            "bank_details": {
                "iban": iban,
                "bic": seller.get("bic"),
                "account_holder": seller.get("account_holder") or seller.get("name")
            },
            "order_ids": order_ids,
            "orders_count": len(orders),
            "status": "pending_transfer",  # En attente de virement manuel
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.payouts.insert_one(payout_request)
        
        # Marquer les commandes comme "en cours de reversement"
        await self.db.orders.update_many(
            {"id": {"$in": order_ids}},
            {"$set": {
                "payout_status": "processing",
                "payout_id": payout_id,
                "payout_method": "bank_transfer"
            }}
        )
        
        logger.info(f"📋 Demande virement bancaire {payout_id}: {total_amount}€ pour {seller_id}")
        
        return {
            "success": True,
            "payout_id": payout_id,
            "amount": total_amount,
            "orders_count": len(orders),
            "method": "bank_transfer",
            "status": "pending_transfer",
            "bank_details": payout_request["bank_details"]
        }
    
    async def confirm_bank_transfer(self, payout_id: str, admin_id: str, reference: str = None) -> Dict:
        """
        Confirmer qu'un virement bancaire a été effectué (action admin)
        """
        payout = await self.db.payouts.find_one({"id": payout_id}, {"_id": 0})
        if not payout:
            return {"success": False, "error": "Reversement non trouvé"}
        
        if payout.get("status") == "completed":
            return {"success": False, "error": "Ce reversement a déjà été confirmé"}
        
        # Mettre à jour le statut
        await self.db.payouts.update_one(
            {"id": payout_id},
            {"$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "completed_by": admin_id,
                "bank_reference": reference
            }}
        )
        
        # Mettre à jour les commandes
        await self.db.orders.update_many(
            {"payout_id": payout_id},
            {"$set": {
                "payout_status": "completed",
                "payout_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Notifier le vendeur
        await self._notify_seller(
            payout["seller_id"], 
            payout["amount"], 
            payout["orders_count"], 
            "bank_transfer"
        )
        
        logger.info(f"✅ Virement bancaire confirmé {payout_id}")
        
        return {"success": True, "payout_id": payout_id}
    
    async def process_auto_payouts(self) -> Dict:
        """
        Traiter automatiquement tous les reversements éligibles
        Appelé par un scheduler (cron job)
        """
        if not AUTO_PAYOUT_ENABLED:
            return {"success": False, "error": "Auto-payout désactivé"}
        
        # Récupérer les commandes éligibles
        eligible_orders = await self.get_pending_payouts()
        
        if not eligible_orders:
            return {"success": True, "message": "Aucun reversement à traiter", "processed": 0}
        
        # Grouper par vendeur
        sellers = {}
        for order in eligible_orders:
            seller_id = order.get("seller_id")
            if seller_id not in sellers:
                sellers[seller_id] = []
            sellers[seller_id].append(order["id"])
        
        results = {
            "processed": 0,
            "stripe_connect": 0,
            "bank_transfer": 0,
            "errors": []
        }
        
        for seller_id, order_ids in sellers.items():
            # Essayer d'abord Stripe Connect
            result = await self.process_stripe_connect_payout(seller_id, order_ids)
            
            if result.get("success"):
                results["processed"] += 1
                results["stripe_connect"] += 1
            elif result.get("fallback") == "bank_transfer":
                # Créer une demande de virement bancaire
                bank_result = await self.create_bank_transfer_request(seller_id, order_ids)
                if bank_result.get("success"):
                    results["processed"] += 1
                    results["bank_transfer"] += 1
                else:
                    results["errors"].append({
                        "seller_id": seller_id,
                        "error": bank_result.get("error")
                    })
            else:
                results["errors"].append({
                    "seller_id": seller_id,
                    "error": result.get("error")
                })
        
        logger.info(f"🔄 Auto-payout terminé: {results['processed']} traités, {len(results['errors'])} erreurs")
        
        return {"success": True, **results}
    
    async def get_payout_history(self, seller_id: str = None, limit: int = 50) -> List[Dict]:
        """Récupérer l'historique des reversements"""
        query = {}
        if seller_id:
            query["seller_id"] = seller_id
        
        cursor = self.db.payouts.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def get_pending_bank_transfers(self) -> List[Dict]:
        """Récupérer les virements bancaires en attente de confirmation"""
        cursor = self.db.payouts.find(
            {"method": "bank_transfer", "status": "pending_transfer"},
            {"_id": 0}
        ).sort("created_at", 1)
        return await cursor.to_list(length=100)
    
    async def _notify_seller(self, seller_id: str, amount: float, orders_count: int, method: str):
        """Envoyer une notification au vendeur"""
        method_label = "Stripe" if method == "stripe_connect" else "virement bancaire"
        
        await self.db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": seller_id,
            "type": "payout_completed",
            "title": "💰 Reversement effectué",
            "message": f"Votre reversement de {amount:.2f}€ ({orders_count} vente(s)) a été effectué par {method_label}.",
            "data": {"amount": amount, "method": method},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })


# Instance globale (sera initialisée avec la DB)
payout_service: Optional[PayoutService] = None


def init_payout_service(db: AsyncIOMotorDatabase):
    """Initialiser le service avec la base de données"""
    global payout_service
    payout_service = PayoutService(db)
    return payout_service


def get_payout_service() -> PayoutService:
    """Récupérer l'instance du service"""
    if payout_service is None:
        raise RuntimeError("PayoutService not initialized")
    return payout_service
