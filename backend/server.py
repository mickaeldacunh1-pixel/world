from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, File, UploadFile
from fastapi.responses import StreamingResponse
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
import stripe
import cloudinary
import cloudinary.uploader
import httpx
import base64
from bordereau_generator import BordereauGenerator

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

# PayPal Config
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'AcwFhKpmHq2rl9o-yA3QuPzIBIIZcNKWf8hicAGA0yBPDs_FuQH-rUQIRenvQlcuFlQ2Y_7EWnLpPvHu')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', 'EEcKt9QS9F-n2ppc8e4_2jfD1snDa5MbeD8aSIw-t9VhYYfocVCTlNe19PGNZp-HhbevRQCEMCflm7G')
PAYPAL_BASE_URL = os.environ.get('PAYPAL_BASE_URL', 'https://api-m.sandbox.paypal.com')

# Cloudinary Config
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dmtnmaloe'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', '743968936572992'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', 'S9L4owos6Okd_9bFqo5R2keEbcU')
)

app = FastAPI(title="World Auto Marketplace API")
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
    subcategory: Optional[str] = None  # Sous-catégorie pour les pièces/accessoires
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    condition: str = "occasion"  # neuf, occasion, reconditionne
    images: List[str] = []
    location: Optional[str] = None
    postal_code: Optional[str] = None
    # Compatibilité véhicule
    compatible_brands: List[str] = []  # Marques compatibles
    compatible_models: List[str] = []  # Modèles compatibles
    compatible_years: Optional[str] = None  # Ex: "2015-2020"
    oem_reference: Optional[str] = None  # Référence constructeur OEM
    aftermarket_reference: Optional[str] = None  # Référence équipementier

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

# Sous-catégories d'accessoires
ACCESSOIRES_SUBCATEGORIES = {
    "jantes": "Jantes et enjoliveurs",
    "pneus": "Pneus",
    "gps_navigation": "GPS et navigation",
    "autoradio": "Autoradio et multimédia",
    "alarme": "Alarmes et antivol",
    "camera": "Caméras de recul et dashcam",
    "eclairage_led": "Éclairage LED et tuning",
    "tapis": "Tapis et protection",
    "housse": "Housses et couvre-sièges",
    "coffre": "Coffres de toit et barres",
    "attelage": "Attelages et remorquage",
    "outillage": "Outillage et équipement",
    "entretien": "Produits d'entretien",
    "huile": "Huiles et lubrifiants",
    "batterie_accessoire": "Batteries et chargeurs",
    "cable": "Câbles et connectique",
    "volant": "Volants et pommeau",
    "pedale": "Pédales et repose-pied",
    "protection": "Protection carrosserie",
    "antenne": "Antennes",
    "porte_velo": "Porte-vélos et porte-ski",
    "bebe": "Sièges bébé et accessoires enfant",
    "animaux": "Accessoires animaux",
    "camping": "Accessoires camping-car",
    "autre_accessoire": "Autres accessoires"
}

# Marques automobiles principales
CAR_BRANDS = [
    "Abarth", "Alfa Romeo", "Alpine", "Aston Martin", "Audi",
    "Bentley", "BMW", "Bugatti",
    "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Cupra",
    "Dacia", "Daewoo", "Daihatsu", "DS",
    "Ferrari", "Fiat", "Ford",
    "Honda", "Hummer", "Hyundai",
    "Infiniti", "Isuzu", "Iveco",
    "Jaguar", "Jeep",
    "Kia",
    "Lada", "Lamborghini", "Lancia", "Land Rover", "Lexus", "Lotus",
    "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "MG", "Mini", "Mitsubishi",
    "Nissan",
    "Opel",
    "Peugeot", "Porsche",
    "Renault", "Rolls-Royce", "Rover",
    "Saab", "Seat", "Skoda", "Smart", "SsangYong", "Subaru", "Suzuki",
    "Tesla", "Toyota",
    "Volkswagen", "Volvo",
    "Autre"
]

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
    # Compatibilité véhicule
    compatible_brands: List[str] = []
    compatible_models: List[str] = []
    compatible_years: Optional[str] = None
    oem_reference: Optional[str] = None
    aftermarket_reference: Optional[str] = None

# Modèles pour les commandes et bordereaux
class OrderCreate(BaseModel):
    listing_id: str
    buyer_address: str
    buyer_city: str
    buyer_postal: str
    buyer_phone: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    listing_id: str
    listing_title: str
    price: float
    seller_id: str
    seller_name: str
    buyer_id: str
    buyer_name: str
    buyer_address: str
    buyer_city: str
    buyer_postal: str
    buyer_phone: Optional[str] = None
    status: str  # pending, confirmed, shipped, delivered, returned
    created_at: str
    shipped_at: Optional[str] = None
    delivered_at: Optional[str] = None

