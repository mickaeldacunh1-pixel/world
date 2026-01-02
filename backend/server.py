from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'autopieces-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

app = FastAPI(title="AutoPièces Marketplace API")
api_router = APIRouter(prefix="/api")

# ================== MODELS ==================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    is_professional: bool = False
    company_name: Optional[str] = None
    siret: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    is_professional: bool
    company_name: Optional[str] = None
    created_at: str
    credits: int = 0

class ListingCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str  # pieces, voitures, motos, utilitaires, accessoires
    subcategory: Optional[str] = None  # Sous-catégorie pour les pièces
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    condition: str = "occasion"  # neuf, occasion, reconditionne
    images: List[str] = []
    location: Optional[str] = None
    postal_code: Optional[str] = None

# Sous-catégories de pièces détachées (style Opisto)
PIECES_SUBCATEGORIES = {
    "moteur": "Moteur et pièces moteur",
    "boite_vitesse": "Boîte de vitesse",
    "embrayage": "Embrayage",
    "transmission": "Transmission",
    "echappement": "Échappement",
    "refroidissement": "Refroidissement",
    "carrosserie": "Carrosserie",
    "optique": "Optiques et éclairage",
    "retroviseur": "Rétroviseurs",
    "vitrage": "Vitrage",
    "interieur": "Intérieur et sellerie",
    "tableau_bord": "Tableau de bord",
    "sieges": "Sièges",
    "freinage": "Freinage",
    "suspension": "Suspension et amortisseurs",
    "direction": "Direction",
    "roues_pneus": "Roues et pneus",
    "electricite": "Électricité",
    "demarreur": "Démarreur et alternateur",
    "batterie": "Batterie",
    "climatisation": "Climatisation",
    "injection": "Injection et carburation",
    "turbo": "Turbo",
    "pompe": "Pompes (eau, huile, injection)",
    "filtre": "Filtres",
    "courroie": "Courroies et chaînes",
    "joint": "Joints et kits",
    "capteur": "Capteurs et sondes",
    "calculateur": "Calculateurs et électronique",
    "airbag": "Airbags et sécurité",
    "autre": "Autres pièces"
}

class ListingResponse(BaseModel):
    id: str
    title: str
    description: str
    price: float
    category: str
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    condition: str
    images: List[str]
    location: Optional[str] = None
    postal_code: Optional[str] = None
    seller_id: str
    seller_name: str
    seller_is_pro: bool
    created_at: str
    status: str
    views: int = 0

class MessageCreate(BaseModel):
    listing_id: str
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    listing_id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    receiver_name: str
    content: str
    created_at: str
    read: bool

class ConversationResponse(BaseModel):
    listing_id: str
    listing_title: str
    other_user_id: str
    other_user_name: str
    last_message: str
    last_message_at: str
    unread_count: int

# Pricing packages (Opisto-style)
PRICING_PACKAGES = {
    "single": {"name": "Annonce Unique", "price": 2.00, "listings": 1, "duration": 30},
    "pack5": {"name": "Pack 5 Annonces", "price": 8.00, "listings": 5, "duration": 30},
    "pack20": {"name": "Pack 20 Annonces", "price": 25.00, "listings": 20, "duration": 30},
    "unlimited": {"name": "Pro Illimité", "price": 49.00, "listings": 999, "duration": 30}
}

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "is_professional": user.is_professional,
        "company_name": user.company_name,
        "siret": user.siret,
        "address": user.address,
        "city": user.city,
        "postal_code": user.postal_code,
        "credits": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["email"])
    
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "is_professional": user_doc["is_professional"],
            "credits": 0
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_token(user["id"], user["email"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "is_professional": user.get("is_professional", False),
            "credits": user.get("credits", 0)
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ================== LISTINGS ROUTES ==================

@api_router.post("/listings", response_model=ListingResponse)
async def create_listing(listing: ListingCreate, current_user: dict = Depends(get_current_user)):
    # Check credits
    if current_user.get("credits", 0) <= 0:
        raise HTTPException(status_code=402, detail="Crédits insuffisants. Veuillez acheter un pack d'annonces.")
    
    listing_doc = {
        "id": str(uuid.uuid4()),
        "title": listing.title,
        "description": listing.description,
        "price": listing.price,
        "category": listing.category,
        "subcategory": listing.subcategory,
        "brand": listing.brand,
        "model": listing.model,
        "year": listing.year,
        "mileage": listing.mileage,
        "condition": listing.condition,
        "images": listing.images,
        "location": listing.location,
        "postal_code": listing.postal_code,
        "seller_id": current_user["id"],
        "seller_name": current_user["name"],
        "seller_is_pro": current_user.get("is_professional", False),
        "status": "active",
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.listings.insert_one(listing_doc)
    
    # Deduct credit
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"credits": -1}}
    )
    
    return ListingResponse(**listing_doc)

