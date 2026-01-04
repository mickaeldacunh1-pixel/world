from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, File, UploadFile, BackgroundTasks
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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
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

# Cloudinary Config
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dmtnmaloe'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', '743968936572992'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', 'S9L4owos6Okd_9bFqo5R2keEbcU')
)

# Email Config
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.hostinger.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USER = os.environ.get('SMTP_USER', 'contact@worldautofrance.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SITE_URL = os.environ.get('SITE_URL', 'https://worldautofrance.com')

# ================== EMAIL SERVICE ==================

def send_email(to_email: str, subject: str, html_content: str):
    """Send email via SMTP"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"World Auto <{SMTP_USER}>"
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        
        logging.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {e}")
        return False

def send_welcome_email(user_email: str, user_name: str):
    """Email de bienvenue"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">World Auto</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2>Bienvenue {user_name} !</h2>
            <p>Merci de vous être inscrit sur World Auto, la marketplace de pièces détachées et véhicules d'occasion.</p>
            <p>Vous pouvez maintenant :</p>
            <ul>
                <li>Parcourir les annonces</li>
                <li>Publier vos propres annonces</li>
                <li>Contacter les vendeurs</li>
            </ul>
            <a href="{SITE_URL}/annonces" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir les annonces</a>
        </div>
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
            <p>World Auto - La marketplace auto pour tous</p>
            <p><a href="{SITE_URL}" style="color: #f97316;">worldautofrance.com</a></p>
        </div>
    </div>
    """
    send_email(user_email, "Bienvenue sur World Auto !", html)

def send_new_order_seller_email(seller_email: str, seller_name: str, order: dict):
    """Email au vendeur : nouvelle commande"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">World Auto</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2>Nouvelle commande !</h2>
            <p>Bonjour {seller_name},</p>
            <p>Vous avez reçu une nouvelle commande pour :</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>{order['listing_title']}</strong></p>
                <p style="margin: 5px 0; font-size: 24px; color: #f97316; font-weight: bold;">{order['price']} €</p>
                <p style="margin: 5px 0;">Commande : WA-{order['id'][:8].upper()}</p>
            </div>
            <h3>Adresse de livraison :</h3>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                {order['buyer_name']}<br>
                {order['buyer_address']}<br>
                {order['buyer_postal']} {order['buyer_city']}<br>
                {order.get('buyer_phone', '')}
            </p>
            <a href="{SITE_URL}/commandes" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Gérer mes commandes</a>
        </div>
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
            <p>N'oubliez pas de télécharger le bordereau d'expédition et de marquer la commande comme expédiée.</p>
        </div>
    </div>
    """
    send_email(seller_email, f"Nouvelle commande - {order['listing_title']}", html)

def send_new_order_buyer_email(buyer_email: str, buyer_name: str, order: dict):
    """Email à l'acheteur : confirmation de commande"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">World Auto</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2>Commande confirmée !</h2>
            <p>Bonjour {buyer_name},</p>
            <p>Votre commande a bien été enregistrée :</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>{order['listing_title']}</strong></p>
                <p style="margin: 5px 0; font-size: 24px; color: #f97316; font-weight: bold;">{order['price']} €</p>
                <p style="margin: 5px 0;">Commande : WA-{order['id'][:8].upper()}</p>
                <p style="margin: 5px 0;">Vendeur : {order['seller_name']}</p>
            </div>
            <p>Le vendeur va préparer votre colis et vous recevrez un email dès l'expédition.</p>
            <a href="{SITE_URL}/commandes" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Suivre ma commande</a>
        </div>
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
            <p>Merci pour votre confiance !</p>
        </div>
    </div>
    """
    send_email(buyer_email, f"Commande confirmée - WA-{order['id'][:8].upper()}", html)

ADMIN_EMAIL = "contact@worldautofrance.com"

def send_new_order_admin_email(order: dict, buyer_info: dict, seller_info: dict):
    """Email à l'administrateur : notification de nouvelle commande"""
    from datetime import datetime
    
    order_date = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00')) if isinstance(order.get('created_at'), str) else datetime.now()
    formatted_date = order_date.strftime("%d/%m/%Y à %H:%M")
    
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1E3A5F; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔔 World Auto - Admin</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1E3A5F;">Nouvelle commande reçue !</h2>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1E3A5F;">
                <h3 style="margin: 0 0 10px 0; color: #1E3A5F;">📦 Détails de la commande</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; color: #666;">N° Commande :</td>
                        <td style="padding: 5px 0; font-weight: bold;">WA-{order['id'][:8].upper()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Date :</td>
                        <td style="padding: 5px 0; font-weight: bold;">{formatted_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Article :</td>
                        <td style="padding: 5px 0; font-weight: bold;">{order['listing_title']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Prix :</td>
                        <td style="padding: 5px 0; font-weight: bold; color: #f97316; font-size: 18px;">{order['price']} €</td>
                    </tr>
                </table>
            </div>
            
            <div style="display: flex; gap: 20px; margin: 20px 0;">
                <div style="flex: 1; background: #f3f4f6; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #1E3A5F;">👤 Acheteur</h4>
                    <p style="margin: 5px 0;"><strong>{buyer_info.get('name', 'N/A')}</strong></p>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;">{buyer_info.get('email', 'N/A')}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;">{buyer_info.get('phone', 'Non renseigné')}</p>
                </div>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">🏪 Vendeur</h4>
                <p style="margin: 5px 0;"><strong>{seller_info.get('name', 'N/A')}</strong></p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">{seller_info.get('email', 'N/A')}</p>
            </div>
            
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #065f46;">📍 Adresse de livraison</h4>
                <p style="margin: 5px 0;">{order.get('shipping_address', 'N/A')}</p>
                <p style="margin: 5px 0;">{order.get('shipping_postal_code', '')} {order.get('shipping_city', '')}</p>
            </div>
            
            <a href="{SITE_URL}/admin/parametres" style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Accéder au panneau admin</a>
        </div>
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
            <p>Email automatique - World Auto France</p>
        </div>
    </div>
    """
    send_email(ADMIN_EMAIL, f"🔔 Nouvelle commande WA-{order['id'][:8].upper()} - {order['price']} €", html)

def send_order_shipped_email(buyer_email: str, buyer_name: str, order: dict):
    """Email à l'acheteur : commande expédiée"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">World Auto</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2>🚚 Votre commande est expédiée !</h2>
            <p>Bonjour {buyer_name},</p>
            <p>Bonne nouvelle ! Votre commande a été expédiée :</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>{order['listing_title']}</strong></p>
                <p style="margin: 5px 0;">Commande : WA-{order['id'][:8].upper()}</p>
            </div>
            <p>Vous recevrez votre colis dans les prochains jours. Pensez à confirmer la réception une fois le colis reçu.</p>
            <a href="{SITE_URL}/commandes" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Suivre ma commande</a>
        </div>
    </div>
    """
    send_email(buyer_email, f"Votre commande est expédiée - WA-{order['id'][:8].upper()}", html)

def send_order_delivered_email(seller_email: str, seller_name: str, order: dict):
    """Email au vendeur : commande livrée"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">World Auto</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2>✅ Commande livrée !</h2>
            <p>Bonjour {seller_name},</p>
            <p>L'acheteur a confirmé la réception de sa commande :</p>
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>{order['listing_title']}</strong></p>
                <p style="margin: 5px 0; font-size: 24px; color: #059669; font-weight: bold;">{order['price']} €</p>
                <p style="margin: 5px 0;">Commande : WA-{order['id'][:8].upper()}</p>
            </div>
            <p>Merci d'utiliser World Auto !</p>
        </div>
    </div>
    """
    send_email(seller_email, f"Commande livrée - WA-{order['id'][:8].upper()}", html)

def send_return_request_email(seller_email: str, seller_name: str, return_doc: dict):
    """Email au vendeur : demande de retour"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">World Auto</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2>⚠️ Demande de retour</h2>
            <p>Bonjour {seller_name},</p>
            <p>Un acheteur a demandé un retour :</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="margin: 0;"><strong>{return_doc['listing_title']}</strong></p>
                <p style="margin: 5px 0;">Retour : RET-{return_doc['id'][:8].upper()}</p>
                <p style="margin: 10px 0;"><strong>Motif :</strong> {return_doc['reason']}</p>
                {f"<p style='margin: 5px 0;'><strong>Commentaire :</strong> {return_doc['notes']}</p>" if return_doc.get('notes') else ""}
            </div>
            <p>Acheteur : {return_doc['buyer_name']}</p>
            <a href="{SITE_URL}/commandes" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir les détails</a>
        </div>
    </div>
    """
    send_email(seller_email, f"Demande de retour - {return_doc['listing_title']}", html)

def send_password_reset_email(user_email: str, user_name: str, reset_token: str):
    """Email de réinitialisation de mot de passe"""
    reset_link = f"{SITE_URL}/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">World Auto</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2>Réinitialisation de mot de passe</h2>
            <p>Bonjour {user_name},</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
            <a href="{reset_link}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Réinitialiser mon mot de passe</a>
            <p style="color: #666; font-size: 14px;">Ce lien est valable pendant 1 heure.</p>
            <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
            <p>World Auto - La marketplace auto pour tous</p>
        </div>
    </div>
    """
    send_email(user_email, "Réinitialisation de votre mot de passe - World Auto", html)

def send_search_alert_email(user_email: str, user_name: str, alert: dict, listing: dict):
    """Email d'alerte pour une nouvelle annonce correspondant à une recherche"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">World Auto</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2>🔔 Nouvelle annonce correspondant à votre recherche !</h2>
            <p>Bonjour {user_name},</p>
            <p>Une nouvelle annonce correspond à votre alerte "{alert['name']}" :</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px;"><strong>{listing['title']}</strong></p>
                <p style="margin: 5px 0; font-size: 24px; color: #f97316; font-weight: bold;">{listing['price']} €</p>
                <p style="margin: 5px 0; color: #666;">{listing.get('brand', '')} {listing.get('model', '')} {listing.get('year', '')}</p>
                <p style="margin: 5px 0; color: #666;">📍 {listing.get('location', '')} ({listing.get('postal_code', '')})</p>
            </div>
            <a href="{SITE_URL}/annonce/{listing['id']}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Voir l'annonce</a>
        </div>
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
            <p><a href="{SITE_URL}/alertes" style="color: #666;">Gérer mes alertes</a></p>
        </div>
    </div>
    """
    send_email(user_email, f"Nouvelle annonce : {listing['title']}", html)

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
    region: Optional[str] = None  # Région française
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

class CartCheckout(BaseModel):
    """Modèle pour la commande groupée depuis le panier"""
    listing_ids: List[str]
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
async def register(user: UserCreate, background_tasks: BackgroundTasks):
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
    
    # Send welcome email in background
    background_tasks.add_task(send_welcome_email, user_doc["email"], user_doc["name"])
    
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

# ================== SIRET VERIFICATION ==================

@api_router.get("/verify-siret/{siret}")
async def verify_siret(siret: str):
    """
    Vérifie la validité d'un numéro SIRET via l'API gouvernementale française.
    Retourne les informations de l'entreprise si le SIRET est valide.
    """
    # Nettoyer le SIRET (retirer espaces et tirets)
    clean_siret = siret.replace(" ", "").replace("-", "")
    
    # Vérifier le format (14 chiffres)
    if not clean_siret.isdigit() or len(clean_siret) != 14:
        raise HTTPException(
            status_code=400, 
            detail="Le numéro SIRET doit contenir exactement 14 chiffres"
        )
    
    # Utiliser l'API recherche-entreprises.api.gouv.fr
    api_url = f"https://recherche-entreprises.api.gouv.fr/search?q={clean_siret}&mtm_campaign=worldauto"
    
    async with httpx.AsyncClient(timeout=15.0) as http_client:
        try:
            response = await http_client.get(api_url)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=503, 
                    detail="Service de vérification temporairement indisponible"
                )
            
            data = response.json()
            results = data.get("results", [])
            
            # Chercher l'établissement correspondant au SIRET exact
            found_etablissement = None
            found_entreprise = None
            
            for entreprise in results:
                # Vérifier le siège
                siege = entreprise.get("siege", {})
                if siege.get("siret") == clean_siret:
                    found_etablissement = siege
                    found_entreprise = entreprise
                    break
                
                # Vérifier les établissements correspondants
                matching = entreprise.get("matching_etablissements", [])
                for etab in matching:
                    if etab.get("siret") == clean_siret:
                        found_etablissement = etab
                        found_entreprise = entreprise
                        break
                if found_etablissement:
                    break
            
            if not found_etablissement:
                raise HTTPException(
                    status_code=404, 
                    detail="Numéro SIRET non trouvé. Vérifiez votre numéro ou assurez-vous que l'établissement est enregistré."
                )
            
            # Vérifier si l'établissement est actif
            etat = found_etablissement.get("etat_administratif", "A")
            if etat != "A":
                raise HTTPException(
                    status_code=400,
                    detail="Cet établissement n'est plus actif (fermé ou radié)"
                )
            
            return {
                "valid": True,
                "siret": clean_siret,
                "company_info": {
                    "siren": found_entreprise.get("siren", ""),
                    "denomination": found_entreprise.get("nom_complet") or found_entreprise.get("nom_raison_sociale", ""),
                    "sigle": found_entreprise.get("sigle"),
                    "nature_juridique": found_entreprise.get("nature_juridique", ""),
                    "activite_principale": found_etablissement.get("activite_principale", ""),
                    "adresse": {
                        "numero_voie": found_etablissement.get("numero_voie", ""),
                        "type_voie": found_etablissement.get("type_voie", ""),
                        "libelle_voie": found_etablissement.get("libelle_voie", ""),
                        "code_postal": found_etablissement.get("code_postal", ""),
                        "libelle_commune": found_etablissement.get("libelle_commune", ""),
                        "adresse_complete": found_etablissement.get("adresse") or found_etablissement.get("geo_adresse", "")
                    },
                    "etat_administratif": etat,
                    "date_creation": found_etablissement.get("date_creation", ""),
                    "est_siege": found_etablissement.get("est_siege", False)
                }
            }
            
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=503, 
                detail="Le service de vérification ne répond pas. Réessayez dans quelques instants."
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503, 
                detail="Erreur de connexion au service de vérification"
            )

# ================== PROFILE MANAGEMENT ==================

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    company_name: Optional[str] = None
    siret: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@api_router.put("/auth/profile")
async def update_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Mettre à jour les informations du profil"""
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    # Return updated user
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return updated_user

@api_router.put("/auth/password")
async def change_password(passwords: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Changer le mot de passe"""
    # Get user with password
    user = await db.users.find_one({"id": current_user["id"]})
    
    # Verify current password
    if not verify_password(passwords.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    
    # Update password
    hashed_password = hash_password(passwords.new_password)
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": hashed_password}}
    )
    
    return {"message": "Mot de passe modifié avec succès"}

@api_router.delete("/auth/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Supprimer le compte utilisateur"""
    user_id = current_user["id"]
    
    # Delete user's listings
    await db.listings.delete_many({"seller_id": user_id})
    
    # Delete user's messages
    await db.messages.delete_many({"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]})
    
    # Delete user's favorites
    await db.favorites.delete_many({"user_id": user_id})
    
    # Delete user's alerts
    await db.search_alerts.delete_many({"user_id": user_id})
    
    # Delete user's reviews (as buyer)
    await db.reviews.delete_many({"buyer_id": user_id})
    
    # Delete password reset tokens
    await db.password_resets.delete_many({"user_id": user_id})
    
    # Finally delete the user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "Compte supprimé avec succès"}

# ================== PASSWORD RESET ==================

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest, background_tasks: BackgroundTasks):
    """Demander une réinitialisation de mot de passe"""
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "Si cette adresse existe, un email a été envoyé."}
    
    # Generate reset token (valid for 1 hour)
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc).timestamp() + 3600  # 1 hour
    
    # Store reset token
    await db.password_resets.delete_many({"user_id": user["id"]})  # Remove old tokens
    await db.password_resets.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "token": reset_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email
    background_tasks.add_task(send_password_reset_email, user["email"], user["name"], reset_token)
    
    return {"message": "Si cette adresse existe, un email a été envoyé."}

@api_router.post("/auth/reset-password")
async def reset_password(request: PasswordResetConfirm):
    """Réinitialiser le mot de passe avec le token"""
    # Find valid token
    reset_doc = await db.password_resets.find_one({"token": request.token}, {"_id": 0})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré")
    
    # Check expiration
    if datetime.now(timezone.utc).timestamp() > reset_doc["expires_at"]:
        await db.password_resets.delete_one({"token": request.token})
        raise HTTPException(status_code=400, detail="Lien expiré. Veuillez refaire une demande.")
    
    # Update password
    hashed_password = hash_password(request.new_password)
    await db.users.update_one(
        {"id": reset_doc["user_id"]},
        {"$set": {"password": hashed_password}}
    )
    
    # Delete used token
    await db.password_resets.delete_one({"token": request.token})
    
    return {"message": "Mot de passe modifié avec succès"}

# ================== LISTINGS ROUTES ==================

@api_router.post("/listings", response_model=ListingResponse)
async def create_listing(listing: ListingCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
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
        "region": listing.region,
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
    
    # Check alerts and send notifications
    await check_and_send_alerts(listing_doc, background_tasks)
    
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
    region: Optional[str] = None,
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
    if region:
        query["region"] = region
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

# ================== FAVORITES ROUTES ==================

@api_router.post("/favorites/{listing_id}")
async def add_favorite(listing_id: str, current_user: dict = Depends(get_current_user)):
    """Ajouter une annonce aux favoris"""
    # Check if listing exists
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Check if already favorited
    existing = await db.favorites.find_one({"user_id": current_user["id"], "listing_id": listing_id})
    if existing:
        return {"message": "Déjà dans les favoris"}
    
    favorite_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "listing_id": listing_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.favorites.insert_one(favorite_doc)
    
    return {"message": "Ajouté aux favoris"}

@api_router.delete("/favorites/{listing_id}")
async def remove_favorite(listing_id: str, current_user: dict = Depends(get_current_user)):
    """Retirer une annonce des favoris"""
    result = await db.favorites.delete_one({"user_id": current_user["id"], "listing_id": listing_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favori non trouvé")
    return {"message": "Retiré des favoris"}

@api_router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    """Récupérer les annonces favorites de l'utilisateur"""
    favorites = await db.favorites.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    # Get listing details for each favorite
    listing_ids = [f["listing_id"] for f in favorites]
    listings = await db.listings.find({"id": {"$in": listing_ids}}, {"_id": 0}).to_list(100)
    
    return listings

@api_router.get("/favorites/check/{listing_id}")
async def check_favorite(listing_id: str, current_user: dict = Depends(get_current_user)):
    """Vérifier si une annonce est dans les favoris"""
    favorite = await db.favorites.find_one({"user_id": current_user["id"], "listing_id": listing_id})
    return {"is_favorite": favorite is not None}

# ================== SEARCH ALERTS ROUTES ==================

class SearchAlertCreate(BaseModel):
    name: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    postal_code: Optional[str] = None
    keywords: Optional[str] = None

@api_router.post("/alerts")
async def create_alert(alert: SearchAlertCreate, current_user: dict = Depends(get_current_user)):
    """Créer une alerte de recherche"""
    # Limit alerts per user
    count = await db.search_alerts.count_documents({"user_id": current_user["id"]})
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 alertes par utilisateur")
    
    alert_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "user_name": current_user["name"],
        "name": alert.name,
        "category": alert.category,
        "subcategory": alert.subcategory,
        "brand": alert.brand,
        "model": alert.model,
        "min_price": alert.min_price,
        "max_price": alert.max_price,
        "min_year": alert.min_year,
        "max_year": alert.max_year,
        "postal_code": alert.postal_code,
        "keywords": alert.keywords,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.search_alerts.insert_one(alert_doc)
    
    return {"id": alert_doc["id"], "message": "Alerte créée"}

@api_router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    """Récupérer les alertes de l'utilisateur"""
    alerts = await db.search_alerts.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(20)
    return alerts

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    """Supprimer une alerte"""
    result = await db.search_alerts.delete_one({"id": alert_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return {"message": "Alerte supprimée"}

@api_router.put("/alerts/{alert_id}/toggle")
async def toggle_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    """Activer/désactiver une alerte"""
    alert = await db.search_alerts.find_one({"id": alert_id, "user_id": current_user["id"]})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    
    new_status = not alert.get("active", True)
    await db.search_alerts.update_one({"id": alert_id}, {"$set": {"active": new_status}})
    
    return {"active": new_status}

async def check_and_send_alerts(listing: dict, background_tasks: BackgroundTasks):
    """Vérifie les alertes et envoie des emails pour les correspondances"""
    # Get all active alerts
    alerts = await db.search_alerts.find({"active": True}, {"_id": 0}).to_list(1000)
    
    for alert in alerts:
        # Skip if same user (don't alert for own listings)
        if alert["user_id"] == listing["seller_id"]:
            continue
        
        # Check if listing matches alert criteria
        if alert.get("category") and alert["category"] != listing.get("category"):
            continue
        if alert.get("subcategory") and alert["subcategory"] != listing.get("subcategory"):
            continue
        if alert.get("brand") and alert["brand"].lower() not in listing.get("brand", "").lower():
            continue
        if alert.get("model") and alert["model"].lower() not in listing.get("model", "").lower():
            continue
        if alert.get("min_price") and listing.get("price", 0) < alert["min_price"]:
            continue
        if alert.get("max_price") and listing.get("price", 0) > alert["max_price"]:
            continue
        if alert.get("min_year") and listing.get("year", 0) < alert["min_year"]:
            continue
        if alert.get("max_year") and listing.get("year", 9999) > alert["max_year"]:
            continue
        if alert.get("postal_code") and not listing.get("postal_code", "").startswith(alert["postal_code"][:2]):
            continue
        if alert.get("keywords"):
            keywords = alert["keywords"].lower()
            title = listing.get("title", "").lower()
            desc = listing.get("description", "").lower()
            if keywords not in title and keywords not in desc:
                continue
        
        # Match found - send email
        background_tasks.add_task(
            send_search_alert_email,
            alert["user_email"],
            alert["user_name"],
            alert,
            listing
        )

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
    # Return the message without MongoDB's _id field
    return {k: v for k, v in message_doc.items() if k != "_id"}

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
async def create_order(order: OrderCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
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
    
    # Send notification emails
    background_tasks.add_task(send_new_order_seller_email, seller.get("email"), seller.get("name"), order_doc)
    background_tasks.add_task(send_new_order_buyer_email, current_user.get("email"), current_user.get("name"), order_doc)
    
    # Send admin notification email
    buyer_info = {"name": current_user.get("name"), "email": current_user.get("email"), "phone": current_user.get("phone")}
    seller_info = {"name": seller.get("name"), "email": seller.get("email")}
    background_tasks.add_task(send_new_order_admin_email, order_doc, buyer_info, seller_info)
    
    return order_doc

@api_router.post("/orders/checkout")
async def checkout_cart(checkout: CartCheckout, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Créer plusieurs commandes depuis le panier (checkout groupé)"""
    if not checkout.listing_ids:
        raise HTTPException(status_code=400, detail="Le panier est vide")
    
    created_orders = []
    errors = []
    
    for listing_id in checkout.listing_ids:
        try:
            # Get listing
            listing = await db.listings.find_one({"id": listing_id, "status": "active"}, {"_id": 0})
            if not listing:
                errors.append({"listing_id": listing_id, "error": "Annonce non trouvée ou déjà vendue"})
                continue
            
            if listing["seller_id"] == current_user["id"]:
                errors.append({"listing_id": listing_id, "error": "Vous ne pouvez pas acheter votre propre annonce"})
                continue
            
            # Get seller info
            seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0, "password": 0})
            
            order_doc = {
                "id": str(uuid.uuid4()),
                "listing_id": listing_id,
                "listing_title": listing["title"],
                "price": listing["price"],
                "oem_reference": listing.get("oem_reference"),
                "seller_id": listing["seller_id"],
                "seller_name": listing["seller_name"],
                "seller_address": seller.get("address", "") if seller else "",
                "seller_city": seller.get("city", "") if seller else "",
                "seller_postal": seller.get("postal_code", "") if seller else "",
                "seller_phone": seller.get("phone", "") if seller else "",
                "buyer_id": current_user["id"],
                "buyer_name": current_user["name"],
                "buyer_address": checkout.buyer_address,
                "buyer_city": checkout.buyer_city,
                "buyer_postal": checkout.buyer_postal,
                "buyer_phone": checkout.buyer_phone or current_user.get("phone", ""),
                "status": "confirmed",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "shipped_at": None,
                "delivered_at": None
            }
            
            await db.orders.insert_one(order_doc)
            
            # Mark listing as sold
            await db.listings.update_one({"id": listing_id}, {"$set": {"status": "sold"}})
            
            # Send notification emails
            if seller:
                background_tasks.add_task(send_new_order_seller_email, seller.get("email"), seller.get("name"), order_doc)
            background_tasks.add_task(send_new_order_buyer_email, current_user.get("email"), current_user.get("name"), order_doc)
            
            # Send admin notification email
            buyer_info = {"name": current_user.get("name"), "email": current_user.get("email"), "phone": current_user.get("phone")}
            seller_info = {"name": seller.get("name") if seller else "N/A", "email": seller.get("email") if seller else ""}
            background_tasks.add_task(send_new_order_admin_email, order_doc, buyer_info, seller_info)
            
            created_orders.append(order_doc)
            
        except Exception as e:
            errors.append({"listing_id": listing_id, "error": str(e)})
    
    if not created_orders and errors:
        raise HTTPException(status_code=400, detail={"message": "Aucune commande n'a pu être créée", "errors": errors})
    
    return {
        "success": True,
        "orders_created": len(created_orders),
        "total_amount": sum(o["price"] for o in created_orders),
        "orders": created_orders,
        "errors": errors if errors else None
    }

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
async def update_order_status(order_id: str, status: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
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
        # Get buyer info and send email
        buyer = await db.users.find_one({"id": order["buyer_id"]}, {"_id": 0, "password": 0})
        if buyer:
            background_tasks.add_task(send_order_shipped_email, buyer.get("email"), buyer.get("name"), order)
    
    # Buyer can mark as delivered
    elif status == "delivered" and order["buyer_id"] == current_user["id"]:
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"status": "delivered", "delivered_at": datetime.now(timezone.utc).isoformat()}}
        )
        # Get seller info and send email
        seller = await db.users.find_one({"id": order["seller_id"]}, {"_id": 0, "password": 0})
        if seller:
            background_tasks.add_task(send_order_delivered_email, seller.get("email"), seller.get("name"), order)
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
async def request_return(order_id: str, return_req: ReturnRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
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
    
    # Send email to seller
    seller = await db.users.find_one({"id": order["seller_id"]}, {"_id": 0, "password": 0})
    if seller:
        background_tasks.add_task(send_return_request_email, seller.get("email"), seller.get("name"), return_doc)
    
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

# ================== SELLER STATS ROUTES ==================

@api_router.get("/seller/stats")
async def get_seller_stats(current_user: dict = Depends(get_current_user)):
    """Récupérer les statistiques du vendeur"""
    user_id = current_user["id"]
    
    # Get all listings
    listings = await db.listings.find({"seller_id": user_id}, {"_id": 0}).to_list(1000)
    total_listings = len(listings)
    active_listings = len([l for l in listings if l.get("status") == "active"])
    sold_listings = len([l for l in listings if l.get("status") == "sold"])
    total_views = sum(l.get("views", 0) for l in listings)
    
    # Get all orders as seller
    orders = await db.orders.find({"seller_id": user_id}, {"_id": 0}).to_list(1000)
    total_orders = len(orders)
    completed_orders = len([o for o in orders if o.get("status") == "delivered"])
    total_revenue = sum(o.get("price", 0) for o in orders if o.get("status") == "delivered")
    
    # Get reviews
    reviews = await db.reviews.find({"seller_id": user_id}, {"_id": 0}).to_list(1000)
    total_reviews = len(reviews)
    average_rating = round(sum(r.get("rating", 0) for r in reviews) / total_reviews, 1) if total_reviews > 0 else 0
    
    return {
        "total_listings": total_listings,
        "active_listings": active_listings,
        "sold_listings": sold_listings,
        "total_views": total_views,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_revenue": total_revenue,
        "total_reviews": total_reviews,
        "average_rating": average_rating
    }

@api_router.get("/seller/{seller_id}/profile")
async def get_seller_profile(seller_id: str):
    """Récupérer le profil public d'un vendeur"""
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "password": 0, "email": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")
    
    # Get seller stats
    listings = await db.listings.find({"seller_id": seller_id, "status": "active"}, {"_id": 0}).to_list(100)
    sold_count = await db.listings.count_documents({"seller_id": seller_id, "status": "sold"})
    
    # Get reviews
    reviews = await db.reviews.find({"seller_id": seller_id}, {"_id": 0}).to_list(100)
    total_reviews = len(reviews)
    average_rating = round(sum(r.get("rating", 0) for r in reviews) / total_reviews, 1) if total_reviews > 0 else 0
    
    return {
        "id": seller["id"],
        "name": seller["name"],
        "is_professional": seller.get("is_professional", False),
        "company_name": seller.get("company_name"),
        "city": seller.get("city"),
        "created_at": seller.get("created_at"),
        "active_listings": len(listings),
        "sold_count": sold_count,
        "total_reviews": total_reviews,
        "average_rating": average_rating,
        "reviews": reviews[:10]  # 10 derniers avis
    }

# ================== REVIEWS ROUTES ==================

class ReviewCreate(BaseModel):
    order_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Créer un avis après une commande livrée"""
    # Verify order exists and belongs to buyer
    order = await db.orders.find_one({
        "id": review.order_id,
        "buyer_id": current_user["id"],
        "status": "delivered"
    }, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=400, detail="Commande non trouvée ou non livrée")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({"order_id": review.order_id})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour cette commande")
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "order_id": review.order_id,
        "listing_id": order["listing_id"],
        "listing_title": order["listing_title"],
        "seller_id": order["seller_id"],
        "seller_name": order["seller_name"],
        "buyer_id": current_user["id"],
        "buyer_name": current_user["name"],
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    return {"message": "Avis publié", "review": review_doc}

@api_router.get("/reviews/seller/{seller_id}")
async def get_seller_reviews(seller_id: str, limit: int = 20):
    """Récupérer les avis d'un vendeur"""
    reviews = await db.reviews.find(
        {"seller_id": seller_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    # Calculate stats
    total = len(reviews)
    average = round(sum(r["rating"] for r in reviews) / total, 1) if total > 0 else 0
    
    # Rating distribution
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        distribution[r["rating"]] += 1
    
    return {
        "reviews": reviews,
        "total": total,
        "average": average,
        "distribution": distribution
    }

@api_router.get("/reviews/pending")
async def get_pending_reviews(current_user: dict = Depends(get_current_user)):
    """Récupérer les commandes livrées sans avis"""
    # Get delivered orders
    orders = await db.orders.find({
        "buyer_id": current_user["id"],
        "status": "delivered"
    }, {"_id": 0}).to_list(100)
    
    # Get existing reviews
    order_ids = [o["id"] for o in orders]
    reviewed = await db.reviews.find({"order_id": {"$in": order_ids}}, {"order_id": 1}).to_list(100)
    reviewed_ids = [r["order_id"] for r in reviewed]
    
    # Filter out reviewed orders
    pending = [o for o in orders if o["id"] not in reviewed_ids]
    
    return pending

# ================== SETTINGS ROUTES ==================

DEFAULT_HERO_SETTINGS = {
    "hero_title_line1": "La marketplace auto",
    "hero_title_line2": "pour tous",
    "hero_description": "Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.",
    "hero_image": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2832&auto=format&fit=crop",
    "hero_cta_text": "Déposer une annonce",
    "hero_cta_link": "/deposer"
}

@api_router.get("/settings/hero")
async def get_hero_settings():
    """Récupérer les paramètres du hero"""
    settings = await db.settings.find_one({"type": "hero"}, {"_id": 0})
    if settings:
        return settings
    return DEFAULT_HERO_SETTINGS

@api_router.post("/settings/hero")
async def save_hero_settings(settings: dict, current_user: dict = Depends(get_current_user)):
    """Sauvegarder les paramètres du hero"""
    settings["type"] = "hero"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    settings["updated_by"] = current_user["id"]
    
    await db.settings.update_one(
        {"type": "hero"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Paramètres sauvegardés"}

# ================== SHIPPING ROUTES ==================

CARRIERS = {
    "colissimo": {"name": "Colissimo", "logo": "📦"},
    "mondial_relay": {"name": "Mondial Relay", "logo": "🏪"},
    "chronopost": {"name": "Chronopost", "logo": "⚡"},
    "lettre_suivie": {"name": "Lettre Suivie", "logo": "✉️"}
}

@api_router.get("/carriers")
async def get_carriers():
    """Liste des transporteurs disponibles"""
    return CARRIERS

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