class ReturnRequest(BaseModel):
    order_id: str
    reason: str
    notes: Optional[str] = None

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
        "created_at": datetime.now(timezone.utc).isoformat(),
        # Compatibilité véhicule
        "compatible_brands": listing.compatible_brands,
        "compatible_models": listing.compatible_models,
        "compatible_years": listing.compatible_years,
        "oem_reference": listing.oem_reference,
        "aftermarket_reference": listing.aftermarket_reference
    }
    
    await db.listings.insert_one(listing_doc)
    
    # Deduct credit
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"credits": -1}}
    )
    
    return ListingResponse(**listing_doc)

# ================== IMAGE UPLOAD ==================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload an image to Cloudinary"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.")
        
        # Read file content
        contents = await file.read()
        
        # Check file size (max 10MB)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="L'image est trop volumineuse. Maximum 10MB.")
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder="worldauto",
            resource_type="image",
            transformation=[
                {"width": 1200, "height": 900, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )
        
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height")
        }
    except cloudinary.exceptions.Error as e:
        logging.error(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload de l'image")

@api_router.delete("/upload/image/{public_id:path}")
async def delete_image(public_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an image from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return {"status": "success", "result": result}
    except cloudinary.exceptions.Error as e:
        logging.error(f"Cloudinary delete error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression de l'image")

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
    compatible_brand: Optional[str] = None,
    oem_reference: Optional[str] = None,
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
    if compatible_brand:
        query["compatible_brands"] = compatible_brand
    if oem_reference:
        query["$or"] = query.get("$or", []) + [
            {"oem_reference": {"$regex": oem_reference, "$options": "i"}},
            {"aftermarket_reference": {"$regex": oem_reference, "$options": "i"}}
        ]
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

# ================== ORDERS & SHIPPING ROUTES ==================

bordereau_gen = BordereauGenerator()

@api_router.post("/orders")
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    """Créer une commande pour un article"""
    # Get listing
    listing = await db.listings.find_one({"id": order.listing_id, "status": "active"}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée ou déjà vendue")
    
    if listing["seller_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas acheter votre propre annonce")
    
    # Get seller info
    seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0, "password": 0})
    
    order_doc = {
        "id": str(uuid.uuid4()),
        "listing_id": order.listing_id,
        "listing_title": listing["title"],
        "price": listing["price"],
        "oem_reference": listing.get("oem_reference"),
        "seller_id": listing["seller_id"],
        "seller_name": listing["seller_name"],
        "seller_address": seller.get("address", ""),
        "seller_city": seller.get("city", ""),
        "seller_postal": seller.get("postal_code", ""),
        "seller_phone": seller.get("phone", ""),
        "buyer_id": current_user["id"],
        "buyer_name": current_user["name"],
        "buyer_address": order.buyer_address,
        "buyer_city": order.buyer_city,
        "buyer_postal": order.buyer_postal,
        "buyer_phone": order.buyer_phone or current_user.get("phone", ""),
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "shipped_at": None,
        "delivered_at": None
    }
    
    await db.orders.insert_one(order_doc)
    
    # Mark listing as sold
    await db.listings.update_one({"id": order.listing_id}, {"$set": {"status": "sold"}})
    
    return order_doc

@api_router.get("/orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    """Récupérer mes commandes (achats et ventes)"""
    cursor = db.orders.find(
        {"$or": [{"buyer_id": current_user["id"]}, {"seller_id": current_user["id"]}]},
        {"_id": 0}
    ).sort("created_at", -1)
    orders = await cursor.to_list(100)
    
    # Add role info
    for order in orders:
        order["role"] = "buyer" if order["buyer_id"] == current_user["id"] else "seller"
    
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Récupérer une commande spécifique"""
    order = await db.orders.find_one(
        {"id": order_id, "$or": [{"buyer_id": current_user["id"]}, {"seller_id": current_user["id"]}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    order["role"] = "buyer" if order["buyer_id"] == current_user["id"] else "seller"
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Mettre à jour le statut d'une commande"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # Seller can mark as shipped
    if status == "shipped" and order["seller_id"] == current_user["id"]:
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"status": "shipped", "shipped_at": datetime.now(timezone.utc).isoformat()}}
        )
    # Buyer can mark as delivered
    elif status == "delivered" and order["buyer_id"] == current_user["id"]:
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"status": "delivered", "delivered_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        raise HTTPException(status_code=403, detail="Action non autorisée")
    
    return {"message": "Statut mis à jour"}

@api_router.get("/orders/{order_id}/shipping-slip")
async def download_shipping_slip(order_id: str, current_user: dict = Depends(get_current_user)):
    """Télécharger le bordereau d'expédition PDF"""
    order = await db.orders.find_one(
        {"id": order_id, "seller_id": current_user["id"]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée ou accès refusé")
    
    pdf_buffer = bordereau_gen.generate_shipping_slip(
        order_id=order["id"],
        listing_title=order["listing_title"],
        listing_id=order["listing_id"],
        price=order["price"],
        seller_name=order["seller_name"],
        seller_address=order.get("seller_address", "Adresse non renseignée"),
        seller_city=order.get("seller_city", ""),
        seller_postal=order.get("seller_postal", ""),
        seller_phone=order.get("seller_phone", ""),
        buyer_name=order["buyer_name"],
        buyer_address=order["buyer_address"],
        buyer_city=order["buyer_city"],
        buyer_postal=order["buyer_postal"],
        buyer_phone=order.get("buyer_phone", ""),
        oem_reference=order.get("oem_reference")
    )
    
    filename = f"bordereau_expedition_WA-{order_id[:8].upper()}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.post("/orders/{order_id}/return")
async def request_return(order_id: str, return_req: ReturnRequest, current_user: dict = Depends(get_current_user)):
    """Demander un retour pour une commande"""
    order = await db.orders.find_one(
        {"id": order_id, "buyer_id": current_user["id"]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    if order["status"] not in ["shipped", "delivered"]:
        raise HTTPException(status_code=400, detail="Retour non possible pour cette commande")
    
    return_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "listing_id": order["listing_id"],
        "listing_title": order["listing_title"],
        "reason": return_req.reason,
        "notes": return_req.notes,
        "buyer_id": order["buyer_id"],
        "buyer_name": order["buyer_name"],
        "buyer_address": order["buyer_address"],
        "buyer_city": order["buyer_city"],
        "buyer_postal": order["buyer_postal"],
        "buyer_phone": order.get("buyer_phone", ""),
        "seller_id": order["seller_id"],
        "seller_name": order["seller_name"],
        "seller_address": order.get("seller_address", ""),
        "seller_city": order.get("seller_city", ""),
        "seller_postal": order.get("seller_postal", ""),
        "seller_phone": order.get("seller_phone", ""),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.returns.insert_one(return_doc)
    
    # Update order status
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "return_requested"}})
    
    return return_doc

@api_router.get("/returns")
async def get_my_returns(current_user: dict = Depends(get_current_user)):
    """Récupérer mes retours"""
    cursor = db.returns.find(
        {"$or": [{"buyer_id": current_user["id"]}, {"seller_id": current_user["id"]}]},
        {"_id": 0}
    ).sort("created_at", -1)
    returns = await cursor.to_list(100)
    return returns

@api_router.get("/returns/{return_id}/slip")
async def download_return_slip(return_id: str, current_user: dict = Depends(get_current_user)):
    """Télécharger le bordereau de retour PDF"""
    return_doc = await db.returns.find_one(
        {"id": return_id, "$or": [{"buyer_id": current_user["id"]}, {"seller_id": current_user["id"]}]},
        {"_id": 0}
    )
    if not return_doc:
        raise HTTPException(status_code=404, detail="Retour non trouvé")
    
    pdf_buffer = bordereau_gen.generate_return_slip(
        return_id=return_doc["id"],
        order_id=return_doc["order_id"],
        listing_title=return_doc["listing_title"],
        listing_id=return_doc["listing_id"],
        reason=return_doc["reason"],
        buyer_name=return_doc["buyer_name"],
        buyer_address=return_doc["buyer_address"],
        buyer_city=return_doc["buyer_city"],
        buyer_postal=return_doc["buyer_postal"],
        buyer_phone=return_doc.get("buyer_phone", ""),
        seller_name=return_doc["seller_name"],
        seller_address=return_doc.get("seller_address", "Adresse non renseignée"),
        seller_city=return_doc.get("seller_city", ""),
        seller_postal=return_doc.get("seller_postal", ""),
        seller_phone=return_doc.get("seller_phone", ""),
        notes=return_doc.get("notes")
    )
    
    filename = f"bordereau_retour_RET-{return_id[:8].upper()}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ================== PAYMENT ROUTES ==================

@api_router.get("/subcategories/pieces")
async def get_pieces_subcategories():
    """Retourne toutes les sous-catégories de pièces détachées (style Opisto)"""
    return PIECES_SUBCATEGORIES

@api_router.get("/subcategories/accessoires")
async def get_accessoires_subcategories():
    """Retourne toutes les sous-catégories d'accessoires"""
    return ACCESSOIRES_SUBCATEGORIES

@api_router.get("/brands")
async def get_car_brands():
    """Retourne la liste des marques automobiles"""
    return CAR_BRANDS

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
    
    # Get frontend URL from origin header or construct from backend URL
    origin = request.headers.get("origin", host_url)
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/tarifs"
    
    # Initialize Stripe
    stripe.api_key = STRIPE_API_KEY
    
    # Create Stripe checkout session
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": f"Pack {package['listings']} annonces - World Auto",
                },
                "unit_amount": int(package["price"] * 100),  # Stripe uses cents
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user["id"],
            "package_id": package_id,
            "listings": str(package["listings"])
        }
    )
    
    # Create payment transaction record
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.id,
        "user_id": current_user["id"],
        "package_id": package_id,
        "amount": package["price"],
        "currency": "eur",
        "listings_count": package["listings"],
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    if transaction["payment_status"] == "paid":
        return {"status": "complete", "payment_status": "paid", "message": "Paiement déjà traité"}
    
    # Get status from Stripe
    stripe.api_key = STRIPE_API_KEY
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        payment_status = session.payment_status
        
        if payment_status == "paid":
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
            
            return {"status": session.status, "payment_status": "paid", "message": "Crédits ajoutés avec succès"}
        
        return {"status": session.status, "payment_status": payment_status}
    except Exception as e:
        logging.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du paiement")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        stripe.api_key = STRIPE_API_KEY
        # For now, just parse the event without signature verification
        # In production, you should verify the webhook signature
        import json
        event = json.loads(body)
        
        if event.get("type") == "checkout.session.completed":
            session_data = event["data"]["object"]
            session_id = session_data["id"]
            payment_status = session_data.get("payment_status", "")
            
            if payment_status == "paid":
                # Update transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Get transaction to add credits
                transaction = await db.payment_transactions.find_one({"session_id": session_id})
                if transaction:
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$inc": {"credits": transaction["listings_count"]}}
                    )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error"}