@api_router.get("/listings")
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
    search: Optional[str] = None,
    sort: str = "recent",
    page: int = 1,
    limit: int = 20
):
    query = {"status": "active"}
    
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if brand:
        query["brand"] = {"$regex": brand, "$options": "i"}
    if model:
        query["model"] = {"$regex": model, "$options": "i"}
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if min_year is not None:
        query["year"] = {"$gte": min_year}
    if max_year is not None:
        query.setdefault("year", {})["$lte"] = max_year
    if condition:
        query["condition"] = condition
    if postal_code:
        query["postal_code"] = {"$regex": f"^{postal_code[:2]}"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    sort_options = {
        "recent": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "views": [("views", -1)]
    }
    
    skip = (page - 1) * limit
    cursor = db.listings.find(query, {"_id": 0}).sort(sort_options.get(sort, [("created_at", -1)])).skip(skip).limit(limit)
    listings = await cursor.to_list(limit)
    
    total = await db.listings.count_documents(query)
    
    return {
        "listings": listings,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Increment views
    await db.listings.update_one({"id": listing_id}, {"$inc": {"views": 1}})
    listing["views"] = listing.get("views", 0) + 1
    
    return listing

@api_router.get("/my-listings")
async def get_my_listings(current_user: dict = Depends(get_current_user)):
    cursor = db.listings.find({"seller_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1)
    listings = await cursor.to_list(100)
    return listings

@api_router.put("/listings/{listing_id}")
async def update_listing(listing_id: str, listing: ListingCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.listings.find_one({"id": listing_id, "seller_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    update_data = listing.model_dump(exclude_unset=True)
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    return updated

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.listings.delete_one({"id": listing_id, "seller_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    return {"message": "Annonce supprimée"}

# ================== MESSAGES ROUTES ==================

@api_router.post("/messages")
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    # Get receiver info
    receiver = await db.users.find_one({"id": message.receiver_id}, {"_id": 0, "password": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="Destinataire non trouvé")
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "listing_id": message.listing_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "receiver_id": message.receiver_id,
        "receiver_name": receiver["name"],
        "content": message.content,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    return message_doc

@api_router.get("/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    # Get all messages where user is sender or receiver
    pipeline = [
        {"$match": {"$or": [{"sender_id": current_user["id"]}, {"receiver_id": current_user["id"]}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$listing_id",
            "last_message": {"$first": "$content"},
            "last_message_at": {"$first": "$created_at"},
            "other_user_id": {"$first": {"$cond": [
                {"$eq": ["$sender_id", current_user["id"]]},
                "$receiver_id",
                "$sender_id"
            ]}},
            "other_user_name": {"$first": {"$cond": [
                {"$eq": ["$sender_id", current_user["id"]]},
                "$receiver_name",
                "$sender_name"
            ]}},
            "unread_count": {"$sum": {"$cond": [
                {"$and": [{"$eq": ["$receiver_id", current_user["id"]]}, {"$eq": ["$read", False]}]},
                1, 0
            ]}}
        }}
    ]
    
    conversations = await db.messages.aggregate(pipeline).to_list(100)
    
    # Get listing titles
    for conv in conversations:
        listing = await db.listings.find_one({"id": conv["_id"]}, {"_id": 0, "title": 1})
        conv["listing_id"] = conv["_id"]
        conv["listing_title"] = listing["title"] if listing else "Annonce supprimée"
        del conv["_id"]
    
    return conversations

@api_router.get("/messages/{listing_id}/{other_user_id}")
async def get_messages(listing_id: str, other_user_id: str, current_user: dict = Depends(get_current_user)):
    query = {
        "listing_id": listing_id,
        "$or": [
            {"sender_id": current_user["id"], "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": current_user["id"]}
        ]
    }
    
    cursor = db.messages.find(query, {"_id": 0}).sort("created_at", 1)
    messages = await cursor.to_list(100)
    
    # Mark messages as read
    await db.messages.update_many(
        {"listing_id": listing_id, "receiver_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

# ================== PAYMENT ROUTES ==================

@api_router.get("/subcategories/pieces")
async def get_pieces_subcategories():
    """Retourne toutes les sous-catégories de pièces détachées (style Opisto)"""
    return PIECES_SUBCATEGORIES

@api_router.get("/pricing")
async def get_pricing():
    return PRICING_PACKAGES

@api_router.post("/payments/checkout")
async def create_checkout(package_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    if package_id not in PRICING_PACKAGES:
        raise HTTPException(status_code=400, detail="Package invalide")
    
    package = PRICING_PACKAGES[package_id]
    
    # Get host URL from request
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    # Get frontend URL from origin header or construct from backend URL
    origin = request.headers.get("origin", host_url)
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=package["price"],
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user["id"],
            "package_id": package_id,
            "listings": str(package["listings"])
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": current_user["id"],
        "package_id": package_id,
        "amount": package["price"],
        "currency": "eur",
        "listings_count": package["listings"],
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    if transaction["payment_status"] == "paid":
        return {"status": "complete", "payment_status": "paid", "message": "Paiement déjà traité"}
    
    # Get status from Stripe
    host_url = "https://example.com"  # Not used for status check
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        if status.payment_status == "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # Add credits to user
            await db.users.update_one(
                {"id": transaction["user_id"]},
                {"$inc": {"credits": transaction["listings_count"]}}
            )
            
            return {"status": status.status, "payment_status": "paid", "message": "Crédits ajoutés avec succès"}
        
        return {"status": status.status, "payment_status": status.payment_status}
    except Exception as e:
        logging.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du paiement")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # Get transaction to add credits
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            if transaction and transaction.get("payment_status") != "paid":
                await db.users.update_one(
                    {"id": transaction["user_id"]},
                    {"$inc": {"credits": transaction["listings_count"]}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error"}

# ================== STATS ROUTES ==================

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Get user's listings stats
    listings = await db.listings.find({"seller_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    active_count = sum(1 for l in listings if l.get("status") == "active")
    total_views = sum(l.get("views", 0) for l in listings)
    
    # Get unread messages count
    unread_messages = await db.messages.count_documents({
        "receiver_id": current_user["id"],
        "read": False
    })
    
    # Get user credits
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "credits": 1})
    
    return {
        "active_listings": active_count,
        "total_listings": len(listings),
        "total_views": total_views,
        "unread_messages": unread_messages,
        "credits": user.get("credits", 0)
    }

@api_router.get("/categories/stats")
async def get_category_stats():
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    stats = await db.listings.aggregate(pipeline).to_list(10)
    return {s["_id"]: s["count"] for s in stats}

# ================== ROOT ==================

@api_router.get("/")
async def root():
    return {"message": "AutoPièces Marketplace API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
