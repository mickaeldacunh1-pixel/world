"""Modèles Pydantic pour l'application World Auto"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime

# ==================== USER MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    is_professional: bool = False
    company_name: Optional[str] = None
    siret: Optional[str] = None
    country: str = "France"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    siret: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    vacation_mode: Optional[bool] = None
    vacation_message: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    is_professional: bool
    company_name: Optional[str] = None
    created_at: str
    credits: int = 0

# ==================== LISTING MODELS ====================

class ListingCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str  # pieces, voitures, motos, utilitaires, accessoires, engins
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    condition: str = "occasion"  # neuf, occasion, reconditionne
    images: List[str] = []
    location: Optional[str] = None
    postal_code: Optional[str] = None
    region: Optional[str] = None
    shipping_cost: Optional[float] = None
    shipping_info: Optional[str] = None
    # Compatibilité véhicule
    compatible_brands: List[str] = []
    compatible_models: List[str] = []
    compatible_years: Optional[str] = None
    oem_reference: Optional[str] = None
    aftermarket_reference: Optional[str] = None
    video_url: Optional[str] = None
    # Confiance & Garantie
    part_origin: Optional[str] = None
    vehicle_mileage: Optional[int] = None
    vehicle_vin: Optional[str] = None
    has_warranty: bool = False
    warranty_duration: Optional[int] = None

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    condition: Optional[str] = None
    images: Optional[List[str]] = None
    location: Optional[str] = None
    postal_code: Optional[str] = None
    region: Optional[str] = None
    shipping_cost: Optional[float] = None
    shipping_info: Optional[str] = None
    compatible_brands: Optional[List[str]] = None
    compatible_models: Optional[List[str]] = None
    compatible_years: Optional[str] = None
    oem_reference: Optional[str] = None
    aftermarket_reference: Optional[str] = None
    video_url: Optional[str] = None
    part_origin: Optional[str] = None
    vehicle_mileage: Optional[int] = None
    vehicle_vin: Optional[str] = None

# ==================== ORDER MODELS ====================

class OrderCreate(BaseModel):
    listing_id: str
    quantity: int = 1
    shipping_address: Optional[Dict] = None
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None

# ==================== MESSAGE MODELS ====================

class MessageCreate(BaseModel):
    listing_id: str
    recipient_id: str
    content: str

# ==================== REVIEW MODELS ====================

class ReviewCreate(BaseModel):
    listing_id: str
    seller_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    order_id: Optional[str] = None

# ==================== OFFER MODELS ====================

class OfferCreate(BaseModel):
    listing_id: str
    amount: float
    message: Optional[str] = None

class OfferResponse(BaseModel):
    status: str  # pending, accepted, rejected, countered, expired
    counter_amount: Optional[float] = None
    message: Optional[str] = None

# ==================== ALERT MODELS ====================

class AlertCreate(BaseModel):
    name: str
    query: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    region: Optional[str] = None

# ==================== BUNDLE MODELS ====================

class BundleCreate(BaseModel):
    title: str
    description: str
    listing_ids: List[str]
    discount_percent: float = 0
    
# ==================== Q&A MODELS ====================

class QuestionCreate(BaseModel):
    listing_id: str
    content: str

class AnswerCreate(BaseModel):
    content: str

# ==================== AUCTION MODELS ====================

class BidCreate(BaseModel):
    amount: float

# ==================== COUPON MODELS ====================

class CouponCreate(BaseModel):
    code: str
    discount_type: str  # percent, fixed
    discount_value: float
    min_purchase: Optional[float] = None
    max_uses: Optional[int] = None
    valid_until: Optional[str] = None
    categories: Optional[List[str]] = None

# ==================== CONSTANTS ====================

WARRANTY_OPTIONS = {
    3: {"price": 4.99, "label": "3 mois"},
    6: {"price": 7.99, "label": "6 mois"},
    12: {"price": 12.99, "label": "12 mois"}
}

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

ACCESSOIRES_SUBCATEGORIES = {
    "entretien": "Produits d'entretien",
    "outillage": "Outillage",
    "equipement": "Équipement conducteur",
    "securite": "Sécurité et signalisation",
    "confort": "Confort et aménagement",
    "multimedia": "Multimédia et GPS",
    "exterieur": "Accessoires extérieurs",
    "remorquage": "Attelage et remorquage",
    "autre": "Autres accessoires"
}

VIDEO_PACKAGE_PRICES = {
    "extended": 1.00,      # 2 min, 100 Mo
    "intermediate": 2.99,  # 3 min, 150 Mo
    "pro": 9.99,           # 10 min, 500 Mo
}

VIDEO_BOOST_PRICES = {
    "1h": 0.50,
    "24h": 5.00,
}