# ================== PAYPAL PAYMENT ==================

async def get_paypal_access_token():
    """Get PayPal access token"""
    auth = base64.b64encode(f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()).decode()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data="grant_type=client_credentials"
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Erreur d'authentification PayPal")
        return response.json()["access_token"]

@api_router.post("/payments/paypal/create/{package_id}")
async def create_paypal_order(package_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Create a PayPal order"""
    packages = {
        "starter": {"name": "Pack Starter", "listings": 5, "price": 9.99},
        "pro": {"name": "Pack Pro", "listings": 20, "price": 29.99},
        "business": {"name": "Pack Business", "listings": 50, "price": 59.99}
    }
    
    package = packages.get(package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Pack non trouvé")
    
    try:
        access_token = await get_paypal_access_token()
        
        origin = request.headers.get("origin", "https://worldautofrance.com")
        
        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": "EUR",
                    "value": str(package["price"])
                },
                "description": f"{package['name']} - {package['listings']} annonces"
            }],
            "application_context": {
                "return_url": f"{origin}/payment/success?method=paypal",
                "cancel_url": f"{origin}/tarifs",
                "brand_name": "World Auto",
                "landing_page": "LOGIN",
                "user_action": "PAY_NOW"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYPAL_BASE_URL}/v2/checkout/orders",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=order_data
            )
            
            if response.status_code not in [200, 201]:
                logging.error(f"PayPal create order error: {response.text}")
                raise HTTPException(status_code=500, detail="Erreur lors de la création de la commande PayPal")
            
            order = response.json()
            
            # Save transaction
            transaction_doc = {
                "id": str(uuid.uuid4()),
                "paypal_order_id": order["id"],
                "user_id": current_user["id"],
                "package_id": package_id,
                "amount": package["price"],
                "currency": "eur",
                "listings_count": package["listings"],
                "payment_status": "pending",
                "payment_method": "paypal",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.payment_transactions.insert_one(transaction_doc)
            
            # Find approval URL
            approval_url = next(
                (link["href"] for link in order["links"] if link["rel"] == "approve"),
                None
            )
            
            return {
                "order_id": order["id"],
                "approval_url": approval_url
            }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"PayPal error: {e}")
        raise HTTPException(status_code=500, detail="Erreur PayPal")

@api_router.post("/payments/paypal/capture/{order_id}")
async def capture_paypal_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Capture a PayPal order after approval"""
    try:
        access_token = await get_paypal_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code not in [200, 201]:
                logging.error(f"PayPal capture error: {response.text}")
                raise HTTPException(status_code=500, detail="Erreur lors de la capture du paiement")
            
            capture_data = response.json()
            
            if capture_data["status"] == "COMPLETED":
                # Update transaction
                transaction = await db.payment_transactions.find_one({"paypal_order_id": order_id})
                if transaction:
                    await db.payment_transactions.update_one(
                        {"paypal_order_id": order_id},
                        {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    
                    # Add credits to user
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$inc": {"credits": transaction["listings_count"]}}
                    )
                
                return {"status": "success", "message": "Paiement réussi ! Crédits ajoutés."}
            else:
                return {"status": "pending", "message": "Paiement en attente"}
                
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"PayPal capture error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la capture")

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
    return {"message": "World Auto Marketplace API", "version": "1.0.0"}

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
