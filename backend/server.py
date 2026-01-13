from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, File, UploadFile, BackgroundTasks, WebSocket, WebSocketDisconnect, Body, Form
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
from datetime import datetime, timezone, timedelta
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
from emergentintegrations.llm.chat import LlmChat, UserMessage
from pywebpush import webpush, WebPushException
import json

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
NEWSLETTER_SECRET_KEY = os.environ.get('NEWSLETTER_SECRET_KEY', '')  # Clé secrète pour l'envoi auto

# ================== EMAIL SERVICE ==================

def send_email(to_email: str, subject: str, html_content: str):
    """Send email via SMTP with improved deliverability"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"World Auto France <{SMTP_USER}>"
        msg['To'] = to_email
        msg['Reply-To'] = SMTP_USER
        msg['X-Mailer'] = 'World Auto France'
        msg['MIME-Version'] = '1.0'
        
        # Add plain text version for better deliverability
        plain_text = html_content.replace('<br>', '\n').replace('<br/>', '\n')
        import re
        plain_text = re.sub('<[^<]+?>', '', plain_text)
        
        text_part = MIMEText(plain_text, 'plain', 'utf-8')
        html_part = MIMEText(html_content, 'html', 'utf-8')
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        logging.info(f"Attempting to send email to {to_email} via {SMTP_HOST}:{SMTP_PORT}")
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            result = server.sendmail(SMTP_USER, to_email, msg.as_string())
            logging.info(f"SMTP sendmail result: {result}")
        
        logging.info(f"✅ Email successfully sent to {to_email}: {subject}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        logging.error(f"❌ SMTP Authentication error: {e}")
        return False
    except smtplib.SMTPRecipientsRefused as e:
        logging.error(f"❌ Recipient refused: {e}")
        return False
    except smtplib.SMTPException as e:
        logging.error(f"❌ SMTP error sending to {to_email}: {e}")
        return False
    except Exception as e:
        logging.error(f"❌ Failed to send email to {to_email}: {type(e).__name__}: {e}")
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

def send_new_listing_admin_email(listing: dict, seller_info: dict):
    """Email à l'administrateur : nouvelle annonce publiée"""
    listing_date = datetime.fromisoformat(listing['created_at'].replace('Z', '+00:00')) if isinstance(listing.get('created_at'), str) else datetime.now()
    formatted_date = listing_date.strftime("%d/%m/%Y à %H:%M")
    
    category_labels = {
        "pieces": "Pièces Détachées",
        "voitures": "Voitures",
        "motos": "Motos",
        "utilitaires": "Utilitaires",
        "accessoires": "Accessoires"
    }
    
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1E3A5F; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🚗 World Auto - Admin</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1E3A5F;">📢 Nouvelle annonce publiée !</h2>
            <p style="color: #666;">Publiée le {formatted_date}</p>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1E3A5F;">
                <h3 style="margin: 0 0 10px 0; color: #1E3A5F;">📦 Détails de l'annonce</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Titre :</td>
                        <td style="padding: 5px 0; font-weight: bold;">{listing['title']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Catégorie :</td>
                        <td style="padding: 5px 0;">{category_labels.get(listing.get('category', ''), listing.get('category', 'N/A'))}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Prix :</td>
                        <td style="padding: 5px 0; font-weight: bold; color: #f97316; font-size: 18px;">{listing['price']} €</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Localisation :</td>
                        <td style="padding: 5px 0;">{listing.get('location', 'N/A')} ({listing.get('postal_code', '')})</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0;">👤 Vendeur</h4>
                <p style="margin: 5px 0;"><strong>{seller_info.get('name', 'N/A')}</strong> {'🏢 PRO' if seller_info.get('is_pro') else '👤 Particulier'}</p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">{seller_info.get('email', 'N/A')}</p>
            </div>
            
            <a href="{SITE_URL}/annonce/{listing['id']}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir l'annonce</a>
        </div>
    </div>
    """
    send_email(ADMIN_EMAIL, f"📢 Nouvelle annonce - {listing['title']} - {listing['price']} €", html)

def send_listing_confirmation_email(seller_email: str, seller_name: str, listing: dict):
    """Email au vendeur : confirmation de mise en ligne de l'annonce"""
    listing_date = datetime.fromisoformat(listing['created_at'].replace('Z', '+00:00')) if isinstance(listing.get('created_at'), str) else datetime.now()
    formatted_date = listing_date.strftime("%d/%m/%Y à %H:%M")
    
    category_labels = {
        "pieces": "Pièces Détachées",
        "voitures": "Voitures",
        "motos": "Motos",
        "utilitaires": "Utilitaires",
        "accessoires": "Accessoires"
    }
    
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0F2744 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚗 World Auto France</h1>
            <p style="color: #60A5FA; margin: 10px 0 0 0;">Marketplace de pièces automobiles</p>
        </div>
        <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1E3A5F; margin-top: 0;">✅ Votre annonce est en ligne !</h2>
            <p>Bonjour {seller_name},</p>
            <p>Félicitations ! Votre annonce a été publiée avec succès et est désormais visible par tous les acheteurs.</p>
            
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #1E3A5F;">
                <h3 style="margin: 0 0 15px 0; color: #1E3A5F;">📦 Récapitulatif de votre annonce</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748B;">Titre :</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #0F172A;">{listing['title']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748B;">Catégorie :</td>
                        <td style="padding: 8px 0; color: #0F172A;">{category_labels.get(listing.get('category', ''), listing.get('category', 'N/A'))}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748B;">Prix :</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #F97316; font-size: 18px;">{listing['price']} €</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748B;">Publiée le :</td>
                        <td style="padding: 8px 0; color: #0F172A;">{formatted_date}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #FFF7ED; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F97316;">
                <h4 style="margin: 0 0 10px 0; color: #C2410C;">💡 Conseils pour vendre rapidement</h4>
                <ul style="margin: 0; padding-left: 20px; color: #9A3412;">
                    <li style="margin-bottom: 5px;">Ajoutez des photos de qualité sous plusieurs angles</li>
                    <li style="margin-bottom: 5px;">Répondez rapidement aux messages des acheteurs</li>
                    <li style="margin-bottom: 5px;">Précisez les références et la compatibilité</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="{SITE_URL}/annonce/{listing['id']}" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Voir mon annonce</a>
            </div>
            
            <p style="margin-top: 30px; color: #64748B; font-size: 14px;">
                Vous pouvez modifier ou supprimer votre annonce à tout moment depuis votre <a href="{SITE_URL}/tableau-de-bord" style="color: #1E3A5F;">tableau de bord</a>.
            </p>
        </div>
        <div style="background: #F1F5F9; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #64748B; font-size: 12px;">
                World Auto France - La marketplace des pièces automobiles<br/>
                <a href="{SITE_URL}" style="color: #1E3A5F;">www.worldautofrance.com</a>
            </p>
        </div>
    </div>
    """
    send_email(seller_email, f"✅ Votre annonce \"{listing['title']}\" est en ligne !", html)

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

# Import and setup radio routes
from routes.radio import router as radio_router, set_db as set_radio_db
set_radio_db(db)
app.include_router(radio_router)

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
    country: str = "France"  # Pays obligatoire
    referral_code: Optional[str] = None  # Code de parrainage
    promo_code: Optional[str] = None  # Code promo (ex: LANCEMENT)

# ================== SYSTÈME PROMO LANCEMENT ==================
PROMO_CODES = {
    "LANCEMENT": {
        "free_ads": 20,  # Annonces gratuites par utilisateur (modifié de 100 à 20)
        "total_limit": 1000,  # Limite globale d'annonces gratuites
        "active": True,
        "description": "Offre de lancement - 1000 premières annonces gratuites"
    }
}

# Pays autorisés pour l'inscription
ALLOWED_COUNTRIES = [
    "France",
    "Belgique", 
    "Suisse",
    "Allemagne",
    "Pays-Bas",
    "Italie",
    "Espagne",
    "Portugal",
    "Suède"
]

# ================== CONTENT MODERATION SYSTEM ==================

# Liste de mots grossiers/interdits (français)
FORBIDDEN_WORDS = [
    # Insultes courantes
    "merde", "putain", "bordel", "connard", "connasse", "salaud", "salope",
    "enculé", "enculer", "nique", "niquer", "ntm", "fdp", "pd", "pute",
    "batard", "bâtard", "con", "conne", "couille", "bite", "queue", "chier",
    "foutre", "baiser", "tg", "ta gueule", "ferme ta gueule", "ftg",
    "petasse", "pétasse", "trouduc", "trou du cul", "bouffon", "abruti",
    "debile", "débile", "cretin", "crétin", "imbecile", "imbécile",
    # Racisme/discrimination
    "negre", "nègre", "bougnoule", "arabe", "youpin", "feuj", "rebeu",
    "negro", "bamboula", "bicot", "raton", "sale noir", "sale blanc",
    "sale arabe", "sale juif", "nazi", "hitler",
    # Menaces
    "je vais te tuer", "je te tue", "crever", "mourir", "suicide",
    "te buter", "te defoncer", "te défoncer", "casser la gueule",
    # Arnaques
    "arnaque", "arnaqueur", "escroc", "voleur", "menteur",
    # Spam/Hors sujet
    "bitcoin", "crypto", "investissement", "forex", "casino", "porno",
    "sexe", "xxx", "viagra", "cialis",
]

# Mots sensibles qui nécessitent une vérification contextuelle
SENSITIVE_WORDS = [
    "avocat", "justice", "procès", "plainte", "police", "gendarmerie",
    "tribunal", "poursuite", "dommages", "remboursement",
]

def normalize_text(text: str) -> str:
    """Normalise le texte pour la détection (minuscules, sans accents basiques)"""
    import unicodedata
    text = text.lower()
    # Remplacer les caractères accentués
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    # Supprimer les caractères spéciaux répétés (contournement)
    text = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in text)
    return text

def contains_forbidden_words(text: str) -> tuple[bool, list]:
    """Vérifie si le texte contient des mots interdits"""
    normalized = normalize_text(text)
    found_words = []
    
    for word in FORBIDDEN_WORDS:
        normalized_word = normalize_text(word)
        if normalized_word in normalized:
            found_words.append(word)
    
    return len(found_words) > 0, found_words

def contains_sensitive_words(text: str) -> tuple[bool, list]:
    """Vérifie si le texte contient des mots sensibles"""
    normalized = normalize_text(text)
    found_words = []
    
    for word in SENSITIVE_WORDS:
        normalized_word = normalize_text(word)
        if normalized_word in normalized:
            found_words.append(word)
    
    return len(found_words) > 0, found_words

async def moderate_content(text: str, context: str = "general") -> dict:
    """
    Modère le contenu d'un texte
    Retourne: {"allowed": bool, "reason": str, "flagged_words": list}
    """
    if not text or len(text.strip()) < 2:
        return {"allowed": False, "reason": "Message trop court", "flagged_words": []}
    
    # Vérification des mots interdits
    has_forbidden, forbidden_list = contains_forbidden_words(text)
    if has_forbidden:
        return {
            "allowed": False,
            "reason": "Votre message contient des termes inappropriés. Merci de rester courtois.",
            "flagged_words": forbidden_list
        }
    
    # Vérification des mots sensibles (avertissement mais autorisé)
    has_sensitive, sensitive_list = contains_sensitive_words(text)
    
    # Vérification de la longueur excessive (spam potentiel)
    if len(text) > 2000:
        return {
            "allowed": False,
            "reason": "Message trop long (max 2000 caractères)",
            "flagged_words": []
        }
    
    # Vérification des liens suspects
    suspicious_domains = ["bit.ly", "tinyurl", "t.co", ".ru", ".cn", "forex", "crypto"]
    text_lower = text.lower()
    for domain in suspicious_domains:
        if domain in text_lower:
            return {
                "allowed": False,
                "reason": "Les liens externes ne sont pas autorisés dans les messages",
                "flagged_words": [domain]
            }
    
    # Vérification des répétitions excessives (spam)
    words = text.split()
    if len(words) > 5:
        word_count = {}
        for word in words:
            word_lower = word.lower()
            word_count[word_lower] = word_count.get(word_lower, 0) + 1
        
        for word, count in word_count.items():
            if count > 5 and len(word) > 2:
                return {
                    "allowed": False,
                    "reason": "Message détecté comme spam (répétitions excessives)",
                    "flagged_words": [word]
                }
    
    return {
        "allowed": True,
        "reason": "OK",
        "flagged_words": [],
        "has_sensitive": has_sensitive,
        "sensitive_words": sensitive_list if has_sensitive else []
    }

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
    shipping_cost: Optional[float] = None  # Frais de port (None = à définir, 0 = gratuit)
    shipping_info: Optional[str] = None  # Infos livraison supplémentaires
    shipping_methods: List[str] = []  # Modes de livraison: hand_delivery, colissimo, mondial_relay, chronopost, boxtal, custom
    # Compatibilité véhicule
    compatible_brands: List[str] = []  # Marques compatibles
    compatible_models: List[str] = []  # Modèles compatibles
    compatible_years: Optional[str] = None  # Ex: "2015-2020"
    oem_reference: Optional[str] = None  # Référence constructeur OEM
    aftermarket_reference: Optional[str] = None  # Référence équipementier
    video_url: Optional[str] = None  # URL de la vidéo de présentation
    # Confiance & Garantie
    part_origin: Optional[str] = None  # casse, particulier, professionnel, neuf
    vehicle_mileage: Optional[int] = None  # Kilométrage du véhicule d'origine
    vehicle_vin: Optional[str] = None  # VIN du véhicule d'origine (optionnel)
    has_warranty: bool = False  # Garantie World Auto activée
    warranty_duration: Optional[int] = None  # Durée garantie en mois (3, 6, 12)

# Options de garantie World Auto
WARRANTY_OPTIONS = {
    3: {"price": 4.99, "label": "3 mois"},
    6: {"price": 7.99, "label": "6 mois"},
    12: {"price": 12.99, "label": "12 mois"}
}

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

# Sous-catégories Motos
MOTOS_SUBCATEGORIES = {
    "moto_routiere": "Motos routières",
    "moto_sportive": "Motos sportives",
    "moto_cross": "Motos cross / Enduro",
    "moto_custom": "Motos custom / Chopper",
    "scooter": "Scooters",
    "trottinette": "Trottinettes électriques",
    "velo_electrique": "Vélos électriques",
    "quad": "Quads",
    "pieces_moto": "Pièces détachées moto",
    "equipement_moto": "Équipement motard",
    "autre_moto": "Autres deux-roues"
}

# Sous-catégories Utilitaires
UTILITAIRES_SUBCATEGORIES = {
    "fourgon": "Fourgons / Fourgonnettes",
    "camionnette": "Camionnettes",
    "pickup": "Pick-up",
    "poids_lourd": "Poids lourds",
    "camion": "Camions",
    "tracteur": "Tracteurs routiers",
    "remorque": "Remorques",
    "bus": "Bus / Minibus",
    "pieces_utilitaire": "Pièces détachées utilitaire",
    "autre_utilitaire": "Autres utilitaires"
}

ENGINS_SUBCATEGORIES = {
    "agricole": "Engins agricoles",
    "chantier": "Engins de chantier",
    "tracteur_agricole": "Tracteurs agricoles",
    "moissonneuse": "Moissonneuses-batteuses",
    "pelleteuse": "Pelleteuses / Excavatrices",
    "chargeuse": "Chargeuses",
    "bulldozer": "Bulldozers",
    "grue": "Grues",
    "nacelle": "Nacelles élévatrices",
    "compacteur": "Compacteurs / Rouleaux",
    "chariot_elevateur": "Chariots élévateurs",
    "pieces_engin": "Pièces détachées engins",
    "autre_engin": "Autres engins"
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
    shipping_cost: Optional[float] = None
    shipping_info: Optional[str] = None
    shipping_methods: List[str] = []
    # Compatibilité véhicule
    compatible_brands: List[str] = []
    compatible_models: List[str] = []
    compatible_years: Optional[str] = None
    oem_reference: Optional[str] = None
    aftermarket_reference: Optional[str] = None
    video_url: Optional[str] = None
    part_origin: Optional[str] = None
    vehicle_mileage: Optional[int] = None
    has_warranty: bool = False
    warranty_duration: Optional[int] = None
    is_promo_free: bool = False

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
    # Packs ponctuels (occasionnels)
    "single": {"name": "Annonce Unique", "price": 2.00, "credits": 1, "duration": 30, "max_photos": 6},
    "pack3": {"name": "Pack Starter", "price": 5.00, "credits": 3, "duration": 30, "max_photos": 8, "badge": "Idéal pour débuter"},
    "pack5": {"name": "Pack 5 Annonces", "price": 8.00, "credits": 5, "duration": 30, "max_photos": 10},
    "pack20": {"name": "Pack 20 Annonces", "price": 25.00, "credits": 20, "duration": 30, "max_photos": 15, "bonus_points": 50},
    "pack50": {"name": "Pack 50 Annonces", "price": 39.00, "credits": 50, "duration": 30, "max_photos": 20, "bonus_points": 150, "badge": "Populaire"},
    "pack100": {"name": "Pack 100 Annonces", "price": 69.00, "credits": 100, "duration": 60, "max_photos": 25, "bonus_points": 400, "badge": "Meilleur rapport"},
    
    # Abonnements Pro (crédits mensuels + avantages)
    "pro_monthly": {"name": "Pro Mensuel", "price": 29.00, "credits": 30, "duration": 30, "is_pro": True, "max_photos": 50, "badge": "PRO"},
    "pro_3months": {"name": "Pro Trimestriel", "price": 69.00, "credits": 100, "duration": 90, "is_pro": True, "max_photos": 50, "badge": "PRO", "savings": "20%"},
    "pro_6months": {"name": "Pro Semestriel", "price": 119.00, "credits": 200, "duration": 180, "is_pro": True, "max_photos": 50, "badge": "PRO", "savings": "32%"},
    "pro_annual": {"name": "Pro Annuel", "price": 199.00, "credits": 500, "duration": 365, "is_pro": True, "max_photos": 50, "badge": "PRO ⭐", "savings": "45%"},
    
    # Essai gratuit
    "pro_trial": {"name": "Essai PRO 14 jours", "price": 0.00, "credits": 10, "duration": 14, "is_pro": True, "max_photos": 50, "is_trial": True}
}

# Extra photos package
EXTRA_PHOTOS_PACKAGE = {
    "price": 1.00,
    "photos": 15,
    "name": "+15 Photos supplémentaires"
}

# Default photo limits
DEFAULT_MAX_PHOTOS = 6  # For users without a specific package
PRO_MAX_PHOTOS = 50     # For pro users

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

async def get_current_user_optional(request: Request) -> Optional[dict]:
    """Récupérer l'utilisateur actuel si connecté, sinon None"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        return user
    except:
        return None

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register")
async def register(user: UserCreate, background_tasks: BackgroundTasks):
    # Note: Les acheteurs peuvent s'inscrire de n'importe quel pays
    # La restriction des pays s'applique uniquement aux vendeurs (création d'annonces)
    
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Generate unique referral code for new user
    my_referral_code = generate_referral_code(user.name)
    # Make sure it's unique
    while await db.users.find_one({"referral_code": my_referral_code}):
        my_referral_code = generate_referral_code(user.name)
    
    # Check if referral code is provided and valid
    referred_by = None
    referrer = None
    if user.referral_code:
        referrer = await db.users.find_one({"referral_code": user.referral_code.upper()}, {"_id": 0})
        if referrer:
            referred_by = referrer["id"]
    
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
        "country": user.country,
        "credits": 0,
        "referral_code": my_referral_code,
        "referred_by": referred_by,
        "referral_count": 0,
        "loyalty_points": SIGNUP_BONUS_POINTS + (REFERRAL_REWARDS["referee_points"] if referred_by else 0),
        "loyalty_lifetime_points": SIGNUP_BONUS_POINTS + (REFERRAL_REWARDS["referee_points"] if referred_by else 0),
        "free_ads_remaining": 0,  # Annonces gratuites restantes
        "promo_code_used": None,  # Code promo utilisé à l'inscription
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # ================== GESTION CODE PROMO LANCEMENT ==================
    if user.promo_code and user.promo_code.upper() in PROMO_CODES:
        promo = PROMO_CODES[user.promo_code.upper()]
        if promo["active"]:
            # Vérifier la limite globale
            promo_stats = await db.promo_stats.find_one({"code": user.promo_code.upper()})
            total_used = promo_stats.get("total_ads_claimed", 0) if promo_stats else 0
            
            if total_used < promo["total_limit"]:
                # Calculer combien d'annonces gratuites on peut donner
                remaining_global = promo["total_limit"] - total_used
                free_ads_to_give = min(promo["free_ads"], remaining_global)
                
                user_doc["free_ads_remaining"] = free_ads_to_give
                user_doc["promo_code_used"] = user.promo_code.upper()
                
                # Mettre à jour les stats promo
                await db.promo_stats.update_one(
                    {"code": user.promo_code.upper()},
                    {
                        "$inc": {"total_ads_claimed": free_ads_to_give, "users_count": 1},
                        "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}
                    },
                    upsert=True
                )
    
    # Check for pending credits
    pending_credits = await db.pending_credits.find_one({"email": user.email.lower()})
    if pending_credits:
        user_doc["credits"] = pending_credits.get("credits", 0)
        # Delete pending credits after applying
        await db.pending_credits.delete_one({"email": user.email.lower()})
    
    # ================== ESSAI PRO AUTOMATIQUE POUR LES PROFESSIONNELS ==================
    if user.is_professional:
        trial_pack = PRICING_PACKAGES["pro_trial"]
        trial_end = datetime.now(timezone.utc) + timedelta(days=14)
        user_doc["credits"] = user_doc.get("credits", 0) + trial_pack["credits"]  # +10 crédits
        user_doc["pro_trial_used"] = True
        user_doc["pro_trial_start"] = datetime.now(timezone.utc).isoformat()
        user_doc["pro_trial_end"] = trial_end.isoformat()
        user_doc["max_photos_per_listing"] = trial_pack["max_photos"]  # 50 photos
    
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["email"])
    
    # Handle referral rewards
    if referrer:
        # Give points to referrer
        await db.users.update_one(
            {"id": referrer["id"]},
            {
                "$inc": {
                    "loyalty_points": REFERRAL_REWARDS["referrer_points"],
                    "loyalty_lifetime_points": REFERRAL_REWARDS["referrer_points"],
                    "referral_count": 1
                }
            }
        )
        
        # Create referral record
        referral_doc = {
            "id": str(uuid.uuid4()),
            "referrer_id": referrer["id"],
            "referee_id": user_doc["id"],
            "referee_name": user_doc["name"],
            "referee_email": user_doc["email"],
            "points_awarded": REFERRAL_REWARDS["referrer_points"],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.referrals.insert_one(referral_doc)
        
        # Add to referrer's loyalty history
        await db.loyalty_history.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": referrer["id"],
            "points": REFERRAL_REWARDS["referrer_points"],
            "description": f"Parrainage: {user_doc['name']} a rejoint World Auto",
            "type": "referral",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Add to new user's loyalty history
        await db.loyalty_history.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_doc["id"],
            "points": REFERRAL_REWARDS["referee_points"],
            "description": f"Bonus de bienvenue: Parrainé par {referrer['name']}",
            "type": "referral_bonus",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Send welcome email in background
    background_tasks.add_task(send_welcome_email, user_doc["email"], user_doc["name"])
    
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "is_professional": user_doc["is_professional"],
            "country": user_doc["country"],
            "credits": user_doc["credits"],
            "free_ads_remaining": user_doc.get("free_ads_remaining", 0),
            "promo_code_used": user_doc.get("promo_code_used"),
            "referral_code": my_referral_code,
            "loyalty_points": user_doc["loyalty_points"],
            "pro_trial_active": user_doc.get("pro_trial_used", False),
            "pro_trial_end": user_doc.get("pro_trial_end")
        }
    }

# ================== PROMO STATUS ==================
@api_router.get("/promo/{code}/status")
async def get_promo_status(code: str):
    """Vérifier le statut d'un code promo"""
    code_upper = code.upper()
    if code_upper not in PROMO_CODES:
        raise HTTPException(status_code=404, detail="Code promo invalide")
    
    promo = PROMO_CODES[code_upper]
    if not promo["active"]:
        return {"valid": False, "message": "Cette offre n'est plus active"}
    
    promo_stats = await db.promo_stats.find_one({"code": code_upper})
    total_used = promo_stats.get("total_ads_claimed", 0) if promo_stats else 0
    users_count = promo_stats.get("users_count", 0) if promo_stats else 0
    
    remaining = promo["total_limit"] - total_used
    
    if remaining <= 0:
        return {
            "valid": False,
            "message": "L'offre de lancement est terminée - toutes les annonces gratuites ont été distribuées"
        }
    
    return {
        "valid": True,
        "free_ads_per_user": promo["free_ads"],
        "remaining_global": remaining,
        "total_limit": promo["total_limit"],
        "users_registered": users_count,
        "description": promo["description"]
    }

# ================== PENDING CREDITS (Admin) ==================
@api_router.post("/admin/pending-credits")
async def add_pending_credits(
    email: str,
    credits: int,
    current_user: dict = Depends(get_current_user)
):
    """Add pending credits to an email (will be applied on registration)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    email_lower = email.lower()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email_lower})
    if existing_user:
        # User exists, add credits directly
        await db.users.update_one(
            {"email": email_lower},
            {"$inc": {"credits": credits}}
        )
        return {"status": "credits_added", "message": f"{credits} crédits ajoutés au compte existant de {email}"}
    
    # User doesn't exist, create pending credits
    existing_pending = await db.pending_credits.find_one({"email": email_lower})
    if existing_pending:
        # Add to existing pending credits
        await db.pending_credits.update_one(
            {"email": email_lower},
            {"$inc": {"credits": credits}}
        )
        new_total = existing_pending.get("credits", 0) + credits
        return {"status": "pending_updated", "message": f"Total crédits en attente pour {email}: {new_total}"}
    else:
        # Create new pending credits
        await db.pending_credits.insert_one({
            "email": email_lower,
            "credits": credits,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user["id"]
        })
        return {"status": "pending_created", "message": f"{credits} crédits en attente pour {email}"}

@api_router.get("/admin/pending-credits")
async def get_pending_credits(current_user: dict = Depends(get_current_user)):
    """Get all pending credits"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    pending = await db.pending_credits.find().to_list(100)
    for p in pending:
        p.pop("_id", None)
    return pending

@api_router.delete("/admin/pending-credits/{email}")
async def delete_pending_credits(email: str, current_user: dict = Depends(get_current_user)):
    """Delete pending credits for an email"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.pending_credits.delete_one({"email": email.lower()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pending credits not found")
    return {"success": True}

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

@api_router.get("/users/me/stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
    """Get current user's statistics for dashboard"""
    user_id = current_user["id"]
    
    # Count active listings
    active_listings = await db.listings.count_documents({
        "seller_id": user_id,
        "status": "active"
    })
    
    # Count total listings
    total_listings = await db.listings.count_documents({"seller_id": user_id})
    
    # Count total views on user's listings
    pipeline = [
        {"$match": {"seller_id": user_id}},
        {"$group": {"_id": None, "total_views": {"$sum": "$views"}}}
    ]
    views_result = await db.listings.aggregate(pipeline).to_list(1)
    total_views = views_result[0]["total_views"] if views_result else 0
    
    # Count messages received
    messages_count = await db.messages.count_documents({"receiver_id": user_id})
    
    # Count sales (orders where user is seller)
    sales_count = await db.orders.count_documents({
        "seller_id": user_id,
        "payment_status": "completed"
    })
    
    # Count purchases (orders where user is buyer)
    purchases_count = await db.orders.count_documents({
        "buyer_id": user_id,
        "payment_status": "completed"
    })
    
    # Get favorites count
    favorites_count = len(current_user.get("favorites", []))
    
    return {
        "active_listings": active_listings,
        "total_listings": total_listings,
        "total_views": total_views,
        "messages_count": messages_count,
        "sales_count": sales_count,
        "purchases_count": purchases_count,
        "favorites_count": favorites_count,
        "loyalty_points": current_user.get("loyalty_points", 0),
        "diagnostic_credits": current_user.get("diagnostic_credits", 0),
        "referral_count": current_user.get("referral_count", 0)
    }

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
    website: Optional[str] = None  # Lien site web pour PRO
    vacation_mode: Optional[bool] = None
    vacation_message: Optional[str] = None
    vacation_return_date: Optional[str] = None

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
    
    return {"message": "Mot de passe mis à jour"}

@api_router.post("/auth/vacation")
async def toggle_vacation_mode(
    enabled: bool = Body(...),
    message: str = Body(None),
    return_date: str = Body(None),
    current_user: dict = Depends(get_current_user)
):
    """Activer/désactiver le mode vacances"""
    update_data = {
        "vacation_mode": enabled,
        "vacation_message": message if enabled else None,
        "vacation_return_date": return_date if enabled else None,
        "vacation_started_at": datetime.now(timezone.utc).isoformat() if enabled else None
    }
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    return {
        "vacation_mode": enabled,
        "message": "Mode vacances activé" if enabled else "Mode vacances désactivé"
    }

@api_router.get("/auth/vacation")
async def get_vacation_status(current_user: dict = Depends(get_current_user)):
    """Récupérer le statut du mode vacances"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return {
        "vacation_mode": user.get("vacation_mode", False),
        "vacation_message": user.get("vacation_message"),
        "vacation_return_date": user.get("vacation_return_date")
    }
    
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

def get_user_max_photos(user: dict) -> int:
    """Calculate maximum photos allowed for a user based on their subscription/package"""
    # Pro users get more photos
    if user.get("is_professional") or user.get("has_pro_subscription"):
        return PRO_MAX_PHOTOS
    
    # Check for extra photo credits
    extra_photos = user.get("extra_photo_credits", 0)
    
    # Base limit + extras
    return DEFAULT_MAX_PHOTOS + extra_photos

@api_router.get("/users/me/photo-limit")
async def get_photo_limit(current_user: dict = Depends(get_current_user)):
    """Get current user's photo limit information"""
    max_photos = get_user_max_photos(current_user)
    extra_credits = current_user.get("extra_photo_credits", 0)
    is_pro = current_user.get("is_professional") or current_user.get("has_pro_subscription")
    
    return {
        "max_photos": max_photos,
        "base_limit": PRO_MAX_PHOTOS if is_pro else DEFAULT_MAX_PHOTOS,
        "extra_credits": extra_credits,
        "is_pro": is_pro,
        "extra_photos_price": EXTRA_PHOTOS_PACKAGE["price"],
        "extra_photos_count": EXTRA_PHOTOS_PACKAGE["photos"]
    }

@api_router.post("/listings", response_model=ListingResponse)
async def create_listing(listing: ListingCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    # Vérifier que le pays du vendeur est autorisé pour la création d'annonces
    user_country = current_user.get("country", "France")
    if user_country not in ALLOWED_COUNTRIES:
        raise HTTPException(
            status_code=403, 
            detail=f"La création d'annonces est limitée aux vendeurs situés dans : {', '.join(ALLOWED_COUNTRIES)}. Votre pays ({user_country}) n'est pas autorisé pour la vente."
        )
    
    # Vérifier si l'utilisateur a des annonces gratuites
    free_ads = current_user.get("free_ads_remaining", 0)
    has_credits = current_user.get("credits", 0) > 0
    
    # Check credits or free ads
    if free_ads <= 0 and not has_credits:
        raise HTTPException(status_code=402, detail="Crédits insuffisants. Veuillez acheter un pack d'annonces.")
    
    # Check photo limit
    max_photos = get_user_max_photos(current_user)
    if len(listing.images) > max_photos:
        raise HTTPException(
            status_code=400, 
            detail=f"Vous avez dépassé la limite de {max_photos} photos. Achetez des photos supplémentaires ou réduisez le nombre d'images."
        )
    
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
        "shipping_cost": listing.shipping_cost,
        "shipping_info": listing.shipping_info,
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
        "aftermarket_reference": listing.aftermarket_reference,
        # Marquer si c'est une annonce gratuite promo
        "is_promo_free": free_ads > 0
    }
    
    await db.listings.insert_one(listing_doc)
    
    # Déduire une annonce gratuite OU un crédit
    if free_ads > 0:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"free_ads_remaining": -1}}
        )
    else:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"credits": -1}}
        )
    
    # Check alerts and send notifications
    await check_and_send_alerts(listing_doc, background_tasks)
    
    # Send admin notification email for new listing
    seller_info = {
        "name": current_user.get("name"),
        "email": current_user.get("email"),
        "is_pro": current_user.get("is_professional", False)
    }
    background_tasks.add_task(send_new_listing_admin_email, listing_doc, seller_info)
    
    # Email de confirmation au vendeur
    background_tasks.add_task(
        send_listing_confirmation_email, 
        current_user.get("email"), 
        current_user.get("name"), 
        listing_doc
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

# Video limits
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

VIDEO_EXTENSION_PRICE = 1.00  # euros

@api_router.post("/upload/video")
async def upload_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a video to Cloudinary with limits based on user plan"""
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une vidéo")
    
    # Check if user has extended video credits
    has_extended = current_user.get("extended_video_credits", 0) > 0 or current_user.get("is_professional", False)
    
    # Set limits based on user plan
    if has_extended:
        max_size = VIDEO_EXTENDED_LIMIT["max_size_mb"] * 1024 * 1024
        max_duration = VIDEO_EXTENDED_LIMIT["max_duration"]
        limit_label = "2 minutes / 100 Mo"
    else:
        max_size = VIDEO_FREE_LIMIT["max_size_mb"] * 1024 * 1024
        max_duration = VIDEO_FREE_LIMIT["max_duration"]
        limit_label = "30 secondes / 30 Mo"
    
    # Check file size
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400, 
            detail=f"Vidéo trop volumineuse. Limite: {limit_label}. Achetez l'option vidéo étendue pour 1€."
        )
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            resource_type="video",
            folder="worldauto_videos",
            eager=[
                {"format": "mp4", "video_codec": "h264", "quality": "auto:good"}
            ]
        )
        
        # Check duration after upload
        duration = result.get('duration', 0)
        if duration > max_duration:
            # Delete the uploaded video
            cloudinary.uploader.destroy(result['public_id'], resource_type="video")
            raise HTTPException(
                status_code=400, 
                detail=f"Vidéo trop longue ({int(duration)}s). Limite: {max_duration}s. Achetez l'option vidéo étendue pour 1€."
            )
        
        # Deduct extended video credit if used
        if has_extended and not current_user.get("is_professional", False):
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$inc": {"extended_video_credits": -1}}
            )
        
        return {
            "url": result['secure_url'],
            "public_id": result['public_id'],
            "duration": duration,
            "format": result.get('format'),
            "used_extended": has_extended
        }
    except cloudinary.exceptions.Error as e:
        logging.error(f"Cloudinary video upload error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload de la vidéo")

@api_router.get("/users/me/video-limit")
async def get_video_limit(current_user: dict = Depends(get_current_user)):
    """Get user's video upload limits"""
    has_extended = current_user.get("extended_video_credits", 0) > 0 or current_user.get("is_professional", False)
    
    if has_extended:
        return {
            "max_duration": VIDEO_EXTENDED_LIMIT["max_duration"],
            "max_size_mb": VIDEO_EXTENDED_LIMIT["max_size_mb"],
            "is_extended": True,
            "extended_credits": current_user.get("extended_video_credits", 0),
            "is_pro": current_user.get("is_professional", False)
        }
    else:
        return {
            "max_duration": VIDEO_FREE_LIMIT["max_duration"],
            "max_size_mb": VIDEO_FREE_LIMIT["max_size_mb"],
            "is_extended": False,
            "extended_credits": 0,
            "is_pro": False,
            "extension_price": VIDEO_EXTENSION_PRICE
        }

@api_router.post("/video/create-checkout-session")
async def create_video_extension_checkout(current_user: dict = Depends(get_current_user)):
    """Create Stripe checkout session for extended video option"""
    stripe.api_key = STRIPE_API_KEY
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': 'Option Vidéo Étendue',
                        'description': 'Vidéo jusqu\'à 2 minutes et 100 Mo pour votre annonce',
                    },
                    'unit_amount': int(VIDEO_EXTENSION_PRICE * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{SITE_URL}/deposer?video_success=true",
            cancel_url=f"{SITE_URL}/deposer?video_cancelled=true",
            metadata={
                "user_id": current_user["id"],
                "type": "extended_video"
            },
            customer_email=current_user.get("email")
        )
        
        return {"checkout_url": checkout_session.url}
        
    except Exception as e:
        logging.error(f"Stripe video checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== VIDEO LISTINGS & BOOST ====================

# Video package prices in EUR
VIDEO_PACKAGE_PRICES = {
    "extended": 1.00,      # 2 min, 100 Mo (existing)
    "intermediate": 2.99,  # 3 min, 150 Mo
    "pro": 9.99,           # 10 min, 500 Mo
}

VIDEO_BOOST_PRICES = {
    "1h": 0.50,
    "24h": 5.00,
}

@api_router.get("/listings/videos")
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
    for listing in listings:
        user = await db.users.find_one({"id": listing.get("user_id")}, {"_id": 0, "password": 0})
        listing["user"] = user
        # Check if video boost is active
        now = datetime.now(timezone.utc).isoformat()
        boost_end = listing.get("video_boost_end")
        listing["video_boost_active"] = boost_end and boost_end > now
    
    return {"listings": listings, "has_more": has_more, "page": page}

@api_router.get("/videos/featured")
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

@api_router.get("/videos/homepage-showcase")
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

@api_router.post("/video/boost/checkout")
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
        logging.error(f"Stripe video boost checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/video/package/checkout")
async def create_video_package_checkout(
    package: str = "intermediate",
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for video package (intermediate or pro)"""
    stripe.api_key = STRIPE_API_KEY
    
    if package not in ["intermediate", "pro"]:
        raise HTTPException(status_code=400, detail="Forfait invalide")
    
    price = VIDEO_PACKAGE_PRICES.get(package, 2.99)
    
    package_details = {
        "intermediate": {
            "name": "Forfait Vidéo Intermédiaire",
            "description": "Vidéo jusqu'à 3 minutes et 150 Mo",
            "duration": 180,  # seconds
            "size_mb": 150
        },
        "pro": {
            "name": "Forfait Vidéo PRO Présentation",
            "description": "Vidéo jusqu'à 10 minutes et 500 Mo - Idéal pour présentations détaillées",
            "duration": 600,  # seconds
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
        logging.error(f"Stripe video package checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/me/video-packages")
async def get_user_video_packages(current_user: dict = Depends(get_current_user)):
    """Get user's available video packages/credits"""
    return {
        "extended_credits": current_user.get("extended_video_credits", 0),  # 2 min
        "intermediate_credits": current_user.get("intermediate_video_credits", 0),  # 3 min
        "pro_credits": current_user.get("pro_video_credits", 0),  # 10 min
        "is_professional": current_user.get("is_professional", False),
        "limits": {
            "standard": {"duration": 30, "size_mb": 30},
            "extended": {"duration": 120, "size_mb": 100},
            "intermediate": {"duration": 180, "size_mb": 150},
            "pro": {"duration": 600, "size_mb": 500}
        }
    }


@api_router.get("/listings/featured")
async def get_featured_listings(limit: int = 6):
    """Get featured listings for homepage"""
    now = datetime.now(timezone.utc).isoformat()
    
    listings = await db.listings.find({
        "status": "active",
        "is_featured": True,
        "featured_end": {"$gt": now}
    }, {"_id": 0}).sort("featured_end", 1).to_list(limit)
    
    return listings

@api_router.get("/seller-of-the-week")
async def get_seller_of_the_week():
    """Récupère le vendeur de la semaine (calculé automatiquement)"""
    # Calculer le vendeur avec le plus de ventes/avis positifs cette semaine
    one_week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    # Agrégation pour trouver le meilleur vendeur
    pipeline = [
        {"$match": {"status": "delivered", "created_at": {"$gte": one_week_ago}}},
        {"$group": {"_id": "$seller_id", "sales_count": {"$sum": 1}}},
        {"$sort": {"sales_count": -1}},
        {"$limit": 1}
    ]
    
    result = await db.orders.aggregate(pipeline).to_list(1)
    
    if not result:
        # Fallback: vendeur avec le plus de ventes totales
        pipeline_fallback = [
            {"$match": {"status": "delivered"}},
            {"$group": {"_id": "$seller_id", "sales_count": {"$sum": 1}}},
            {"$sort": {"sales_count": -1}},
            {"$limit": 1}
        ]
        result = await db.orders.aggregate(pipeline_fallback).to_list(1)
    
    if not result:
        return None
    
    seller_id = result[0]["_id"]
    sales_count = result[0]["sales_count"]
    
    # Récupérer les infos du vendeur
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "password": 0})
    if not seller:
        return None
    
    # Récupérer les avis
    reviews = await db.reviews.find({"seller_id": seller_id}).to_list(100)
    avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0
    
    # Compter les annonces actives
    active_listings = await db.listings.count_documents({"seller_id": seller_id, "status": "active"})
    
    return {
        "id": seller["id"],
        "name": seller.get("name"),
        "company_name": seller.get("company_name"),
        "is_professional": seller.get("is_professional", False),
        "sales_count": sales_count,
        "avg_rating": round(avg_rating, 1),
        "reviews_count": len(reviews),
        "active_listings": active_listings,
        "member_since": seller.get("created_at"),
        "badge": "🏆 Vendeur de la semaine"
    }

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
        "recent": [("is_boosted", -1), ("created_at", -1)],
        "price_asc": [("is_boosted", -1), ("price", 1)],
        "price_desc": [("is_boosted", -1), ("price", -1)],
        "views": [("is_boosted", -1), ("views", -1)]
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
    
    # Check if seller has Stripe Connect configured and get verification status
    seller = await db.users.find_one({"id": listing.get("seller_id")}, {"_id": 0, "stripe_connected": 1})
    listing["seller_stripe_connected"] = seller.get("stripe_connected", False) if seller else False
    
    # Check if seller is verified (5+ successful sales)
    sold_count = await db.listings.count_documents({"seller_id": listing.get("seller_id"), "status": "sold"})
    reviews = await db.reviews.find({"seller_id": listing.get("seller_id")}, {"_id": 0, "rating": 1}).to_list(100)
    avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 5
    listing["seller_is_verified"] = sold_count >= 5 and avg_rating >= 4.0
    
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
    
    # Track price history if price changed
    old_price = existing.get("price")
    new_price = listing.price
    if old_price and new_price and old_price != new_price:
        price_history_entry = {
            "id": str(uuid.uuid4()),
            "listing_id": listing_id,
            "old_price": old_price,
            "new_price": new_price,
            "changed_at": datetime.now(timezone.utc).isoformat(),
            "changed_by": current_user["id"]
        }
        await db.price_history.insert_one(price_history_entry)
    
    update_data = listing.model_dump(exclude_unset=True)
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    return updated

@api_router.get("/listings/{listing_id}/price-history")
async def get_price_history(listing_id: str):
    """Récupérer l'historique des prix d'une annonce"""
    # Get listing to include initial price
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Get price history
    history = await db.price_history.find(
        {"listing_id": listing_id}, 
        {"_id": 0}
    ).sort("changed_at", 1).to_list(100)
    
    # Build timeline including initial price
    timeline = []
    
    # Add initial price (from listing creation)
    timeline.append({
        "price": listing.get("price"),
        "date": listing.get("created_at"),
        "type": "initial"
    })
    
    # Add all price changes
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
        "history": timeline,
        "total_changes": len(history)
    }

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

# ================== SEARCH HISTORY ROUTES ==================

@api_router.post("/search-history")
async def save_search(
    query: str = Body(None),
    category: str = Body(None),
    brand: str = Body(None),
    model: str = Body(None),
    region: str = Body(None),
    min_price: float = Body(None),
    max_price: float = Body(None),
    current_user: dict = Depends(get_current_user)
):
    """Sauvegarder une recherche dans l'historique"""
    search_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "query": query,
        "category": category,
        "brand": brand,
        "model": model,
        "region": region,
        "min_price": min_price,
        "max_price": max_price,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Supprimer les champs None
    search_doc = {k: v for k, v in search_doc.items() if v is not None}
    
    await db.search_history.insert_one(search_doc)
    
    # Garder seulement les 20 dernières recherches
    user_searches = await db.search_history.find(
        {"user_id": current_user["id"]}
    ).sort("created_at", -1).to_list(100)
    
    if len(user_searches) > 20:
        old_ids = [s["id"] for s in user_searches[20:]]
        await db.search_history.delete_many({"id": {"$in": old_ids}})
    
    return {"id": search_doc["id"]}

@api_router.get("/search-history")
async def get_search_history(limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Récupérer l'historique des recherches"""
    searches = await db.search_history.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return searches

@api_router.delete("/search-history/{search_id}")
async def delete_search(search_id: str, current_user: dict = Depends(get_current_user)):
    """Supprimer une recherche de l'historique"""
    result = await db.search_history.delete_one({
        "id": search_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recherche non trouvée")
    
    return {"message": "Recherche supprimée"}

@api_router.delete("/search-history")
async def clear_search_history(current_user: dict = Depends(get_current_user)):
    """Effacer tout l'historique de recherche"""
    await db.search_history.delete_many({"user_id": current_user["id"]})
    return {"message": "Historique effacé"}

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
async def send_message(message: MessageCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    # Modération du contenu
    moderation = await moderate_content(message.content, context="message")
    if not moderation["allowed"]:
        raise HTTPException(status_code=400, detail=moderation["reason"])
    
    # Get receiver info
    receiver = await db.users.find_one({"id": message.receiver_id}, {"_id": 0, "password": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="Destinataire non trouvé")
    
    # Get listing info for notification
    listing = await db.listings.find_one({"id": message.listing_id}, {"_id": 0, "title": 1})
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "listing_id": message.listing_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "receiver_id": message.receiver_id,
        "receiver_name": receiver["name"],
        "content": message.content,
        "read": False,
        "moderated": True,
        "has_sensitive_words": moderation.get("has_sensitive", False),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    
    # Send push notification to receiver (in background)
    async def send_message_push():
        await send_push_notification(
            user_id=message.receiver_id,
            title=f"💬 {current_user['name']}",
            body=message.content[:100] + ("..." if len(message.content) > 100 else ""),
            url=f"/messages/{message.listing_id}/{current_user['id']}",
            tag="message"
        )
    background_tasks.add_task(send_message_push)
    
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

# ================== CONFIANCE & GARANTIE ROUTES ==================

@api_router.get("/warranty/options")
async def get_warranty_options():
    """Récupère les options de garantie World Auto disponibles"""
    return {
        "options": [
            {"duration": 3, "price": 4.99, "label": "3 mois", "description": "Protection basique"},
            {"duration": 6, "price": 7.99, "label": "6 mois", "description": "Protection standard"},
            {"duration": 12, "price": 12.99, "label": "12 mois", "description": "Protection complète"}
        ],
        "benefits": [
            "Remboursement si pièce défectueuse",
            "Assistance téléphonique",
            "Médiation en cas de litige",
            "Certificat de garantie officiel"
        ]
    }

@api_router.post("/warranty/create-checkout")
async def create_warranty_checkout(
    request: Request,
    listing_id: str = Body(...),
    duration: int = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Créer une session Stripe pour l'achat d'une garantie"""
    stripe.api_key = STRIPE_API_KEY
    
    # Vérifier que l'annonce appartient à l'utilisateur
    listing = await db.listings.find_one({"id": listing_id, "seller_id": current_user["id"]})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Vérifier la durée
    if duration not in WARRANTY_OPTIONS:
        raise HTTPException(status_code=400, detail="Durée de garantie invalide")
    
    warranty_option = WARRANTY_OPTIONS[duration]
    
    try:
        origin = request.headers.get("origin", SITE_URL)
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Garantie World Auto - {warranty_option['label']}",
                        "description": f"Garantie pour: {listing['title'][:50]}",
                    },
                    "unit_amount": int(warranty_option["price"] * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{origin}/annonce/{listing_id}?warranty_success=true",
            cancel_url=f"{origin}/annonce/{listing_id}?warranty_cancelled=true",
            metadata={
                "type": "warranty",
                "listing_id": listing_id,
                "user_id": current_user["id"],
                "warranty_duration": duration
            }
        )
        return {"url": checkout_session.url, "session_id": checkout_session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/listings/{listing_id}/verify")
async def request_verification(listing_id: str, current_user: dict = Depends(get_current_user)):
    """Demander la vérification d'une pièce (Admin only ou automatique basé sur critères)"""
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Vérifier si le vendeur est propriétaire ou admin
    is_owner = listing["seller_id"] == current_user["id"]
    is_admin = current_user.get("email") == "contact@worldautofrance.com"
    
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Critères de vérification automatique
    verification_score = 0
    verification_details = []
    
    # Photos multiples (+20)
    if len(listing.get("images", [])) >= 3:
        verification_score += 20
        verification_details.append("photos_multiples")
    
    # Référence OEM (+25)
    if listing.get("oem_reference"):
        verification_score += 25
        verification_details.append("reference_oem")
    
    # Origine renseignée (+15)
    if listing.get("part_origin"):
        verification_score += 15
        verification_details.append("origine_renseignee")
    
    # Kilométrage véhicule (+15)
    if listing.get("vehicle_mileage"):
        verification_score += 15
        verification_details.append("kilometrage_vehicule")
    
    # Vendeur vérifié (+25)
    seller = await db.users.find_one({"id": listing["seller_id"]})
    sold_count = await db.orders.count_documents({"seller_id": listing["seller_id"], "status": "delivered"})
    if sold_count >= 5:
        verification_score += 25
        verification_details.append("vendeur_experimente")
    
    # Déterminer le niveau de vérification
    is_verified = verification_score >= 60
    verification_level = "gold" if verification_score >= 80 else "silver" if verification_score >= 60 else "none"
    
    # Mettre à jour l'annonce
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "is_verified": is_verified,
            "verification_score": verification_score,
            "verification_level": verification_level,
            "verification_details": verification_details,
            "verified_at": datetime.now(timezone.utc).isoformat() if is_verified else None
        }}
    )
    
    return {
        "is_verified": is_verified,
        "verification_score": verification_score,
        "verification_level": verification_level,
        "verification_details": verification_details,
        "message": "Pièce vérifiée !" if is_verified else "Complétez les informations pour obtenir la certification"
    }

@api_router.get("/listings/{listing_id}/trust-info")
async def get_trust_info(listing_id: str):
    """Récupère les informations de confiance d'une annonce"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Infos vendeur
    seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0})
    sold_count = await db.orders.count_documents({"seller_id": listing["seller_id"], "status": "delivered"})
    
    # Avis vendeur
    reviews = await db.reviews.find({"seller_id": listing["seller_id"]}).to_list(100)
    avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0
    
    return {
        "listing": {
            "is_verified": listing.get("is_verified", False),
            "verification_level": listing.get("verification_level", "none"),
            "verification_score": listing.get("verification_score", 0),
            "has_warranty": listing.get("has_warranty", False),
            "warranty_duration": listing.get("warranty_duration"),
            "warranty_expires": listing.get("warranty_expires"),
            "part_origin": listing.get("part_origin"),
            "vehicle_mileage": listing.get("vehicle_mileage"),
            "oem_reference": listing.get("oem_reference")
        },
        "seller": {
            "name": seller.get("name") if seller else "Inconnu",
            "is_professional": seller.get("is_professional", False) if seller else False,
            "sales_count": sold_count,
            "avg_rating": round(avg_rating, 1),
            "reviews_count": len(reviews),
            "member_since": seller.get("created_at") if seller else None
        }
    }

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
    
    # Marquer le panier abandonné comme converti
    await db.abandoned_carts.update_many(
        {"email": current_user["email"], "status": "active"},
        {"$set": {"status": "converted", "converted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send notification emails
    background_tasks.add_task(send_new_order_seller_email, seller.get("email"), seller.get("name"), order_doc)
    background_tasks.add_task(send_new_order_buyer_email, current_user.get("email"), current_user.get("name"), order_doc)
    
    # Send admin notification email
    buyer_info = {"name": current_user.get("name"), "email": current_user.get("email"), "phone": current_user.get("phone")}
    seller_info = {"name": seller.get("name"), "email": seller.get("email")}
    background_tasks.add_task(send_new_order_admin_email, order_doc, buyer_info, seller_info)
    
    # Send push notification to seller
    async def send_order_push():
        await send_push_notification(
            user_id=listing["seller_id"],
            title="🛒 Nouvelle commande !",
            body=f"{current_user['name']} a commandé : {listing['title']} - {listing['price']}€",
            url="/commandes",
            tag="order"
        )
    background_tasks.add_task(send_order_push)
    
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
    
    # Marquer le panier abandonné comme converti
    await db.abandoned_carts.update_many(
        {"email": current_user["email"], "status": "active"},
        {"$set": {"status": "converted", "converted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
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
        
        # Add loyalty points to buyer (1 point per euro spent)
        order_amount = order.get("total_amount") or order.get("price", 0)
        if order_amount > 0:
            points_to_add = int(order_amount)  # 1 point per euro
            background_tasks.add_task(
                add_loyalty_points,
                current_user["id"],
                points_to_add,
                f"Achat: {order.get('listing_title', 'Commande')}",
                order_id
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

@api_router.get("/orders/{order_id}/invoice")
async def download_invoice(order_id: str, current_user: dict = Depends(get_current_user)):
    """Télécharger la facture PDF"""
    order = await db.orders.find_one(
        {"id": order_id},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # Vérifier que l'utilisateur est le vendeur ou l'acheteur
    if order["seller_id"] != current_user["id"] and order["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    pdf_buffer = bordereau_gen.generate_invoice(order)
    
    filename = f"facture_WA-{order_id[:8].upper()}.pdf"
    
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
    total_listings = await db.listings.count_documents({"seller_id": seller_id})
    
    # Get reviews
    reviews = await db.reviews.find({"seller_id": seller_id}, {"_id": 0}).to_list(100)
    total_reviews = len(reviews)
    average_rating = round(sum(r.get("rating", 0) for r in reviews) / total_reviews, 1) if total_reviews > 0 else 0
    
    # Calculate badges
    badges = []
    
    # Verified Seller Badge (5+ sales with good rating)
    is_verified_seller = sold_count >= 5 and (average_rating >= 4.0 or total_reviews == 0)
    if is_verified_seller:
        badges.append({
            "id": "verified",
            "name": "Vendeur Vérifié",
            "icon": "shield-check",
            "color": "green",
            "description": "5+ ventes réussies avec d'excellents avis"
        })
    
    # Top Seller Badge (20+ sales)
    if sold_count >= 20:
        badges.append({
            "id": "top_seller",
            "name": "Top Vendeur",
            "icon": "trophy",
            "color": "gold",
            "description": "Plus de 20 ventes réalisées"
        })
    
    # Speed Demon Badge (répond rapidement - basé sur temps de réponse moyen)
    fast_responder = await db.messages.find({"sender_id": seller_id}).to_list(100)
    if len(fast_responder) >= 10:
        badges.append({
            "id": "fast_responder",
            "name": "Réponse Rapide",
            "icon": "zap",
            "color": "yellow",
            "description": "Répond rapidement aux messages"
        })
    
    # Expert Badge (50+ listings créées)
    if total_listings >= 50:
        badges.append({
            "id": "expert",
            "name": "Expert",
            "icon": "star",
            "color": "purple",
            "description": "Plus de 50 annonces publiées"
        })
    
    # Newcomer Badge (compte créé récemment, première vente)
    if sold_count >= 1 and sold_count < 5:
        badges.append({
            "id": "newcomer",
            "name": "Nouveau Talent",
            "icon": "sparkles",
            "color": "blue",
            "description": "A réalisé ses premières ventes"
        })
    
    # 5 Star Badge (average rating 5.0)
    if average_rating == 5.0 and total_reviews >= 3:
        badges.append({
            "id": "five_star",
            "name": "5 Étoiles",
            "icon": "star",
            "color": "gold",
            "description": "Note parfaite de 5/5"
        })
    
    return {
        "id": seller["id"],
        "name": seller["name"],
        "is_professional": seller.get("is_professional", False),
        "is_verified_seller": is_verified_seller,
        "badges": badges,
        "company_name": seller.get("company_name"),
        "city": seller.get("city"),
        "created_at": seller.get("created_at"),
        "active_listings": len(listings),
        "sold_count": sold_count,
        "total_listings": total_listings,
        "total_reviews": total_reviews,
        "average_rating": average_rating,
        "reviews": reviews[:10]  # 10 derniers avis
    }

# ================== QUESTIONS & ANSWERS ROUTES ==================

class QuestionCreate(BaseModel):
    listing_id: str
    question: str

class AnswerCreate(BaseModel):
    answer: str

@api_router.post("/questions")
async def create_question(question: QuestionCreate, current_user: dict = Depends(get_current_user)):
    """Poser une question sur une annonce"""
    # Vérifier que l'annonce existe
    listing = await db.listings.find_one({"id": question.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    question_doc = {
        "id": str(uuid.uuid4()),
        "listing_id": question.listing_id,
        "seller_id": listing["seller_id"],
        "asker_id": current_user["id"],
        "asker_name": current_user.get("name", "Anonyme"),
        "question": question.question,
        "answer": None,
        "answered_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_public": True
    }
    
    await db.questions.insert_one(question_doc)
    
    # Notifier le vendeur par email
    seller = await db.users.find_one({"id": listing["seller_id"]})
    if seller:
        try:
            send_email(
                to_email=seller["email"],
                subject=f"Nouvelle question sur votre annonce - {listing['title'][:30]}",
                html_content=f"""
                <h2>Nouvelle question</h2>
                <p><strong>{current_user.get('name', 'Un utilisateur')}</strong> a posé une question sur votre annonce :</p>
                <p><em>"{question.question}"</em></p>
                <p>Annonce : <strong>{listing['title']}</strong></p>
                <p><a href="{SITE_URL}/annonce/{listing['id']}">Répondre à la question</a></p>
                """
            )
        except:
            pass
    
    return {"id": question_doc["id"], "message": "Question envoyée"}

@api_router.get("/questions/listing/{listing_id}")
async def get_listing_questions(listing_id: str):
    """Récupérer toutes les questions d'une annonce"""
    questions = await db.questions.find(
        {"listing_id": listing_id, "is_public": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return questions

@api_router.post("/questions/{question_id}/answer")
async def answer_question(question_id: str, answer: AnswerCreate, current_user: dict = Depends(get_current_user)):
    """Répondre à une question (vendeur uniquement)"""
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question non trouvée")
    
    # Vérifier que c'est bien le vendeur qui répond
    if question["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le vendeur peut répondre")
    
    await db.questions.update_one(
        {"id": question_id},
        {"$set": {
            "answer": answer.answer,
            "answered_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notifier l'auteur de la question
    asker = await db.users.find_one({"id": question["asker_id"]})
    listing = await db.listings.find_one({"id": question["listing_id"]})
    if asker and listing:
        try:
            send_email(
                to_email=asker["email"],
                subject=f"Réponse à votre question - {listing['title'][:30]}",
                html_content=f"""
                <h2>Le vendeur a répondu</h2>
                <p>Votre question : <em>"{question['question']}"</em></p>
                <p>Réponse : <strong>{answer.answer}</strong></p>
                <p><a href="{SITE_URL}/annonce/{listing['id']}">Voir l'annonce</a></p>
                """
            )
        except:
            pass
    
    return {"message": "Réponse envoyée"}

@api_router.delete("/questions/{question_id}")
async def delete_question(question_id: str, current_user: dict = Depends(get_current_user)):
    """Supprimer une question (auteur ou vendeur)"""
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question non trouvée")
    
    if question["asker_id"] != current_user["id"] and question["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.questions.delete_one({"id": question_id})
    return {"message": "Question supprimée"}

# ================== REVIEWS ROUTES ==================

class ReviewCreate(BaseModel):
    order_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Créer un avis après une commande livrée"""
    # Modération du commentaire si présent
    if review.comment:
        moderation = await moderate_content(review.comment, context="review")
        if not moderation["allowed"]:
            raise HTTPException(status_code=400, detail=moderation["reason"])
    
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
        "moderated": True,
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

# ================== WEBSOCKET CHAT ==================

class ConnectionManager:
    """Gestionnaire des connexions WebSocket pour le chat en temps réel"""
    def __init__(self):
        # active_connections[user_id] = [websocket1, websocket2, ...]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # typing_status[conversation_key] = {user_id: timestamp}
        self.typing_status: Dict[str, Dict[str, datetime]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Envoyer un message à un utilisateur spécifique"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {user_id}: {e}")
    
    async def broadcast_to_conversation(self, message: dict, user_ids: List[str]):
        """Envoyer un message à tous les participants d'une conversation"""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)
    
    def set_typing(self, conversation_key: str, user_id: str):
        """Marquer un utilisateur comme en train d'écrire"""
        if conversation_key not in self.typing_status:
            self.typing_status[conversation_key] = {}
        self.typing_status[conversation_key][user_id] = datetime.now(timezone.utc)
    
    def clear_typing(self, conversation_key: str, user_id: str):
        """Effacer le statut "en train d'écrire" """
        if conversation_key in self.typing_status and user_id in self.typing_status[conversation_key]:
            del self.typing_status[conversation_key][user_id]

# Instance globale du gestionnaire
ws_manager = ConnectionManager()

@app.websocket("/ws/chat/{token}")
async def websocket_chat(websocket: WebSocket, token: str):
    """WebSocket endpoint pour le chat en temps réel"""
    user_id = None
    try:
        # Vérifier le token JWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            await websocket.close(code=4001)
            return
        
        await ws_manager.connect(websocket, user_id)
        
        # Envoyer confirmation de connexion
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "Connexion établie"
        })
        
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "send_message":
                # Envoyer un nouveau message
                receiver_id = data.get("receiver_id")
                listing_id = data.get("listing_id")
                content = data.get("content")
                
                if not all([receiver_id, listing_id, content]):
                    await websocket.send_json({"type": "error", "message": "Données manquantes"})
                    continue
                
                # Sauvegarder le message en base
                message_doc = {
                    "id": str(uuid.uuid4()),
                    "listing_id": listing_id,
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.messages.insert_one(message_doc)
                
                # Récupérer les infos du sender
                sender = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
                message_doc["sender_name"] = sender.get("name", "Utilisateur") if sender else "Utilisateur"
                if "_id" in message_doc:
                    del message_doc["_id"]
                
                # Notifier les deux utilisateurs
                ws_message = {
                    "type": "new_message",
                    "message": message_doc
                }
                await ws_manager.broadcast_to_conversation(ws_message, [user_id, receiver_id])
                
                # Clear typing status
                conv_key = f"{listing_id}_{min(user_id, receiver_id)}_{max(user_id, receiver_id)}"
                ws_manager.clear_typing(conv_key, user_id)
            
            elif action == "typing":
                # Notifier que l'utilisateur écrit
                receiver_id = data.get("receiver_id")
                listing_id = data.get("listing_id")
                
                if receiver_id and listing_id:
                    conv_key = f"{listing_id}_{min(user_id, receiver_id)}_{max(user_id, receiver_id)}"
                    ws_manager.set_typing(conv_key, user_id)
                    
                    await ws_manager.send_personal_message({
                        "type": "typing",
                        "user_id": user_id,
                        "listing_id": listing_id
                    }, receiver_id)
            
            elif action == "stop_typing":
                receiver_id = data.get("receiver_id")
                listing_id = data.get("listing_id")
                
                if receiver_id and listing_id:
                    conv_key = f"{listing_id}_{min(user_id, receiver_id)}_{max(user_id, receiver_id)}"
                    ws_manager.clear_typing(conv_key, user_id)
                    
                    await ws_manager.send_personal_message({
                        "type": "stop_typing",
                        "user_id": user_id,
                        "listing_id": listing_id
                    }, receiver_id)
            
            elif action == "mark_read":
                # Marquer les messages comme lus
                listing_id = data.get("listing_id")
                other_user_id = data.get("other_user_id")
                
                if listing_id and other_user_id:
                    await db.messages.update_many(
                        {
                            "listing_id": listing_id,
                            "sender_id": other_user_id,
                            "receiver_id": user_id,
                            "read": False
                        },
                        {"$set": {"read": True}}
                    )
                    
                    # Notifier l'autre utilisateur
                    await ws_manager.send_personal_message({
                        "type": "messages_read",
                        "listing_id": listing_id,
                        "reader_id": user_id
                    }, other_user_id)
            
            elif action == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        if user_id:
            ws_manager.disconnect(websocket, user_id)
    except jwt.ExpiredSignatureError:
        await websocket.close(code=4002)
    except jwt.InvalidTokenError:
        await websocket.close(code=4003)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if user_id:
            ws_manager.disconnect(websocket, user_id)

# ================== BUYER REVIEWS (Notation Acheteurs) ==================

class BuyerReviewCreate(BaseModel):
    order_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

@api_router.post("/reviews/buyer")
async def create_buyer_review(review: BuyerReviewCreate, current_user: dict = Depends(get_current_user)):
    """Créer un avis sur un acheteur (par le vendeur après livraison)"""
    # Modération du commentaire si présent
    if review.comment:
        moderation = await moderate_content(review.comment, context="buyer_review")
        if not moderation["allowed"]:
            raise HTTPException(status_code=400, detail=moderation["reason"])
    
    # Verify order exists and current user is the seller
    order = await db.orders.find_one({
        "id": review.order_id,
        "seller_id": current_user["id"],
        "status": "delivered"
    }, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=400, detail="Commande non trouvée ou non livrée")
    
    # Check if already reviewed
    existing = await db.buyer_reviews.find_one({
        "order_id": review.order_id,
        "seller_id": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà noté cet acheteur pour cette commande")
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "order_id": review.order_id,
        "listing_id": order["listing_id"],
        "listing_title": order["listing_title"],
        "buyer_id": order["buyer_id"],
        "buyer_name": order["buyer_name"],
        "seller_id": current_user["id"],
        "seller_name": current_user["name"],
        "rating": review.rating,
        "comment": review.comment,
        "moderated": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.buyer_reviews.insert_one(review_doc)
    
    # Update buyer stats cache
    await update_buyer_stats(order["buyer_id"])
    
    return {"message": "Avis sur l'acheteur publié", "review": {k: v for k, v in review_doc.items() if k != "_id"}}

async def update_buyer_stats(buyer_id: str):
    """Mettre à jour les statistiques d'un acheteur"""
    reviews = await db.buyer_reviews.find({"buyer_id": buyer_id}, {"_id": 0, "rating": 1}).to_list(1000)
    
    if reviews:
        total_reviews = len(reviews)
        average_rating = round(sum(r["rating"] for r in reviews) / total_reviews, 1)
        
        # Déterminer les badges
        badges = []
        
        # Badge "Acheteur de confiance" - 5+ achats avec moyenne >= 4
        if total_reviews >= 5 and average_rating >= 4.0:
            badges.append({
                "id": "trusted_buyer",
                "name": "Acheteur de confiance",
                "icon": "shield-check",
                "color": "green"
            })
        
        # Badge "Acheteur VIP" - 10+ achats avec moyenne >= 4.5
        if total_reviews >= 10 and average_rating >= 4.5:
            badges.append({
                "id": "vip_buyer",
                "name": "Acheteur VIP",
                "icon": "crown",
                "color": "gold"
            })
        
        # Badge "Acheteur parfait" - moyenne de 5 étoiles avec 3+ achats
        if total_reviews >= 3 and average_rating == 5.0:
            badges.append({
                "id": "perfect_buyer",
                "name": "Acheteur parfait",
                "icon": "star",
                "color": "purple"
            })
        
        await db.users.update_one(
            {"id": buyer_id},
            {"$set": {
                "buyer_rating": average_rating,
                "buyer_reviews_count": total_reviews,
                "buyer_badges": badges
            }}
        )

@api_router.get("/reviews/buyer/pending")
async def get_pending_buyer_reviews(current_user: dict = Depends(get_current_user)):
    """Récupérer les commandes livrées où le vendeur n'a pas encore noté l'acheteur"""
    # Get delivered orders where current user is seller
    orders = await db.orders.find({
        "seller_id": current_user["id"],
        "status": "delivered"
    }, {"_id": 0}).to_list(100)
    
    # Get existing buyer reviews from this seller
    order_ids = [o["id"] for o in orders]
    reviewed = await db.buyer_reviews.find(
        {"order_id": {"$in": order_ids}, "seller_id": current_user["id"]},
        {"order_id": 1}
    ).to_list(100)
    reviewed_ids = [r["order_id"] for r in reviewed]
    
    # Filter out already reviewed orders
    pending = [o for o in orders if o["id"] not in reviewed_ids]
    
    return pending

@api_router.get("/reviews/buyer/{buyer_id}")
async def get_buyer_reviews(buyer_id: str, limit: int = 20):
    """Récupérer les avis sur un acheteur"""
    reviews = await db.buyer_reviews.find(
        {"buyer_id": buyer_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    # Calculate stats
    total = len(reviews)
    average = round(sum(r["rating"] for r in reviews) / total, 1) if total > 0 else 0
    
    # Rating distribution
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        distribution[r["rating"]] += 1
    
    # Get buyer info with badges
    buyer = await db.users.find_one({"id": buyer_id}, {"_id": 0, "name": 1, "buyer_badges": 1, "created_at": 1})
    
    return {
        "reviews": reviews,
        "total": total,
        "average": average,
        "distribution": distribution,
        "buyer_name": buyer.get("name", "Acheteur") if buyer else "Acheteur",
        "buyer_badges": buyer.get("buyer_badges", []) if buyer else [],
        "member_since": buyer.get("created_at") if buyer else None
    }

@api_router.get("/buyer/profile/{buyer_id}")
async def get_buyer_profile(buyer_id: str):
    """Récupérer le profil public d'un acheteur"""
    buyer = await db.users.find_one({"id": buyer_id}, {"_id": 0, "password": 0})
    if not buyer:
        raise HTTPException(status_code=404, detail="Acheteur non trouvé")
    
    # Get buyer stats
    orders_count = await db.orders.count_documents({"buyer_id": buyer_id, "status": "delivered"})
    reviews = await db.buyer_reviews.find({"buyer_id": buyer_id}, {"_id": 0}).to_list(100)
    
    total_reviews = len(reviews)
    average_rating = round(sum(r["rating"] for r in reviews) / total_reviews, 1) if total_reviews > 0 else 0
    
    # Check trusted buyer badge
    is_trusted = total_reviews >= 5 and average_rating >= 4.0
    
    return {
        "id": buyer["id"],
        "name": buyer.get("name", "Acheteur"),
        "city": buyer.get("city"),
        "created_at": buyer.get("created_at"),
        "orders_completed": orders_count,
        "total_reviews": total_reviews,
        "average_rating": average_rating,
        "is_trusted_buyer": is_trusted,
        "badges": buyer.get("buyer_badges", []),
        "recent_reviews": reviews[:5]
    }

# ================== UPDATES (CHANGELOG) ROUTES ==================

class UpdateItem(BaseModel):
    type: str  # "new", "improvement", "fix", "maintenance"
    text: str

class UpdateCreate(BaseModel):
    title: str
    version: str
    category: str = "general"  # "general", "feature", "security", "performance"
    image_url: Optional[str] = None
    items: List[UpdateItem]

@api_router.get("/updates")
async def get_updates():
    """Get all updates (changelog) - Public"""
    updates = await db.updates.find({}, {"_id": 0}).sort("date", -1).to_list(100)
    return updates

@api_router.get("/updates/{update_id}")
async def get_update(update_id: str):
    """Get a single update by ID"""
    update = await db.updates.find_one({"id": update_id}, {"_id": 0})
    if not update:
        raise HTTPException(status_code=404, detail="Actualité non trouvée")
    return update

@api_router.post("/updates")
async def create_update(update: UpdateCreate, current_user: dict = Depends(get_current_user)):
    """Create a new update - Admin only"""
    update_doc = {
        "id": str(uuid.uuid4()),
        "title": update.title,
        "version": update.version,
        "category": update.category,
        "image_url": update.image_url,
        "items": [item.model_dump() for item in update.items],
        "date": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    await db.updates.insert_one(update_doc)
    update_doc.pop("_id", None)
    return update_doc

@api_router.put("/updates/{update_id}")
async def edit_update(update_id: str, update: UpdateCreate, current_user: dict = Depends(get_current_user)):
    """Update an existing update - Admin only"""
    existing = await db.updates.find_one({"id": update_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Actualité non trouvée")
    
    update_data = {
        "title": update.title,
        "version": update.version,
        "category": update.category,
        "image_url": update.image_url,
        "items": [item.model_dump() for item in update.items],
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": current_user["id"]
    }
    await db.updates.update_one({"id": update_id}, {"$set": update_data})
    updated = await db.updates.find_one({"id": update_id}, {"_id": 0})
    return updated

@api_router.delete("/updates/{update_id}")
async def delete_update(update_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an update - Admin only"""
    result = await db.updates.delete_one({"id": update_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Actualité non trouvée")
    return {"message": "Actualité supprimée"}

# ================== NEWSLETTER ROUTES ==================

class NewsletterSubscribe(BaseModel):
    email: str
    name: Optional[str] = None

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(subscriber: NewsletterSubscribe):
    """Subscribe to newsletter - Public"""
    # Validate email format
    import re
    if not re.match(r"[^@]+@[^@]+\.[^@]+", subscriber.email):
        raise HTTPException(status_code=400, detail="Format d'email invalide")
    
    # Check if already subscribed
    existing = await db.newsletter_subscribers.find_one({"email": subscriber.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà inscrit à la newsletter")
    
    subscriber_doc = {
        "id": str(uuid.uuid4()),
        "email": subscriber.email.lower(),
        "name": subscriber.name,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "active": True
    }
    await db.newsletter_subscribers.insert_one(subscriber_doc)
    return {"message": "Inscription réussie !"}

@api_router.get("/newsletter/subscribers")
async def get_newsletter_subscribers(current_user: dict = Depends(get_current_user)):
    """Get all newsletter subscribers - Admin only"""
    subscribers = await db.newsletter_subscribers.find({"active": True}, {"_id": 0}).to_list(10000)
    return {"subscribers": subscribers, "total": len(subscribers)}

@api_router.delete("/newsletter/unsubscribe/{email}")
async def unsubscribe_newsletter(email: str):
    """Unsubscribe from newsletter"""
    result = await db.newsletter_subscribers.update_one(
        {"email": email.lower()},
        {"$set": {"active": False, "unsubscribed_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Email non trouvé")
    return {"message": "Désabonnement effectué"}

class NewsletterContent(BaseModel):
    subject: str
    title: str
    content: str
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None

@api_router.post("/newsletter/send")
async def send_newsletter(newsletter: NewsletterContent, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Send newsletter to all active subscribers - Admin only"""
    # Get all active subscribers
    subscribers = await db.newsletter_subscribers.find({"active": True}, {"_id": 0}).to_list(10000)
    
    if not subscribers:
        raise HTTPException(status_code=400, detail="Aucun abonné actif")
    
    # Get site URL for unsubscribe links
    site_url = os.environ.get('FRONTEND_URL', 'https://worldautofrance.com')
    
    # Create email HTML template
    def create_newsletter_html(subscriber_email: str):
        unsubscribe_url = f"{site_url}/api/newsletter/unsubscribe/{subscriber_email}"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1E3A5F; margin: 0;">World Auto <span style="color: #002654;">Fr</span><span style="color: #FFFFFF; text-shadow: -1px 0 #333, 0 1px #333, 1px 0 #333, 0 -1px #333;">an</span><span style="color: #ED2939;">ce</span></h1>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                <h2 style="color: #1E3A5F; margin-top: 0;">{newsletter.title}</h2>
                <div style="white-space: pre-line;">{newsletter.content}</div>
            </div>
            
            {"<div style='text-align: center; margin: 30px 0;'><a href='" + newsletter.cta_link + "' style='background: #F97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>" + newsletter.cta_text + "</a></div>" if newsletter.cta_text and newsletter.cta_link else ""}
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
                <p>Vous recevez cet email car vous êtes inscrit à la newsletter World Auto France.</p>
                <p><a href="{unsubscribe_url}" style="color: #666;">Se désabonner</a></p>
            </div>
        </body>
        </html>
        """
        return html
    
    # Send emails in background
    sent_count = 0
    failed_count = 0
    
    for subscriber in subscribers:
        try:
            html_content = create_newsletter_html(subscriber["email"])
            background_tasks.add_task(send_email, subscriber["email"], newsletter.subject, html_content)
            sent_count += 1
        except Exception as e:
            logging.error(f"Failed to queue email for {subscriber['email']}: {e}")
            failed_count += 1
    
    # Log the newsletter send
    newsletter_log = {
        "id": str(uuid.uuid4()),
        "subject": newsletter.subject,
        "title": newsletter.title,
        "sent_by": current_user["id"],
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "total_subscribers": len(subscribers),
        "sent_count": sent_count,
        "failed_count": failed_count
    }
    await db.newsletter_logs.insert_one(newsletter_log)
    
    return {
        "message": f"Newsletter envoyée à {sent_count} abonnés",
        "sent_count": sent_count,
        "failed_count": failed_count,
        "total_subscribers": len(subscribers)
    }

@api_router.get("/newsletter/logs")
async def get_newsletter_logs(current_user: dict = Depends(get_current_user)):
    """Get newsletter send history - Admin only"""
    logs = await db.newsletter_logs.find({}, {"_id": 0}).sort("sent_at", -1).to_list(50)
    return logs

class AutoNewsletterRequest(BaseModel):
    secret_key: str
    subject: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None

@api_router.post("/newsletter/send-auto")
async def send_auto_newsletter(request: AutoNewsletterRequest, background_tasks: BackgroundTasks):
    """Envoi automatique de newsletter via cron job - Authentification par clé secrète"""
    
    # Vérifier la clé secrète
    if not NEWSLETTER_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Clé newsletter non configurée sur le serveur")
    
    if request.secret_key != NEWSLETTER_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Clé secrète invalide")
    
    # Récupérer les abonnés actifs
    subscribers = await db.newsletter_subscribers.find({"active": True}, {"_id": 0}).to_list(10000)
    
    if not subscribers:
        return {"message": "Aucun abonné actif", "sent_count": 0}
    
    # Récupérer la dernière actualité pour le contenu auto
    latest_update = await db.updates.find_one({}, {"_id": 0}, sort=[("date", -1)])
    
    # Générer le contenu automatique si non fourni
    week_num = datetime.now().isocalendar()[1]
    subject = request.subject or f"World Auto France - Newsletter Semaine {week_num}"
    title = request.title or "Les actualités de la semaine"
    
    if request.content:
        content = request.content
    elif latest_update:
        items_text = "\n".join([f"• {item['text']}" for item in latest_update.get('items', [])[:5]])
        content = f"Dernière mise à jour : {latest_update.get('title', '')} (v{latest_update.get('version', '')})\n\n{items_text}\n\nÀ bientôt sur World Auto France !"
    else:
        content = "Découvrez les dernières annonces sur World Auto France !\n\nÀ bientôt !"
    
    # Créer le HTML
    site_url = os.environ.get('FRONTEND_URL', 'https://worldautofrance.com')
    
    def create_newsletter_html(subscriber_email: str):
        unsubscribe_url = f"{site_url}/api/newsletter/unsubscribe/{subscriber_email}"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1E3A5F;">World Auto France 🇫🇷</h1>
            </div>
            <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                <h2 style="color: #1E3A5F; margin-top: 0;">{title}</h2>
                <div style="white-space: pre-line;">{content}</div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{site_url}/annonces" style="background: #F97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Voir les annonces</a>
            </div>
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
                <p><a href="{unsubscribe_url}" style="color: #666;">Se désabonner</a></p>
            </div>
        </body>
        </html>
        """
        return html
    
    # Envoyer les emails
    sent_count = 0
    for subscriber in subscribers:
        try:
            html_content = create_newsletter_html(subscriber["email"])
            background_tasks.add_task(send_email, subscriber["email"], subject, html_content)
            sent_count += 1
        except Exception as e:
            logging.error(f"Failed to queue email for {subscriber['email']}: {e}")
    
    # Logger l'envoi
    newsletter_log = {
        "id": str(uuid.uuid4()),
        "subject": subject,
        "title": title,
        "sent_by": "cron-auto",
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "total_subscribers": len(subscribers),
        "sent_count": sent_count,
        "failed_count": len(subscribers) - sent_count
    }
    await db.newsletter_logs.insert_one(newsletter_log)
    
    return {
        "message": f"Newsletter envoyée à {sent_count} abonnés",
        "sent_count": sent_count,
        "total_subscribers": len(subscribers)
    }

# ================== SETTINGS ROUTES ==================

DEFAULT_HERO_SETTINGS = {
    "hero_title_line1": "La marketplace auto",
    "hero_title_line2": "pour tous",
    "hero_description": "Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.",
    "hero_image": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2832&auto=format&fit=crop",
    "hero_cta_text": "Déposer une annonce",
    "hero_cta_link": "/deposer",
    # New customization options
    "hero_title_size": "large",
    "hero_description_size": "medium",
    "hero_text_align": "left",
    "hero_height": "large",
    "hero_show_search": True,
    "hero_show_categories": True,
    "hero_overlay_opacity": 50,
    # Category images
    "category_pieces_image": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
    "category_voitures_image": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop",
    "category_motos_image": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop",
    "category_utilitaires_image": "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?w=600&h=400&fit=crop",
    "category_engins_image": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop",
    "category_accessoires_image": "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&h=400&fit=crop",
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

@api_router.get("/settings/promo-banner")
async def get_promo_banner_settings():
    """Get promo banner settings"""
    settings = await db.settings.find_one({"type": "promo_banner"}, {"_id": 0})
    if not settings:
        return {
            "enabled": True,
            "title": "Compte Premium",
            "subtitle": "Économisez encore plus",
            "highlight": "dès aujourd'hui avec WORLD AUTO PLUS",
            "benefits": [
                {"icon": "percent", "text": "10% de réduction sur les frais de service"},
                {"icon": "truck", "text": "Livraison prioritaire"},
                {"icon": "shield", "text": "Garantie étendue offerte"},
            ],
            "cta_text": "Essai gratuit 14 jours",
            "cta_link": "/premium",
            "badge_text": "NOUVEAU",
            "bg_color": "#1E3A5F",
            "accent_color": "#F97316",
            "coupon_code": "",
            "coupon_discount": "",
        }
    return settings

@api_router.post("/settings/promo-banner")
async def save_promo_banner_settings(settings: dict, current_user: dict = Depends(get_current_user)):
    """Save promo banner settings (admin only)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    settings["type"] = "promo_banner"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    settings["updated_by"] = current_user["id"]
    
    await db.settings.update_one(
        {"type": "promo_banner"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Configuration promo sauvegardée"}

# ================== EMAIL TEST ROUTE ==================

class EmailTestRequest(BaseModel):
    to_email: str

@api_router.post("/admin/test-email")
async def test_email_sending(request: EmailTestRequest, current_user: dict = Depends(get_current_user)):
    """Test endpoint to verify email configuration (admin only)"""
    # Check if user is admin
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    test_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E3A5F;">🧪 Test d'envoi email - World Auto France</h2>
        <p>Ceci est un email de test envoyé depuis le panneau d'administration.</p>
        <p><strong>Configuration actuelle :</strong></p>
        <ul>
            <li>SMTP Host: {SMTP_HOST}</li>
            <li>SMTP Port: {SMTP_PORT}</li>
            <li>From: {SMTP_USER}</li>
            <li>To: {request.to_email}</li>
        </ul>
        <p>Date: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M:%S UTC')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
    </div>
    """
    
    success = send_email(request.to_email, "🧪 Test Email - World Auto France", test_html)
    
    if success:
        return {
            "success": True,
            "message": f"Email de test envoyé à {request.to_email}",
            "smtp_config": {
                "host": SMTP_HOST,
                "port": SMTP_PORT,
                "user": SMTP_USER
            }
        }
    else:
        raise HTTPException(
            status_code=500, 
            detail=f"Échec de l'envoi. Vérifiez les logs du serveur pour plus de détails."
        )

# ================== EXTRA PHOTOS PURCHASE ==================

@api_router.post("/photos/create-checkout-session")
async def create_extra_photos_checkout(current_user: dict = Depends(get_current_user)):
    """Create Stripe checkout session for extra photos"""
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': EXTRA_PHOTOS_PACKAGE["name"],
                        'description': f'Ajoutez {EXTRA_PHOTOS_PACKAGE["photos"]} photos supplémentaires à vos annonces',
                    },
                    'unit_amount': int(EXTRA_PHOTOS_PACKAGE["price"] * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{SITE_URL}/deposer?photos_success=true",
            cancel_url=f"{SITE_URL}/deposer?photos_cancelled=true",
            metadata={
                "user_id": current_user["id"],
                "type": "extra_photos",
                "photos_count": str(EXTRA_PHOTOS_PACKAGE["photos"])
            },
            customer_email=current_user.get("email")
        )
        
        # Save transaction
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "type": "extra_photos",
            "photos_count": EXTRA_PHOTOS_PACKAGE["photos"],
            "amount": EXTRA_PHOTOS_PACKAGE["price"],
            "status": "pending",
            "stripe_session_id": checkout_session.id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"checkout_url": checkout_session.url}
        
    except Exception as e:
        logging.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/photos/package-info")
async def get_extra_photos_info():
    """Get extra photos package information"""
    return {
        "price": EXTRA_PHOTOS_PACKAGE["price"],
        "photos": EXTRA_PHOTOS_PACKAGE["photos"],
        "name": EXTRA_PHOTOS_PACKAGE["name"],
        "default_limit": DEFAULT_MAX_PHOTOS,
        "pro_limit": PRO_MAX_PHOTOS
    }

# ================== SHIPPING ROUTES ==================

CARRIERS = {
    "colissimo": {"name": "Colissimo", "logo": "📦"},
    "mondial_relay": {"name": "Mondial Relay", "logo": "🏪"},
    "chronopost": {"name": "Chronopost", "logo": "⚡"},
    "lettre_suivie": {"name": "Lettre Suivie", "logo": "✉️"}
}

# Mondial Relay API Configuration
MONDIAL_RELAY_WSDL = "https://api.mondialrelay.com/Web_Services.asmx?WSDL"
MONDIAL_RELAY_ENSEIGNE = os.environ.get("MONDIAL_RELAY_ENSEIGNE", "")
MONDIAL_RELAY_PRIVATE_KEY = os.environ.get("MONDIAL_RELAY_PRIVATE_KEY", "")
MONDIAL_RELAY_BRAND = os.environ.get("MONDIAL_RELAY_BRAND", "")

def mondial_relay_security_hash(*args):
    """Generate MD5 security hash for Mondial Relay API"""
    import hashlib
    concat = "".join(str(arg) for arg in args) + MONDIAL_RELAY_PRIVATE_KEY
    return hashlib.md5(concat.encode()).hexdigest().upper()

@api_router.get("/carriers")
async def get_carriers():
    """Liste des transporteurs disponibles"""
    return CARRIERS

@api_router.post("/shipping/mondial-relay/create-label")
async def create_mondial_relay_label(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Créer une étiquette Mondial Relay pour une commande"""
    from zeep import Client
    from zeep.exceptions import Fault
    
    # Get order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # Check authorization (only seller can create label)
    if order.get("seller_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Check if relay point is selected
    relay_info = order.get("relay_point")
    if not relay_info:
        raise HTTPException(status_code=400, detail="Aucun point relais sélectionné")
    
    # Get buyer info
    buyer = await db.users.find_one({"id": order["buyer_id"]}, {"_id": 0})
    if not buyer:
        raise HTTPException(status_code=404, detail="Acheteur non trouvé")
    
    # Get listing info for weight
    listing = await db.listings.find_one({"id": order["listing_id"]}, {"_id": 0})
    weight = int((listing.get("weight", 1) or 1) * 1000)  # Convert kg to grams
    
    try:
        client = Client(MONDIAL_RELAY_WSDL)
        
        # Prepare parameters
        params = {
            "Enseigne": MONDIAL_RELAY_ENSEIGNE,
            "ModeCol": "REL",  # Collection mode: Point Relais
            "ModeLiv": "24R",  # Delivery mode: Point Relais
            "NDossier": order_id[:15],  # Reference (max 15 chars)
            "NClient": buyer["id"][:9],  # Client number (max 9 chars)
            "Expe_Langage": "FR",
            "Expe_Ad1": current_user.get("company_name", current_user["name"])[:32],
            "Expe_Ad3": current_user.get("address", "")[:32],
            "Expe_Ville": current_user.get("city", "")[:26],
            "Expe_CP": current_user.get("postal_code", "")[:5],
            "Expe_Pays": "FR",
            "Expe_Tel1": current_user.get("phone", "")[:10].replace(" ", ""),
            "Expe_Mail": current_user["email"][:70],
            "Dest_Langage": "FR",
            "Dest_Ad1": buyer["name"][:32],
            "Dest_Ad3": relay_info.get("address", "")[:32],
            "Dest_Ville": relay_info.get("city", "")[:26],
            "Dest_CP": relay_info.get("postalCode", "")[:5],
            "Dest_Pays": "FR",
            "Dest_Tel1": buyer.get("phone", "")[:10].replace(" ", ""),
            "Dest_Mail": buyer["email"][:70],
            "Poids": str(weight),  # Weight in grams
            "NbColis": "1",
            "LIV_Rel_Pays": "FR",
            "LIV_Rel": relay_info.get("id", ""),  # Relay point ID
            "Texte": listing.get("title", "")[:30],
        }
        
        # Generate security hash
        security_string = (
            params["Enseigne"] + params["ModeCol"] + params["ModeLiv"] +
            params["NDossier"] + params["NClient"] + params["Expe_Langage"] +
            params["Expe_Ad1"] + params["Expe_Ad3"] + params["Expe_Ville"] +
            params["Expe_CP"] + params["Expe_Pays"] + params["Expe_Tel1"] +
            params["Expe_Mail"] + params["Dest_Langage"] + params["Dest_Ad1"] +
            params["Dest_Ad3"] + params["Dest_Ville"] + params["Dest_CP"] +
            params["Dest_Pays"] + params["Dest_Tel1"] + params["Dest_Mail"] +
            params["Poids"] + params["NbColis"] + params["LIV_Rel_Pays"] +
            params["LIV_Rel"] + params["Texte"]
        )
        params["Security"] = mondial_relay_security_hash(security_string)
        
        # Call API
        result = client.service.WSI2_CreationEtiquette(**params)
        
        if result.STAT != "0":
            error_messages = {
                "1": "Enseigne invalide",
                "2": "Numéro d'expédition non trouvé",
                "3": "Erreur de sécurité",
                "80": "Code postal invalide",
                "81": "Ville invalide",
                "82": "Pays invalide",
                "97": "Point relais invalide",
            }
            error_msg = error_messages.get(str(result.STAT), f"Erreur Mondial Relay: {result.STAT}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Save tracking info to order
        tracking_number = result.ExpeditionNum
        label_url = f"https://www.mondialrelay.fr/suivi-de-colis/?NumColis={tracking_number}"
        
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "tracking_number": tracking_number,
                    "tracking_url": label_url,
                    "carrier": "mondial_relay",
                    "label_created_at": datetime.now(timezone.utc).isoformat(),
                    "status": "shipped"
                }
            }
        )
        
        return {
            "success": True,
            "tracking_number": tracking_number,
            "label_url": f"https://www.mondialrelay.com/ww2/pdf/etiquettes.aspx?ens={MONDIAL_RELAY_ENSEIGNE}&expedition={tracking_number}",
            "tracking_url": label_url
        }
        
    except Fault as e:
        logger.error(f"Mondial Relay SOAP error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur Mondial Relay: {str(e)}")
    except Exception as e:
        logger.error(f"Mondial Relay error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de l'étiquette: {str(e)}")

@api_router.get("/shipping/mondial-relay/tracking/{tracking_number}")
async def get_mondial_relay_tracking(tracking_number: str):
    """Suivre un colis Mondial Relay"""
    from zeep import Client
    from zeep.exceptions import Fault
    
    try:
        client = Client(MONDIAL_RELAY_WSDL)
        
        # Generate security hash
        security = mondial_relay_security_hash(MONDIAL_RELAY_ENSEIGNE, tracking_number)
        
        # Call tracking API
        result = client.service.WSI2_TracingColisDetaille(
            Enseigne=MONDIAL_RELAY_ENSEIGNE,
            Expedition=tracking_number,
            Langue="FR",
            Security=security
        )
        
        if result.STAT != "0":
            raise HTTPException(status_code=404, detail="Colis non trouvé")
        
        # Parse tracking events
        events = []
        if hasattr(result, 'Tracing') and result.Tracing:
            for trace in result.Tracing.ret_WSI2_sub_TracingColisDetaille:
                events.append({
                    "date": trace.Date,
                    "location": trace.Libelle,
                    "status": trace.Libelle_Statut,
                })
        
        return {
            "tracking_number": tracking_number,
            "status": result.Libelle if hasattr(result, 'Libelle') else "En cours",
            "events": events,
            "tracking_url": f"https://www.mondialrelay.fr/suivi-de-colis/?NumColis={tracking_number}"
        }
        
    except Fault as e:
        logger.error(f"Mondial Relay tracking error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de suivi: {str(e)}")
    except Exception as e:
        logger.error(f"Tracking error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/shipping/mondial-relay/points")
async def search_mondial_relay_points(postal_code: str, country: str = "FR"):
    """Rechercher des points relais Mondial Relay"""
    from zeep import Client
    from zeep.exceptions import Fault
    
    try:
        client = Client(MONDIAL_RELAY_WSDL)
        
        # Generate security hash
        security = mondial_relay_security_hash(
            MONDIAL_RELAY_ENSEIGNE, country, postal_code, "24R"
        )
        
        # Call API
        result = client.service.WSI4_PointRelais_Recherche(
            Enseigne=MONDIAL_RELAY_ENSEIGNE,
            Pays=country,
            CP=postal_code,
            Action="24R",
            NombreResultats="10",
            Security=security
        )
        
        if result.STAT != "0":
            return {"points": [], "error": f"Erreur: {result.STAT}"}
        
        points = []
        if hasattr(result, 'PointsRelais') and result.PointsRelais:
            for point in result.PointsRelais.PointRelais_Details:
                points.append({
                    "id": point.Num,
                    "name": point.LgAdr1,
                    "address": point.LgAdr3,
                    "postal_code": point.CP,
                    "city": point.Ville,
                    "country": point.Pays,
                    "latitude": point.Latitude,
                    "longitude": point.Longitude,
                })
        
        return {"points": points}
        
    except Exception as e:
        logger.error(f"Point relais search error: {str(e)}")
        return {"points": [], "error": str(e)}

# ================== PAYMENT ROUTES ==================

@api_router.get("/subcategories/pieces")
async def get_pieces_subcategories():
    """Retourne toutes les sous-catégories de pièces détachées (style Opisto)"""
    return PIECES_SUBCATEGORIES

@api_router.get("/subcategories/accessoires")
async def get_accessoires_subcategories():
    """Retourne toutes les sous-catégories d'accessoires"""
    return ACCESSOIRES_SUBCATEGORIES

@api_router.get("/subcategories/motos")
async def get_motos_subcategories():
    """Retourne toutes les sous-catégories de motos/deux-roues"""
    return MOTOS_SUBCATEGORIES

@api_router.get("/subcategories/utilitaires")
async def get_utilitaires_subcategories():
    """Retourne toutes les sous-catégories d'utilitaires"""
    return UTILITAIRES_SUBCATEGORIES

@api_router.get("/subcategories/engins")
async def get_engins_subcategories():
    """Retourne toutes les sous-catégories d'engins"""
    return ENGINS_SUBCATEGORIES

# ============== SUBCATEGORY IMAGES ==============

@api_router.get("/subcategory-images")
async def get_subcategory_images():
    """Récupère toutes les images personnalisées des sous-catégories"""
    images = await db.subcategory_images.find({}).to_list(100)
    result = {}
    for img in images:
        key = f"{img.get('category')}_{img.get('subcategory')}"
        result[key] = img.get('image_url', '')
    return result

@api_router.post("/subcategory-images")
async def update_subcategory_image(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Met à jour l'image d'une sous-catégorie (admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    
    data = await request.json()
    category = data.get("category")
    subcategory = data.get("subcategory")
    image_url = data.get("image_url")
    
    if not category or not subcategory:
        raise HTTPException(status_code=400, detail="Catégorie et sous-catégorie requises")
    
    await db.subcategory_images.update_one(
        {"category": category, "subcategory": subcategory},
        {"$set": {
            "category": category,
            "subcategory": subcategory,
            "image_url": image_url,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {"success": True, "message": "Image mise à jour"}

@api_router.post("/subcategory-images/upload")
async def upload_subcategory_image(
    category: str = Form(...),
    subcategory: str = Form(...),
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload une image pour une sous-catégorie via Cloudinary"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    
    try:
        # Upload to Cloudinary
        contents = await image.read()
        result = cloudinary.uploader.upload(
            contents,
            folder="subcategory_images",
            public_id=f"{category}_{subcategory}",
            overwrite=True,
            transformation=[
                {"width": 400, "height": 300, "crop": "fill", "quality": "auto"}
            ]
        )
        
        image_url = result.get("secure_url")
        
        # Save to DB
        await db.subcategory_images.update_one(
            {"category": category, "subcategory": subcategory},
            {"$set": {
                "category": category,
                "subcategory": subcategory,
                "image_url": image_url,
                "cloudinary_id": result.get("public_id"),
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )
        
        return {"success": True, "image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/brands")
async def get_car_brands():
    """Retourne la liste des marques automobiles"""
    return CAR_BRANDS

@api_router.get("/pricing")
async def get_pricing():
    return PRICING_PACKAGES

@api_router.get("/countries/allowed")
async def get_allowed_countries():
    """Retourne la liste des pays autorisés pour la vente"""
    return {
        "allowed_countries": ALLOWED_COUNTRIES,
        "note": "La création de comptes acheteurs est ouverte à tous les pays. Cette restriction s'applique uniquement aux vendeurs souhaitant publier des annonces."
    }

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
    
    # Determine product name
    if package.get("is_pro"):
        product_name = f"{package['name']} - World Auto France"
    else:
        product_name = f"Pack {package['credits']} crédits - World Auto France"
    
    # Create Stripe checkout session
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": product_name,
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
            "credits": str(package["credits"]),
            "is_pro": str(package.get("is_pro", False)),
            "duration": str(package.get("duration", 30))
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
        "credits_count": package["credits"],
        "is_pro": package.get("is_pro", False),
        "duration_days": package.get("duration", 30),
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
            credits_to_add = transaction.get("credits_count") or transaction.get("listings_count", 0)
            await db.users.update_one(
                {"id": transaction["user_id"]},
                {"$inc": {"credits": credits_to_add}}
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
            metadata = session_data.get("metadata", {})
            
            if payment_status == "paid":
                # Check if this is a diagnostic credits purchase
                if metadata.get("type") == "diagnostic_credits":
                    user_id = metadata.get("user_id")
                    credits = int(metadata.get("credits", 0))
                    
                    if user_id and credits > 0:
                        await db.users.update_one(
                            {"id": user_id},
                            {"$inc": {"diagnostic_credits": credits}}
                        )
                        
                        # Log the purchase
                        await db.diagnostic_purchases.insert_one({
                            "id": str(uuid.uuid4()),
                            "user_id": user_id,
                            "credits": credits,
                            "session_id": session_id,
                            "amount": session_data.get("amount_total", 0) / 100,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
                        
                        logger.info(f"Added {credits} diagnostic credits to user {user_id}")
                
                # Check if this is an extra photos purchase
                elif metadata.get("type") == "extra_photos":
                    user_id = metadata.get("user_id")
                    photos_count = int(metadata.get("photos_count", 0))
                    
                    if user_id and photos_count > 0:
                        await db.users.update_one(
                            {"id": user_id},
                            {"$inc": {"extra_photo_credits": photos_count}}
                        )
                        
                        # Update transaction status
                        await db.transactions.update_one(
                            {"stripe_session_id": session_id},
                            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
                        )
                        
                        logger.info(f"Added {photos_count} extra photo credits to user {user_id}")
                
                # Check if this is an extended video purchase
                elif metadata.get("type") == "extended_video":
                    user_id = metadata.get("user_id")
                    
                    if user_id:
                        await db.users.update_one(
                            {"id": user_id},
                            {"$inc": {"extended_video_credits": 1}}
                        )
                        
                        logger.info(f"Added extended video credit to user {user_id}")
                
                # Check if this is a warranty purchase
                elif metadata.get("type") == "warranty":
                    listing_id = metadata.get("listing_id")
                    user_id = metadata.get("user_id")
                    warranty_duration = int(metadata.get("warranty_duration", 3))
                    
                    if listing_id and user_id:
                        # Calculate warranty expiration
                        warranty_expires = (datetime.now(timezone.utc) + timedelta(days=warranty_duration * 30)).isoformat()
                        
                        # Update listing with warranty
                        await db.listings.update_one(
                            {"id": listing_id},
                            {"$set": {
                                "has_warranty": True,
                                "warranty_duration": warranty_duration,
                                "warranty_purchased_at": datetime.now(timezone.utc).isoformat(),
                                "warranty_expires": warranty_expires
                            }}
                        )
                        
                        # Log the warranty purchase
                        await db.warranty_purchases.insert_one({
                            "id": str(uuid.uuid4()),
                            "listing_id": listing_id,
                            "user_id": user_id,
                            "duration_months": warranty_duration,
                            "expires_at": warranty_expires,
                            "session_id": session_id,
                            "amount": session_data.get("amount_total", 0) / 100,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
                        
                        logger.info(f"Added {warranty_duration} months warranty to listing {listing_id}")
                
                # Handle video boost purchase
                elif metadata.get("type") == "video_boost":
                    listing_id = metadata.get("listing_id")
                    user_id = metadata.get("user_id")
                    boost_duration = metadata.get("boost_duration", "1h")
                    
                    if listing_id and user_id:
                        # Calculate boost end time
                        hours = 24 if boost_duration == "24h" else 1
                        boost_end = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
                        
                        # Update listing with video boost
                        await db.listings.update_one(
                            {"id": listing_id},
                            {"$set": {
                                "video_boost_end": boost_end,
                                "video_boost_started_at": datetime.now(timezone.utc).isoformat(),
                                "video_boost_duration": boost_duration,
                                "video_boost_priority": 1 if boost_duration == "24h" else 0
                            }}
                        )
                        
                        # Log the purchase
                        await db.video_boost_purchases.insert_one({
                            "id": str(uuid.uuid4()),
                            "listing_id": listing_id,
                            "user_id": user_id,
                            "duration": boost_duration,
                            "boost_end": boost_end,
                            "session_id": session_id,
                            "amount": session_data.get("amount_total", 0) / 100,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
                        
                        logger.info(f"Added video boost ({boost_duration}) to listing {listing_id}")
                
                # Handle video package purchase
                elif metadata.get("type") == "video_package":
                    user_id = metadata.get("user_id")
                    package = metadata.get("package")
                    
                    if user_id and package:
                        # Add video credits based on package
                        credit_field = {
                            "extended": "extended_video_credits",
                            "intermediate": "intermediate_video_credits",
                            "pro": "pro_video_credits"
                        }.get(package, "extended_video_credits")
                        
                        await db.users.update_one(
                            {"id": user_id},
                            {"$inc": {credit_field: 1}}
                        )
                        
                        # Log the purchase
                        await db.video_package_purchases.insert_one({
                            "id": str(uuid.uuid4()),
                            "user_id": user_id,
                            "package": package,
                            "session_id": session_id,
                            "amount": session_data.get("amount_total", 0) / 100,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
                        
                        logger.info(f"Added {package} video package to user {user_id}")
                
                else:
                    # Regular transaction (credits for listings)
                    await db.payment_transactions.update_one(
                        {"session_id": session_id},
                        {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    
                    # Get transaction to add credits
                    transaction = await db.payment_transactions.find_one({"session_id": session_id})
                    if transaction:
                        credits_to_add = transaction.get("credits_count") or transaction.get("listings_count", 0)
                        await db.users.update_one(
                            {"id": transaction["user_id"]},
                            {"$inc": {"credits": credits_to_add}}
                        )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error"}

# ================== STRIPE CONNECT (MARKETPLACE) ROUTES ==================

PLATFORM_COMMISSION_PERCENT = 5  # 5% commission
PLATFORM_COMMISSION_MIN = 1.50  # Minimum 1.50€
PLATFORM_COMMISSION_MAX = 15.00  # Maximum 15€

def calculate_platform_fee(amount: float) -> float:
    """
    Calcule la commission de la plateforme avec la formule hybride:
    - 5% du montant
    - Minimum 1.50€
    - Maximum 15€
    """
    fee = amount * PLATFORM_COMMISSION_PERCENT / 100
    fee = max(fee, PLATFORM_COMMISSION_MIN)  # Appliquer le minimum
    fee = min(fee, PLATFORM_COMMISSION_MAX)  # Appliquer le maximum
    return round(fee, 2)

@api_router.get("/commission/calculate")
async def calculate_commission(amount: float):
    """
    Calculer la commission pour un montant donné.
    Formule: 5% avec minimum 1.50€ et maximum 15€
    """
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Le montant doit être positif")
    
    fee = calculate_platform_fee(amount)
    seller_receives = round(amount - fee, 2)
    
    return {
        "amount": amount,
        "commission_percent": PLATFORM_COMMISSION_PERCENT,
        "commission_min": PLATFORM_COMMISSION_MIN,
        "commission_max": PLATFORM_COMMISSION_MAX,
        "commission": fee,
        "seller_receives": seller_receives,
        "formula": f"5% (min {PLATFORM_COMMISSION_MIN}€, max {PLATFORM_COMMISSION_MAX}€)"
    }

@api_router.post("/stripe/connect/onboard")
async def create_connect_account(request: Request, current_user: dict = Depends(get_current_user)):
    """Créer un compte Stripe Express pour un vendeur et retourner l'URL d'onboarding"""
    stripe.api_key = STRIPE_API_KEY
    
    # Vérifier si l'utilisateur a déjà un compte connecté
    user = await db.users.find_one({"id": current_user["id"]})
    
    if user.get("stripe_account_id"):
        # Vérifier si le compte est déjà actif
        try:
            account = stripe.Account.retrieve(user["stripe_account_id"])
            if account.charges_enabled:
                return {"already_connected": True, "message": "Votre compte Stripe est déjà connecté"}
            else:
                # Le compte existe mais n'est pas complètement configuré, créer un nouveau lien
                account_id = user["stripe_account_id"]
        except Exception:
            # Compte invalide, en créer un nouveau
            account_id = None
    else:
        account_id = None
    
    # Créer un nouveau compte Express si nécessaire
    if not account_id:
        try:
            account = stripe.Account.create(
                type="express",
                country="FR",
                email=current_user["email"],
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                business_type="individual",
                metadata={
                    "user_id": current_user["id"],
                    "platform": "worldautofrance"
                }
            )
            account_id = account.id
            
            # Sauvegarder l'ID du compte dans la base
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"stripe_account_id": account_id, "stripe_connected": False}}
            )
        except Exception as e:
            logging.error(f"Error creating Stripe account: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la création du compte Stripe")
    
    # Créer le lien d'onboarding
    origin = request.headers.get("origin", SITE_URL)
    
    try:
        account_link = stripe.AccountLink.create(
            account=account_id,
            refresh_url=f"{origin}/profil?stripe_refresh=true",
            return_url=f"{origin}/profil?stripe_success=true",
            type="account_onboarding",
        )
        return {"url": account_link.url}
    except Exception as e:
        logging.error(f"Error creating account link: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création du lien Stripe")

@api_router.get("/stripe/connect/status")
async def get_connect_status(current_user: dict = Depends(get_current_user)):
    """Vérifier le statut du compte Stripe Connect d'un vendeur"""
    stripe.api_key = STRIPE_API_KEY
    
    user = await db.users.find_one({"id": current_user["id"]})
    
    if not user.get("stripe_account_id"):
        return {"connected": False, "charges_enabled": False, "message": "Aucun compte Stripe connecté"}
    
    try:
        account = stripe.Account.retrieve(user["stripe_account_id"])
        
        # Mettre à jour le statut dans la base
        if account.charges_enabled and not user.get("stripe_connected"):
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"stripe_connected": True}}
            )
        
        return {
            "connected": True,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "details_submitted": account.details_submitted,
            "account_id": user["stripe_account_id"]
        }
    except Exception as e:
        logging.error(f"Error retrieving Stripe account: {e}")
        return {"connected": False, "charges_enabled": False, "error": str(e)}

@api_router.post("/stripe/connect/refresh-link")
async def refresh_connect_link(request: Request, current_user: dict = Depends(get_current_user)):
    """Générer un nouveau lien d'onboarding si l'ancien a expiré"""
    stripe.api_key = STRIPE_API_KEY
    
    user = await db.users.find_one({"id": current_user["id"]})
    
    if not user.get("stripe_account_id"):
        raise HTTPException(status_code=400, detail="Aucun compte Stripe à configurer")
    
    origin = request.headers.get("origin", SITE_URL)
    
    try:
        account_link = stripe.AccountLink.create(
            account=user["stripe_account_id"],
            refresh_url=f"{origin}/profil?stripe_refresh=true",
            return_url=f"{origin}/profil?stripe_success=true",
            type="account_onboarding",
        )
        return {"url": account_link.url}
    except Exception as e:
        logging.error(f"Error refreshing account link: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création du lien")

class MarketplaceCheckoutRequest(BaseModel):
    listing_id: str
    quantity: int = 1

@api_router.post("/stripe/connect/checkout")
async def create_marketplace_checkout(
    checkout_data: MarketplaceCheckoutRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Créer une session de paiement marketplace avec escrow"""
    stripe.api_key = STRIPE_API_KEY
    
    # Récupérer l'annonce
    listing = await db.listings.find_one({"id": checkout_data.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    if listing.get("status") != "active":
        raise HTTPException(status_code=400, detail="Cette annonce n'est plus disponible")
    
    # Vérifier que l'acheteur n'est pas le vendeur
    if listing["seller_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas acheter votre propre annonce")
    
    # Récupérer le vendeur et vérifier son compte Stripe
    seller = await db.users.find_one({"id": listing["seller_id"]})
    if not seller:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")
    
    if not seller.get("stripe_account_id") or not seller.get("stripe_connected"):
        raise HTTPException(status_code=400, detail="Le vendeur n'a pas configuré son compte de paiement")
    
    # Vérifier que le compte vendeur peut recevoir des paiements
    try:
        seller_account = stripe.Account.retrieve(seller["stripe_account_id"])
        if not seller_account.charges_enabled:
            raise HTTPException(status_code=400, detail="Le compte du vendeur n'est pas encore activé")
    except Exception as e:
        logging.error(f"Error checking seller account: {e}")
        raise HTTPException(status_code=400, detail="Impossible de vérifier le compte du vendeur")
    
    # Calculer les montants
    price = float(listing["price"])
    shipping_cost = float(listing.get("shipping_cost", 0))
    total_amount = price + shipping_cost
    total_amount_cents = int(total_amount * 100)
    
    # Commission de la plateforme (5% avec min 1.50€ et max 15€)
    platform_fee = calculate_platform_fee(total_amount)
    platform_fee_cents = int(platform_fee * 100)
    
    # URLs de retour
    origin = request.headers.get("origin", SITE_URL)
    success_url = f"{origin}/commandes?payment_success=true&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/annonce/{listing['id']}?payment_cancelled=true"
    
    # Créer la description du produit
    product_name = f"{listing['title']}"
    if shipping_cost > 0:
        product_description = f"Prix: {price}€ + Frais de port: {shipping_cost}€"
    else:
        product_description = f"Prix: {price}€"
    
    try:
        # Créer la session Checkout avec destination charge
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": product_name,
                        "description": product_description,
                        "images": [listing["images"][0]] if listing.get("images") else [],
                    },
                    "unit_amount": total_amount_cents,
                },
                "quantity": checkout_data.quantity,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            payment_intent_data={
                "application_fee_amount": platform_fee_cents,
                "transfer_data": {
                    "destination": seller["stripe_account_id"],
                },
                "metadata": {
                    "listing_id": listing["id"],
                    "buyer_id": current_user["id"],
                    "seller_id": seller["id"],
                    "platform": "worldautofrance"
                }
            },
            metadata={
                "type": "marketplace",
                "listing_id": listing["id"],
                "buyer_id": current_user["id"],
                "seller_id": seller["id"],
                "price": str(price),
                "shipping_cost": str(shipping_cost),
                "total": str(total_amount)
            }
        )
        
        # Créer l'enregistrement de la commande en attente
        order_doc = {
            "id": str(uuid.uuid4()),
            "stripe_session_id": session.id,
            "listing_id": listing["id"],
            "listing_title": listing["title"],
            "listing_image": listing["images"][0] if listing.get("images") else None,
            "buyer_id": current_user["id"],
            "buyer_name": current_user["name"],
            "buyer_email": current_user["email"],
            "seller_id": seller["id"],
            "seller_name": seller["name"],
            "seller_email": seller["email"],
            "price": price,
            "shipping_cost": shipping_cost,
            "total_amount": total_amount,
            "platform_fee": platform_fee_cents / 100,
            "seller_receives": (total_amount_cents - platform_fee_cents) / 100,
            "payment_status": "pending",
            "order_status": "pending_payment",
            "escrow_status": "not_paid",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.marketplace_orders.insert_one(order_doc)
        
        return {"url": session.url, "session_id": session.id}
        
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur Stripe: {str(e)}")

@api_router.get("/stripe/connect/checkout/status/{session_id}")
async def get_marketplace_checkout_status(session_id: str, current_user: dict = Depends(get_current_user)):
    """Vérifier le statut d'un paiement marketplace"""
    stripe.api_key = STRIPE_API_KEY
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Mettre à jour la commande si le paiement est complété
        if session.payment_status == "paid":
            order = await db.marketplace_orders.find_one({"stripe_session_id": session_id})
            if order and order.get("payment_status") != "paid":
                # Mettre à jour le statut
                await db.marketplace_orders.update_one(
                    {"stripe_session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "order_status": "paid",
                        "escrow_status": "held",
                        "paid_at": datetime.now(timezone.utc).isoformat(),
                        "stripe_payment_intent_id": session.payment_intent
                    }}
                )
                
                # Marquer l'annonce comme vendue
                await db.listings.update_one(
                    {"id": order["listing_id"]},
                    {"$set": {"status": "sold", "sold_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Envoyer les emails de notification
                buyer = await db.users.find_one({"id": order["buyer_id"]})
                seller = await db.users.find_one({"id": order["seller_id"]})
                
                if buyer and seller:
                    # Email à l'acheteur
                    buyer_html = f"""
                    <h2>Commande confirmée !</h2>
                    <p>Bonjour {buyer['name']},</p>
                    <p>Votre paiement de <strong>{order['total_amount']}€</strong> pour "{order['listing_title']}" a été confirmé.</p>
                    <p>L'argent est sécurisé jusqu'à la confirmation de réception.</p>
                    <p>Le vendeur va maintenant préparer l'expédition.</p>
                    """
                    send_email(buyer["email"], "Commande confirmée - World Auto France", buyer_html)
                    
                    # Email au vendeur
                    seller_html = f"""
                    <h2>Nouvelle vente !</h2>
                    <p>Bonjour {seller['name']},</p>
                    <p>Félicitations ! Votre article "{order['listing_title']}" a été vendu pour <strong>{order['total_amount']}€</strong>.</p>
                    <p>Vous recevrez <strong>{order['seller_receives']}€</strong> après confirmation de réception par l'acheteur.</p>
                    <p>Veuillez expédier l'article et marquer la commande comme "Expédiée" dans votre espace.</p>
                    """
                    send_email(seller["email"], "Nouvelle vente ! - World Auto France", seller_html)
        
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency
        }
        
    except Exception as e:
        logging.error(f"Error checking session status: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification")

@api_router.get("/marketplace/orders")
async def get_marketplace_orders(current_user: dict = Depends(get_current_user)):
    """Récupérer les commandes marketplace d'un utilisateur (acheteur ou vendeur)"""
    # Commandes en tant qu'acheteur
    buyer_orders = await db.marketplace_orders.find(
        {"buyer_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Commandes en tant que vendeur
    seller_orders = await db.marketplace_orders.find(
        {"seller_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {
        "as_buyer": buyer_orders,
        "as_seller": seller_orders
    }

@api_router.post("/marketplace/orders/{order_id}/ship")
async def mark_order_shipped(
    order_id: str,
    tracking_number: Optional[str] = None,
    carrier: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """Marquer une commande comme expédiée (vendeur uniquement)"""
    order = await db.marketplace_orders.find_one({"id": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    if order["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    if order["order_status"] != "paid":
        raise HTTPException(status_code=400, detail="Cette commande ne peut pas être expédiée")
    
    # Mettre à jour le statut
    update_data = {
        "order_status": "shipped",
        "shipped_at": datetime.now(timezone.utc).isoformat(),
    }
    if tracking_number:
        update_data["tracking_number"] = tracking_number
    if carrier:
        update_data["carrier"] = carrier
    
    await db.marketplace_orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Notifier l'acheteur
    buyer = await db.users.find_one({"id": order["buyer_id"]})
    if buyer:
        html = f"""
        <h2>Votre commande a été expédiée !</h2>
        <p>Bonjour {buyer['name']},</p>
        <p>Votre commande "{order['listing_title']}" a été expédiée.</p>
        {"<p>Numéro de suivi: <strong>" + tracking_number + "</strong></p>" if tracking_number else ""}
        {"<p>Transporteur: " + carrier + "</p>" if carrier else ""}
        <p>Une fois reçu, n'oubliez pas de confirmer la réception pour libérer le paiement au vendeur.</p>
        """
        send_email(buyer["email"], "Commande expédiée - World Auto France", html)
    
    return {"message": "Commande marquée comme expédiée"}

@api_router.post("/marketplace/orders/{order_id}/confirm-delivery")
async def confirm_delivery(order_id: str, current_user: dict = Depends(get_current_user)):
    """Confirmer la réception d'une commande (acheteur uniquement) - Libère les fonds"""
    order = await db.marketplace_orders.find_one({"id": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    if order["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    if order["order_status"] not in ["paid", "shipped"]:
        raise HTTPException(status_code=400, detail="Cette commande ne peut pas être confirmée")
    
    if order.get("escrow_status") == "released":
        return {"message": "Les fonds ont déjà été libérés"}
    
    # Mettre à jour le statut
    await db.marketplace_orders.update_one(
        {"id": order_id},
        {"$set": {
            "order_status": "delivered",
            "escrow_status": "released",
            "delivered_at": datetime.now(timezone.utc).isoformat(),
            "funds_released_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Note: Avec Stripe Connect destination charges, les fonds sont automatiquement
    # transférés au vendeur. L'escrow_status sert juste pour le suivi.
    
    # Notifier le vendeur
    seller = await db.users.find_one({"id": order["seller_id"]})
    if seller:
        html = f"""
        <h2>Paiement reçu !</h2>
        <p>Bonjour {seller['name']},</p>
        <p>L'acheteur a confirmé la réception de "{order['listing_title']}".</p>
        <p>Le paiement de <strong>{order['seller_receives']}€</strong> sera versé sur votre compte Stripe.</p>
        <p>Merci d'utiliser World Auto France !</p>
        """
        send_email(seller["email"], "Paiement reçu ! - World Auto France", html)
    
    return {"message": "Réception confirmée, fonds libérés"}

# ================== STATS ROUTES ==================

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Get user's listings stats
    listings = await db.listings.find({"seller_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    active_count = sum(1 for l in listings if l.get("status") == "active")
    sold_count = sum(1 for l in listings if l.get("status") == "sold")
    total_views = sum(l.get("views", 0) for l in listings)
    
    # Get unread messages count
    unread_messages = await db.messages.count_documents({
        "receiver_id": current_user["id"],
        "read": False
    })
    
    # Get total messages received (for conversion rate)
    total_messages_received = await db.messages.count_documents({
        "receiver_id": current_user["id"]
    })
    
    # Get user credits and loyalty points
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "credits": 1, "loyalty_points": 1})
    
    # PRO Stats: Top 5 performing listings
    active_listings = [l for l in listings if l.get("status") == "active"]
    top_listings = sorted(active_listings, key=lambda x: x.get("views", 0), reverse=True)[:5]
    
    # PRO Stats: Listings with no views in last 7 days (needs attention)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    listings_needing_attention = [
        {"id": l["id"], "title": l["title"], "views": l.get("views", 0), "created_at": l.get("created_at")}
        for l in active_listings 
        if l.get("views", 0) < 5 and l.get("created_at", "") < seven_days_ago
    ][:5]
    
    # PRO Stats: Conversion rate (messages / views)
    conversion_rate = round((total_messages_received / total_views * 100), 1) if total_views > 0 else 0
    
    # PRO Stats: Average views per listing
    avg_views = round(total_views / len(active_listings), 1) if active_listings else 0
    
    # PRO Stats: Boosted listings count
    boosted_count = sum(1 for l in listings if l.get("is_boosted"))
    featured_count = sum(1 for l in listings if l.get("is_featured"))
    
    # ===== SALES & COMMISSION STATS =====
    # Get orders where user is seller
    orders = await db.orders.find({"seller_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    # Calculate total sales
    total_sales_count = len(orders)
    total_sales_revenue = sum(float(o.get("price", 0)) for o in orders)
    
    # Calculate commissions using hybrid formula
    total_commissions = 0
    for order in orders:
        price = float(order.get("price", 0))
        commission = calculate_platform_fee(price)
        total_commissions += commission
    
    # Net revenue (after commissions)
    net_revenue = round(total_sales_revenue - total_commissions, 2)
    
    # Monthly stats (current month)
    first_day_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    monthly_orders = [o for o in orders if o.get("created_at", "") >= first_day_of_month]
    monthly_sales_count = len(monthly_orders)
    monthly_sales_revenue = sum(float(o.get("price", 0)) for o in monthly_orders)
    monthly_commissions = sum(calculate_platform_fee(float(o.get("price", 0))) for o in monthly_orders)
    monthly_net_revenue = round(monthly_sales_revenue - monthly_commissions, 2)
    
    # Last 6 months revenue chart data
    revenue_chart = []
    for i in range(5, -1, -1):
        month_date = datetime.now(timezone.utc) - timedelta(days=i*30)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_date.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        
        month_orders = [
            o for o in orders 
            if month_start.isoformat() <= o.get("created_at", "") < month_end.isoformat()
        ]
        month_revenue = sum(float(o.get("price", 0)) for o in month_orders)
        month_commission = sum(calculate_platform_fee(float(o.get("price", 0))) for o in month_orders)
        
        revenue_chart.append({
            "month": month_start.strftime("%b"),
            "revenue": round(month_revenue, 2),
            "net": round(month_revenue - month_commission, 2),
            "commission": round(month_commission, 2),
            "sales": len(month_orders)
        })
    
    return {
        "active_listings": active_count,
        "total_listings": len(listings),
        "sold_listings": sold_count,
        "total_views": total_views,
        "unread_messages": unread_messages,
        "credits": user.get("credits", 0),
        "loyalty_points": user.get("loyalty_points", 0),
        # PRO Stats
        "conversion_rate": conversion_rate,
        "avg_views_per_listing": avg_views,
        "boosted_count": boosted_count,
        "featured_count": featured_count,
        "top_listings": [
            {"id": l["id"], "title": l["title"][:40], "views": l.get("views", 0), "price": l.get("price", 0)}
            for l in top_listings
        ],
        "listings_needing_attention": listings_needing_attention,
        "total_messages_received": total_messages_received,
        # Sales & Commission Stats
        "sales": {
            "total_count": total_sales_count,
            "total_revenue": round(total_sales_revenue, 2),
            "total_commissions": round(total_commissions, 2),
            "net_revenue": net_revenue,
            "monthly_count": monthly_sales_count,
            "monthly_revenue": round(monthly_sales_revenue, 2),
            "monthly_commissions": round(monthly_commissions, 2),
            "monthly_net": monthly_net_revenue,
            "revenue_chart": revenue_chart
        }
    }

@api_router.get("/stats/export-pdf")
async def export_sales_pdf(current_user: dict = Depends(get_current_user)):
    """Export sales statistics as PDF for accounting"""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    import io
    
    # Get user data
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    # Get all orders where user is seller
    orders = await db.orders.find({"seller_id": current_user["id"]}).sort("created_at", -1).to_list(1000)
    
    # Calculate stats
    total_revenue = sum(float(o.get("price", 0)) for o in orders)
    total_commissions = sum(calculate_platform_fee(float(o.get("price", 0))) for o in orders)
    net_revenue = total_revenue - total_commissions
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, alignment=TA_CENTER, spaceAfter=20)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, textColor=colors.grey, spaceAfter=30)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=14, spaceBefore=20, spaceAfter=10)
    
    elements = []
    
    # Header
    elements.append(Paragraph("World Auto Pro", title_style))
    elements.append(Paragraph("Relevé de compte vendeur", subtitle_style))
    elements.append(Paragraph(f"Généré le {datetime.now(timezone.utc).strftime('%d/%m/%Y à %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Seller info
    elements.append(Paragraph("Informations vendeur", section_style))
    seller_data = [
        ["Nom", user.get("name", "N/A")],
        ["Email", user.get("email", "N/A")],
        ["Téléphone", user.get("phone", "N/A")],
        ["Membre depuis", user.get("created_at", "N/A")[:10] if user.get("created_at") else "N/A"],
    ]
    seller_table = Table(seller_data, colWidths=[5*cm, 10*cm])
    seller_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.Color(0.95, 0.95, 0.95)),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(seller_table)
    elements.append(Spacer(1, 20))
    
    # Summary
    elements.append(Paragraph("Résumé financier", section_style))
    summary_data = [
        ["Description", "Montant"],
        ["Nombre total de ventes", str(len(orders))],
        ["Chiffre d'affaires brut", f"{total_revenue:.2f} €"],
        ["Commission World Auto Pro (5%, min 1,50€, max 15€)", f"-{total_commissions:.2f} €"],
        ["Revenus nets", f"{net_revenue:.2f} €"],
    ]
    summary_table = Table(summary_data, colWidths=[10*cm, 5*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.2, 0.4, 0.6)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.Color(0.9, 0.95, 0.9)),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Orders detail
    if orders:
        elements.append(Paragraph("Détail des ventes", section_style))
        orders_data = [["Date", "Article", "Prix", "Commission", "Net"]]
        for order in orders[:50]:  # Limit to 50 for PDF size
            price = float(order.get("price", 0))
            commission = calculate_platform_fee(price)
            orders_data.append([
                order.get("created_at", "")[:10],
                order.get("listing_title", "N/A")[:30],
                f"{price:.2f} €",
                f"-{commission:.2f} €",
                f"{price - commission:.2f} €"
            ])
        
        orders_table = Table(orders_data, colWidths=[2.5*cm, 7*cm, 2.5*cm, 2.5*cm, 2.5*cm])
        orders_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.2, 0.4, 0.6)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.97, 0.97, 0.97)]),
        ]))
        elements.append(orders_table)
        
        if len(orders) > 50:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph(f"... et {len(orders) - 50} autres ventes", styles['Normal']))
    
    elements.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    elements.append(Paragraph("Ce document est généré automatiquement par World Auto Pro.", footer_style))
    elements.append(Paragraph("Pour toute question, contactez contact@worldautofrance.com", footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    # Return as downloadable file
    filename = f"worldautopro_releve_{current_user['id'][:8]}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/categories/stats")
async def get_category_stats():
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    stats = await db.listings.aggregate(pipeline).to_list(10)
    return {s["_id"]: s["count"] for s in stats}

# ================== REPORTS (SIGNALEMENTS) ==================

class ReportCreate(BaseModel):
    target_type: str  # "listing" or "user"
    target_id: str
    reason: str  # "spam", "scam", "inappropriate", "counterfeit", "other"
    description: Optional[str] = None

REPORT_REASONS = {
    "spam": "Spam ou publicité",
    "scam": "Arnaque suspectée", 
    "inappropriate": "Contenu inapproprié",
    "counterfeit": "Contrefaçon",
    "wrong_category": "Mauvaise catégorie",
    "duplicate": "Annonce en double",
    "other": "Autre raison"
}

@api_router.post("/reports")
async def create_report(report: ReportCreate, current_user: dict = Depends(get_current_user)):
    """Signaler une annonce ou un utilisateur"""
    if report.target_type not in ["listing", "user"]:
        raise HTTPException(status_code=400, detail="Type de signalement invalide")
    
    if report.reason not in REPORT_REASONS:
        raise HTTPException(status_code=400, detail="Raison de signalement invalide")
    
    # Verify target exists
    if report.target_type == "listing":
        target = await db.listings.find_one({"id": report.target_id})
        if not target:
            raise HTTPException(status_code=404, detail="Annonce non trouvée")
        target_name = target.get("title", "Annonce inconnue")
    else:
        target = await db.users.find_one({"id": report.target_id})
        if not target:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        target_name = target.get("name", "Utilisateur inconnu")
    
    # Check if already reported by this user
    existing = await db.reports.find_one({
        "reporter_id": current_user["id"],
        "target_type": report.target_type,
        "target_id": report.target_id,
        "status": {"$ne": "resolved"}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà signalé cet élément")
    
    report_doc = {
        "id": str(uuid.uuid4()),
        "reporter_id": current_user["id"],
        "reporter_name": current_user["name"],
        "target_type": report.target_type,
        "target_id": report.target_id,
        "target_name": target_name,
        "reason": report.reason,
        "reason_label": REPORT_REASONS[report.reason],
        "description": report.description,
        "status": "pending",  # pending, reviewed, resolved, dismissed
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
        "admin_notes": None
    }
    
    await db.reports.insert_one(report_doc)
    
    # Notify admin by email
    admin_html = f"""
    <h2>🚨 Nouveau signalement</h2>
    <p><strong>Type:</strong> {report.target_type}</p>
    <p><strong>Cible:</strong> {target_name} (ID: {report.target_id})</p>
    <p><strong>Raison:</strong> {REPORT_REASONS[report.reason]}</p>
    <p><strong>Description:</strong> {report.description or 'Aucune'}</p>
    <p><strong>Signalé par:</strong> {current_user['name']} ({current_user['email']})</p>
    <p><a href="{os.environ.get('FRONTEND_URL', 'https://worldautofrance.com')}/admin/signalements">Voir les signalements</a></p>
    """
    send_email(ADMIN_EMAIL, f"🚨 Nouveau signalement - {REPORT_REASONS[report.reason]}", admin_html)
    
    return {"message": "Signalement envoyé avec succès", "report_id": report_doc["id"]}

@api_router.get("/reports")
async def get_reports(
    status: Optional[str] = None,
    target_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Récupérer les signalements (admin uniquement)"""
    if current_user["email"] != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    query = {}
    if status:
        query["status"] = status
    if target_type:
        query["target_type"] = target_type
    
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get stats
    total = await db.reports.count_documents({})
    pending = await db.reports.count_documents({"status": "pending"})
    
    return {
        "reports": reports,
        "stats": {
            "total": total,
            "pending": pending
        }
    }

@api_router.put("/reports/{report_id}")
async def update_report(
    report_id: str,
    status: str,
    admin_notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Mettre à jour un signalement (admin uniquement)"""
    if current_user["email"] != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    if status not in ["pending", "reviewed", "resolved", "dismissed"]:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    report = await db.reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Signalement non trouvé")
    
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if admin_notes:
        update_data["admin_notes"] = admin_notes
    
    await db.reports.update_one({"id": report_id}, {"$set": update_data})
    
    # If resolved and target is a listing, optionally deactivate it
    if status == "resolved" and report["target_type"] == "listing":
        await db.listings.update_one(
            {"id": report["target_id"]},
            {"$set": {"status": "suspended", "suspension_reason": f"Signalement: {report['reason_label']}"}}
        )
    
    return {"message": "Signalement mis à jour"}

@api_router.get("/reports/reasons")
async def get_report_reasons():
    """Récupérer les raisons de signalement disponibles"""
    return REPORT_REASONS

# ================== AUTOEXPERT AI ASSISTANT ==================

TOBI_SYSTEM_PROMPT = """Tu es Tobi, l'assistant IA de World Auto France, la marketplace automobile française.

🎯 Ton rôle :
- Aider les utilisateurs à trouver des pièces détachées compatibles avec leur véhicule
- Répondre aux questions sur la compatibilité des pièces
- Donner des conseils sur l'entretien automobile
- Guider les utilisateurs sur l'utilisation de la plateforme
- Suggérer des alternatives quand une pièce n'est pas disponible

📚 Tes connaissances :
- Pièces détachées automobiles (moteur, freinage, suspension, carrosserie, électronique...)
- Marques : Renault, Peugeot, Citroën, Volkswagen, BMW, Mercedes, Audi, Ford, Opel, Toyota, Nissan, Honda, Fiat, Seat, Skoda, Hyundai, Kia, Dacia, Volvo, Mazda...
- Références OEM et équipementier
- Compatibilité entre véhicules
- Conseils d'entretien et de montage

⚙️ Fonctionnalités de World Auto France :
- Recherche par catégorie (Pièces, Voitures, Motos, Utilitaires, Accessoires)
- Recherche par référence OEM
- Filtres par compatibilité véhicule (Marque/Modèle/Année)
- Paiement sécurisé avec protection acheteur
- Messagerie entre acheteurs et vendeurs
- Points relais Mondial Relay pour la livraison

🗣️ Style de communication :
- Toujours en français
- Amical et professionnel
- Utilise des emojis avec modération pour être sympathique
- Donne des réponses concises mais complètes
- Si tu ne connais pas la réponse exacte, oriente vers le service client

💡 Exemples de questions auxquelles tu peux répondre :
- "Quels sont les filtres à huile compatibles avec ma Clio 4 1.5 dCi ?"
- "Comment trouver une pièce avec sa référence OEM ?"
- "Est-ce que cette pièce est compatible avec ma voiture ?"
- "Comment fonctionne le paiement sécurisé ?"
- "Où puis-je me faire livrer ?"
"""

# Store for chat sessions (in production, use Redis or database)
chat_sessions: Dict[str, LlmChat] = {}

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

@api_router.post("/tobi/chat", response_model=ChatResponse)
async def tobi_chat(chat_message: ChatMessage):
    """Chat avec Tobi, l'assistant IA"""
    try:
        # Get or create session
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Clé API non configurée")
        
        # Get or create chat instance for this session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = LlmChat(
                api_key=api_key,
                session_id=session_id,
                system_message=TOBI_SYSTEM_PROMPT
            ).with_model("openai", "gpt-4o-mini")
        
        chat = chat_sessions[session_id]
        
        # Send message and get response
        user_message = UserMessage(text=chat_message.message)
        response = await chat.send_message(user_message)
        
        # Store conversation in database for persistence
        await db.tobi_conversations.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_message": chat_message.message,
            "assistant_response": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"Tobi error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@api_router.get("/tobi/history/{session_id}")
async def get_tobi_history(session_id: str):
    """Récupérer l'historique d'une conversation"""
    history = await db.tobi_conversations.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return history

@api_router.delete("/tobi/session/{session_id}")
async def clear_tobi_session(session_id: str):
    """Effacer une session de chat"""
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    await db.tobi_conversations.delete_many({"session_id": session_id})
    return {"message": "Session effacée"}

# ================== KIM AGENT ==================

KIM_SYSTEM_PROMPT = """Tu es KIM, un assistant IA expert en automobile pour World Auto France.

Tu aides les utilisateurs avec:
- **Diagnostic de pannes** : Identifier les problèmes mécaniques à partir des symptômes
- **Recherche de pièces** : Trouver les pièces compatibles avec leur véhicule
- **Conseils d'entretien** : Maintenance préventive et bonnes pratiques
- **Estimation de coûts** : Prix approximatifs des réparations
- **Tutoriels** : Guides pas à pas pour les réparations simples

Ton style:
- Réponds en français, de manière claire et professionnelle
- Utilise des emojis pertinents (🚗 🔧 ⚠️ ✅ 💡)
- Structure tes réponses avec des listes et titres en gras
- Si tu ne sais pas, dis-le honnêtement
- Propose toujours une prochaine étape ou question de suivi
- Mentionne World Auto France quand c'est pertinent pour trouver des pièces

Tu es amical, expert et tu veux vraiment aider les automobilistes !"""

# Store for KIM sessions
kim_sessions: Dict[str, LlmChat] = {}

@api_router.post("/kim/chat", response_model=ChatResponse)
async def kim_chat(chat_message: ChatMessage):
    """Chat avec KIM Agent, l'assistant automobile IA"""
    try:
        # Get or create session
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Clé API non configurée")
        
        # Get or create chat instance for this session
        if session_id not in kim_sessions:
            kim_sessions[session_id] = LlmChat(
                api_key=api_key,
                session_id=session_id,
                system_message=KIM_SYSTEM_PROMPT
            ).with_model("openai", "gpt-4o-mini")
        
        chat = kim_sessions[session_id]
        
        # Send message and get response
        user_message = UserMessage(text=chat_message.message)
        response = await chat.send_message(user_message)
        
        # Store conversation in database
        await db.kim_conversations.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_message": chat_message.message,
            "assistant_response": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"KIM error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@api_router.get("/kim/history/{session_id}")
async def get_kim_history(session_id: str):
    """Récupérer l'historique d'une conversation KIM"""
    history = await db.kim_conversations.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return history

@api_router.delete("/kim/session/{session_id}")
async def clear_kim_session(session_id: str):
    """Effacer une session KIM"""
    if session_id in kim_sessions:
        del kim_sessions[session_id]
    await db.kim_conversations.delete_many({"session_id": session_id})
    return {"message": "Session KIM effacée"}

# ================== AI TOOLS ==================

PART_RECOGNITION_PROMPT = """Tu es un expert en pièces détachées automobiles. Analyse cette image et identifie:

1. **Type de pièce** : Quel type de pièce automobile est-ce ? (ex: filtre à huile, plaquettes de frein, alternateur, etc.)
2. **État apparent** : Neuf, occasion bon état, usé, à reconditionner ?
3. **Marques compatibles** : Pour quelles marques de véhicules cette pièce pourrait être compatible ?
4. **Référence possible** : Si visible, note toute référence OEM ou équipementier
5. **Conseils** : Donne des conseils pour trouver cette pièce sur World Auto France

Réponds en français de manière structurée et professionnelle."""

PRICE_ESTIMATION_PROMPT = """Tu es un expert en évaluation de pièces automobiles d'occasion. Estime le prix de cette pièce:

Pièce: {part_name}
État: {condition}
Marque compatible: {brand}
Année du véhicule: {year}

Fournis:
1. **Fourchette de prix estimée** : Prix min - max en euros
2. **Prix moyen du marché** : Basé sur les prix habituels
3. **Facteurs influençant le prix** : Ce qui peut faire varier le prix
4. **Conseils de vente** : Pour optimiser la vente sur World Auto France

Réponds en français de manière structurée."""

@api_router.post("/ai/recognize-part")
async def recognize_part(file: UploadFile = File(...)):
    """Reconnaître une pièce automobile à partir d'une photo"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    try:
        # Read image and convert to base64
        contents = await file.read()
        import base64
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Clé API non configurée")
        
        # Create chat with vision capability
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recognize_{uuid.uuid4()}",
            system_message=PART_RECOGNITION_PROMPT
        ).with_model("openai", "gpt-4o")
        
        # Send image for analysis using base64
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text="Analyse cette pièce automobile:",
            file_contents=[image_content]
        )
        response = await chat.send_message(user_message)
        
        # Also upload to Cloudinary for reference
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="worldauto_temp",
            resource_type="image"
        )
        image_url = upload_result['secure_url']
        
        return {
            "analysis": response,
            "image_url": image_url
        }
        
    except Exception as e:
        logger.error(f"Part recognition error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur d'analyse: {str(e)}")

class PriceEstimationRequest(BaseModel):
    part_name: str
    condition: str = "occasion"
    brand: Optional[str] = None
    year: Optional[int] = None

@api_router.post("/ai/estimate-price")
async def estimate_price(request: PriceEstimationRequest):
    """Estimer le prix d'une pièce automobile"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Clé API non configurée")
        
        prompt = PRICE_ESTIMATION_PROMPT.format(
            part_name=request.part_name,
            condition=request.condition,
            brand=request.brand or "Non spécifié",
            year=request.year or "Non spécifié"
        )
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"estimate_{uuid.uuid4()}",
            system_message="Tu es un expert en évaluation de pièces automobiles."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "estimation": response,
            "part_name": request.part_name,
            "condition": request.condition
        }
        
    except Exception as e:
        logger.error(f"Price estimation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur d'estimation: {str(e)}")

# ================== PLATE SCANNER (OCR) ==================

@api_router.post("/scan-plate")
async def scan_plate(file: UploadFile = File(...)):
    """Scanner une plaque d'immatriculation (OCR basique, prêt pour SIV)"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    try:
        contents = await file.read()
        import base64
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"plate": None, "message": "OCR non disponible"}
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"plate_{uuid.uuid4()}",
            system_message="Tu es un expert en reconnaissance de plaques d'immatriculation françaises. Tu dois extraire UNIQUEMENT le numéro de plaque visible sur l'image. Réponds UNIQUEMENT avec le numéro de plaque au format XX-123-XX ou XX123XX, sans aucun autre texte. Si tu ne vois pas de plaque claire, réponds 'NONE'."
        ).with_model("openai", "gpt-4o")
        
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text="Lis la plaque d'immatriculation sur cette image :",
            file_contents=[image_content]
        )
        response = await chat.send_message(user_message)
        
        # Clean response
        plate = response.strip().upper().replace(' ', '').replace('-', '')
        if plate == 'NONE' or len(plate) < 5 or len(plate) > 10:
            return {"plate": None, "message": "Plaque non détectée"}
        
        # Format plate
        if len(plate) == 7:
            formatted = f"{plate[:2]}-{plate[2:5]}-{plate[5:]}"
        else:
            formatted = plate
        
        return {"plate": formatted, "raw": plate}
        
    except Exception as e:
        logger.error(f"Plate scan error: {str(e)}")
        return {"plate": None, "message": "Erreur lors du scan"}

# ================== DIAGNOSTIC IA ==================

DIAGNOSTIC_PROMPT = """Tu es Tobi, expert en diagnostic automobile chez World Auto France.

L'utilisateur décrit un problème avec son véhicule. Tu dois :
1. Analyser les symptômes décrits
2. Identifier les causes probables (de la plus probable à la moins probable)
3. Suggérer les pièces qui pourraient être à remplacer
4. Donner une estimation de l'urgence (⚠️ Urgent, 🟡 Moyen, 🟢 Peut attendre)
5. Conseiller si l'utilisateur peut intervenir lui-même ou doit aller chez un pro

Véhicule : {vehicle}
Problème décrit : {problem}

Réponds de manière structurée et accessible, avec des emojis pour la clarté."""

# Diagnostic pricing configuration
DIAGNOSTIC_PRICING = {
    "single_price": 0.99,  # Prix unitaire en euros
    "pack_5_price": 3.99,  # Pack 5 diagnostics
    "points_cost": 100,    # Points fidélité pour 1 diagnostic
}

class DiagnosticRequest(BaseModel):
    problem: str
    vehicle: Optional[str] = None
    use_credits: bool = False  # Utiliser les crédits diagnostics
    use_points: bool = False   # Utiliser les points fidélité

@api_router.get("/ai/diagnostic/access")
async def check_diagnostic_access(current_user: dict = Depends(get_current_user)):
    """Vérifie si l'utilisateur a accès gratuit au diagnostic"""
    # Vérifier si l'utilisateur a au moins une annonce active
    active_listings_count = await db.listings.count_documents({
        "seller_id": current_user["id"],
        "status": "active"
    })
    
    has_free_access = active_listings_count > 0
    diagnostic_credits = current_user.get("diagnostic_credits", 0)
    loyalty_points = current_user.get("loyalty_points", 0)
    can_use_points = loyalty_points >= DIAGNOSTIC_PRICING["points_cost"]
    
    return {
        "has_free_access": has_free_access,
        "active_listings_count": active_listings_count,
        "diagnostic_credits": diagnostic_credits,
        "loyalty_points": loyalty_points,
        "can_use_points": can_use_points,
        "pricing": {
            "single": DIAGNOSTIC_PRICING["single_price"],
            "pack_5": DIAGNOSTIC_PRICING["pack_5_price"],
            "points_cost": DIAGNOSTIC_PRICING["points_cost"]
        }
    }

@api_router.post("/ai/diagnostic/purchase")
async def purchase_diagnostic_credits(
    pack: str = "single",
    current_user: dict = Depends(get_current_user)
):
    """Acheter des crédits de diagnostic via Stripe"""
    import stripe
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
    
    if pack == "single":
        amount = int(DIAGNOSTIC_PRICING["single_price"] * 100)  # en centimes
        credits = 1
        description = "1 Diagnostic IA"
    elif pack == "pack_5":
        amount = int(DIAGNOSTIC_PRICING["pack_5_price"] * 100)
        credits = 5
        description = "Pack 5 Diagnostics IA"
    else:
        raise HTTPException(status_code=400, detail="Pack invalide")
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': description,
                        'description': f"Diagnostic automobile par Tobi IA - World Auto France",
                    },
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{SITE_URL}/diagnostic?success=true&credits={credits}",
            cancel_url=f"{SITE_URL}/diagnostic?canceled=true",
            metadata={
                'user_id': current_user["id"],
                'type': 'diagnostic_credits',
                'credits': str(credits)
            }
        )
        
        return {"checkout_url": checkout_session.url, "session_id": checkout_session.id}
        
    except Exception as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur de paiement")

@api_router.post("/ai/diagnostic/use-points")
async def use_points_for_diagnostic(current_user: dict = Depends(get_current_user)):
    """Échanger des points fidélité contre un crédit de diagnostic"""
    points_cost = DIAGNOSTIC_PRICING["points_cost"]
    current_points = current_user.get("loyalty_points", 0)
    
    if current_points < points_cost:
        raise HTTPException(
            status_code=400, 
            detail=f"Points insuffisants. Vous avez {current_points} points, il en faut {points_cost}."
        )
    
    # Déduire les points et ajouter un crédit
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$inc": {
                "loyalty_points": -points_cost,
                "diagnostic_credits": 1
            }
        }
    )
    
    # Ajouter à l'historique fidélité
    await db.loyalty_history.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "points": -points_cost,
        "description": "Échange contre 1 Diagnostic IA",
        "type": "diagnostic_exchange",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": "Crédit de diagnostic ajouté !",
        "diagnostic_credits": current_user.get("diagnostic_credits", 0) + 1,
        "remaining_points": current_points - points_cost
    }

@api_router.post("/ai/diagnostic")
async def ai_diagnostic(request: DiagnosticRequest, current_user: dict = Depends(get_current_user)):
    """Diagnostic IA d'un problème automobile - Payant sauf si annonce active"""
    
    # Vérifier l'accès gratuit (a au moins une annonce active)
    active_listings_count = await db.listings.count_documents({
        "seller_id": current_user["id"],
        "status": "active"
    })
    has_free_access = active_listings_count > 0
    
    # Si pas d'accès gratuit, vérifier les crédits ou points
    if not has_free_access:
        diagnostic_credits = current_user.get("diagnostic_credits", 0)
        
        if request.use_credits and diagnostic_credits > 0:
            # Utiliser un crédit
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$inc": {"diagnostic_credits": -1}}
            )
        elif request.use_points:
            # Vérifier et utiliser les points
            points_cost = DIAGNOSTIC_PRICING["points_cost"]
            current_points = current_user.get("loyalty_points", 0)
            
            if current_points < points_cost:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "insufficient_points",
                        "message": f"Points insuffisants ({current_points}/{points_cost})",
                        "required_points": points_cost,
                        "current_points": current_points
                    }
                )
            
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$inc": {"loyalty_points": -points_cost}}
            )
            
            await db.loyalty_history.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "points": -points_cost,
                "description": "Diagnostic IA utilisé",
                "type": "diagnostic_used",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        else:
            # Pas d'accès, pas de crédits, pas de points utilisés
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "payment_required",
                    "message": "Diagnostic payant - Achetez des crédits ou utilisez vos points fidélité",
                    "pricing": DIAGNOSTIC_PRICING,
                    "diagnostic_credits": diagnostic_credits,
                    "loyalty_points": current_user.get("loyalty_points", 0)
                }
            )
    
    # Exécuter le diagnostic
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Clé API non configurée")
        
        vehicle_info = request.vehicle or "Non spécifié"
        prompt = DIAGNOSTIC_PROMPT.format(vehicle=vehicle_info, problem=request.problem)
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"diagnostic_{uuid.uuid4()}",
            system_message="Tu es un expert mécanicien automobile."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Enregistrer l'utilisation
        await db.diagnostic_history.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "vehicle": vehicle_info,
            "problem": request.problem,
            "diagnostic": response,
            "free_access": has_free_access,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "diagnostic": response,
            "vehicle": vehicle_info,
            "problem": request.problem,
            "free_access": has_free_access
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Diagnostic error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de diagnostic: {str(e)}")

# ================== AUCTIONS (ENCHÈRES) ==================

class AuctionCreate(BaseModel):
    listing_id: str
    starting_price: float = Field(..., ge=1)
    duration: str = Field(..., pattern="^(24h|48h|7d)$")

class BidCreate(BaseModel):
    amount: float = Field(..., ge=1)

# Utilise la même fonction calculate_platform_fee définie plus haut

@api_router.post("/auctions")
async def create_auction(auction: AuctionCreate, current_user: dict = Depends(get_current_user)):
    """Créer une nouvelle enchère"""
    # Verify listing exists and belongs to user
    listing = await db.listings.find_one({
        "id": auction.listing_id,
        "seller_id": current_user["id"]
    }, {"_id": 0})
    
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Check no active auction for this listing
    existing = await db.auctions.find_one({
        "listing_id": auction.listing_id,
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Une enchère est déjà active pour cette annonce")
    
    # Calculate end time
    duration_hours = {"24h": 24, "48h": 48, "7d": 168}
    end_time = datetime.now(timezone.utc) + timedelta(hours=duration_hours[auction.duration])
    
    auction_doc = {
        "id": str(uuid.uuid4()),
        "listing_id": auction.listing_id,
        "title": listing["title"],
        "description": listing.get("description", ""),
        "image": listing.get("images", [None])[0],
        "vehicle_info": f"{listing.get('vehicle_brand', '')} {listing.get('vehicle_model', '')} {listing.get('vehicle_year', '')}".strip(),
        "seller_id": current_user["id"],
        "seller_name": current_user["name"],
        "starting_price": auction.starting_price,
        "current_price": auction.starting_price,
        "bid_count": 0,
        "bids": [],
        "highest_bidder_id": None,
        "highest_bidder_name": None,
        "status": "active",  # active, ended, cancelled
        "winner_id": None,
        "final_price": None,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": end_time.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.auctions.insert_one(auction_doc)
    
    # Mark listing as auction
    await db.listings.update_one(
        {"id": auction.listing_id},
        {"$set": {"is_auction": True, "auction_id": auction_doc["id"]}}
    )
    
    return {k: v for k, v in auction_doc.items() if k != "_id"}

@api_router.get("/auctions")
async def get_auctions(status: Optional[str] = None):
    """Récupérer les enchères"""
    query = {}
    if status:
        query["status"] = status
    
    auctions = await db.auctions.find(query, {"_id": 0}).sort("end_time", 1).to_list(100)
    
    # Update expired auctions
    now = datetime.now(timezone.utc)
    for auction in auctions:
        if auction["status"] == "active" and datetime.fromisoformat(auction["end_time"].replace('Z', '+00:00')) < now:
            await end_auction(auction["id"])
            auction["status"] = "ended"
    
    return auctions

@api_router.get("/auctions/my")
async def get_my_auctions(current_user: dict = Depends(get_current_user)):
    """Récupérer mes enchères (en tant que vendeur)"""
    auctions = await db.auctions.find(
        {"seller_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return auctions

@api_router.get("/auctions/my-bids")
async def get_my_bids(current_user: dict = Depends(get_current_user)):
    """Récupérer les enchères où j'ai misé"""
    auctions = await db.auctions.find(
        {"bids.bidder_id": current_user["id"]},
        {"_id": 0}
    ).sort("end_time", 1).to_list(50)
    return auctions

@api_router.get("/auctions/{auction_id}")
async def get_auction(auction_id: str):
    """Récupérer une enchère par ID"""
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Enchère non trouvée")
    return auction

@api_router.post("/auctions/{auction_id}/bid")
async def place_bid(auction_id: str, bid: BidCreate, current_user: dict = Depends(get_current_user)):
    """Placer une enchère"""
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Enchère non trouvée")
    
    if auction["status"] != "active":
        raise HTTPException(status_code=400, detail="Cette enchère est terminée")
    
    if auction["seller_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas enchérir sur votre propre annonce")
    
    if bid.amount <= auction["current_price"]:
        raise HTTPException(status_code=400, detail=f"L'enchère doit être supérieure à {auction['current_price']}€")
    
    # Check auction not expired
    end_time = datetime.fromisoformat(auction["end_time"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) >= end_time:
        await end_auction(auction_id)
        raise HTTPException(status_code=400, detail="Cette enchère est terminée")
    
    bid_doc = {
        "id": str(uuid.uuid4()),
        "bidder_id": current_user["id"],
        "bidder_name": current_user["name"],
        "amount": bid.amount,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.auctions.update_one(
        {"id": auction_id},
        {
            "$set": {
                "current_price": bid.amount,
                "highest_bidder_id": current_user["id"],
                "highest_bidder_name": current_user["name"],
            },
            "$inc": {"bid_count": 1},
            "$push": {"bids": bid_doc}
        }
    )
    
    # Notify previous highest bidder
    if auction["highest_bidder_id"] and auction["highest_bidder_id"] != current_user["id"]:
        # Send notification via WebSocket or email
        pass
    
    return {"message": "Enchère placée avec succès", "bid": bid_doc}

async def end_auction(auction_id: str):
    """Terminer une enchère"""
    auction = await db.auctions.find_one({"id": auction_id})
    if not auction or auction["status"] != "active":
        return
    
    update_data = {
        "status": "ended",
        "ended_at": datetime.now(timezone.utc).isoformat()
    }
    
    if auction["highest_bidder_id"]:
        update_data["winner_id"] = auction["highest_bidder_id"]
        update_data["final_price"] = auction["current_price"]
        
        # Create order for winner with hybrid commission
        commission = calculate_platform_fee(auction["current_price"])
        
        # TODO: Create order and handle payment
    
    await db.auctions.update_one(
        {"id": auction_id},
        {"$set": update_data}
    )
    
    # Update listing
    await db.listings.update_one(
        {"id": auction["listing_id"]},
        {"$set": {"is_auction": False, "auction_ended": True}}
    )

# ================== VIDEO CALL (WhatsApp Link) ==================

@api_router.post("/video-call/request")
async def request_video_call(
    listing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Demander un appel vidéo pour une annonce"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")
    
    seller_phone = seller.get("phone", "").replace(" ", "").replace(".", "")
    if seller_phone.startswith("0"):
        seller_phone = "33" + seller_phone[1:]
    
    if not seller_phone:
        raise HTTPException(status_code=400, detail="Le vendeur n'a pas de numéro de téléphone")
    
    # Generate WhatsApp link
    message = f"Bonjour ! Je suis intéressé par votre annonce '{listing['title']}' sur World Auto France. Seriez-vous disponible pour un appel vidéo ?"
    whatsapp_link = f"https://wa.me/{seller_phone}?text={message.replace(' ', '%20')}"
    
    return {
        "whatsapp_link": whatsapp_link,
        "seller_name": seller.get("name"),
        "listing_title": listing["title"]
    }

# ================== LOYALTY PROGRAM (FIDÉLITÉ) ==================

LOYALTY_TIERS = [
    {"id": "bronze", "name": "Bronze", "min_points": 0, "multiplier": 1},
    {"id": "silver", "name": "Argent", "min_points": 500, "multiplier": 1.5},
    {"id": "gold", "name": "Or", "min_points": 2000, "multiplier": 2},
    {"id": "platinum", "name": "Platine", "min_points": 5000, "multiplier": 3},
]

LOYALTY_REWARDS = [
    {"id": "discount_5", "name": "5€ de réduction", "points": 100, "type": "discount", "value": 5},
    {"id": "discount_10", "name": "10€ de réduction", "points": 180, "type": "discount", "value": 10},
    {"id": "discount_25", "name": "25€ de réduction", "points": 400, "type": "discount", "value": 25},
    {"id": "discount_50", "name": "50€ de réduction", "points": 750, "type": "discount", "value": 50},
    {"id": "free_shipping", "name": "Livraison gratuite", "points": 150, "type": "shipping", "value": 0},
    {"id": "boost_listing", "name": "Boost annonce 7 jours", "points": 200, "type": "boost", "value": 7},
]

def get_user_tier(lifetime_points: int):
    """Get user's loyalty tier based on lifetime points"""
    tier = LOYALTY_TIERS[0]
    for t in LOYALTY_TIERS:
        if lifetime_points >= t["min_points"]:
            tier = t
    return tier

def generate_reward_code():
    """Generate a unique reward code"""
    import random
    import string
    return 'WAF-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def generate_referral_code(name: str):
    """Generate a unique referral code based on user name"""
    import random
    import string
    # Take first 3 letters of name (uppercase) + 5 random chars
    prefix = ''.join(c for c in name.upper()[:3] if c.isalpha())
    if len(prefix) < 3:
        prefix = prefix + 'X' * (3 - len(prefix))
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"{prefix}{suffix}"

# Referral rewards config
REFERRAL_REWARDS = {
    "referrer_points": 100,  # Points donnés au parrain
    "referee_points": 50,    # Points donnés au filleul
    "referrer_bonus_per_purchase": 10,  # Points bonus quand le filleul fait un achat
}

# Bonus inscription pour tous les nouveaux utilisateurs
SIGNUP_BONUS_POINTS = 50

async def add_loyalty_points(user_id: str, points: int, description: str, order_id: str = None):
    """Add loyalty points to a user"""
    # Get user
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return
    
    # Get current tier multiplier
    lifetime_points = user.get("loyalty_lifetime_points", 0)
    tier = get_user_tier(lifetime_points)
    
    # Apply multiplier
    actual_points = int(points * tier["multiplier"])
    
    # Update user points
    await db.users.update_one(
        {"id": user_id},
        {
            "$inc": {
                "loyalty_points": actual_points,
                "loyalty_lifetime_points": actual_points
            },
            "$set": {
                "loyalty_tier": tier["id"]
            }
        }
    )
    
    # Add to history
    history_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "points": actual_points,
        "description": description,
        "order_id": order_id,
        "tier_multiplier": tier["multiplier"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.loyalty_history.insert_one(history_doc)
    
    return actual_points

@api_router.get("/loyalty/me")
async def get_loyalty_status(current_user: dict = Depends(get_current_user)):
    """Get current user's loyalty status"""
    points = current_user.get("loyalty_points", 0)
    lifetime_points = current_user.get("loyalty_lifetime_points", 0)
    tier = get_user_tier(lifetime_points)
    
    return {
        "points": points,
        "lifetime_points": lifetime_points,
        "tier": tier,
        "next_tier": next((t for t in LOYALTY_TIERS if t["min_points"] > lifetime_points), None)
    }

@api_router.get("/loyalty/history")
async def get_loyalty_history(current_user: dict = Depends(get_current_user), limit: int = 50):
    """Get user's loyalty points history"""
    history = await db.loyalty_history.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return history

@api_router.get("/loyalty/rewards")
async def get_user_rewards(current_user: dict = Depends(get_current_user)):
    """Get user's redeemed rewards"""
    rewards = await db.loyalty_rewards.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return rewards

class RedeemRequest(BaseModel):
    reward_id: str

@api_router.post("/loyalty/redeem")
async def redeem_reward(request: RedeemRequest, current_user: dict = Depends(get_current_user)):
    """Redeem points for a reward"""
    # Find reward
    reward_template = next((r for r in LOYALTY_REWARDS if r["id"] == request.reward_id), None)
    if not reward_template:
        raise HTTPException(status_code=404, detail="Récompense non trouvée")
    
    # Check points
    user_points = current_user.get("loyalty_points", 0)
    if user_points < reward_template["points"]:
        raise HTTPException(status_code=400, detail="Points insuffisants")
    
    # Create reward
    code = generate_reward_code()
    reward_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "reward_id": reward_template["id"],
        "name": reward_template["name"],
        "type": reward_template["type"],
        "value": reward_template["value"],
        "code": code,
        "used": False,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.loyalty_rewards.insert_one(reward_doc)
    
    # Deduct points
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"loyalty_points": -reward_template["points"]}}
    )
    
    # Add to history
    history_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "points": -reward_template["points"],
        "description": f"Échange: {reward_template['name']}",
        "reward_id": reward_doc["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.loyalty_history.insert_one(history_doc)
    
    return {
        "message": "Récompense obtenue !",
        "reward": {k: v for k, v in reward_doc.items() if k != "_id"}
    }

@api_router.post("/loyalty/apply-code")
async def apply_loyalty_code(code: str, current_user: dict = Depends(get_current_user)):
    """Apply a loyalty reward code to check validity"""
    reward = await db.loyalty_rewards.find_one({
        "code": code,
        "user_id": current_user["id"],
        "used": False
    }, {"_id": 0})
    
    if not reward:
        raise HTTPException(status_code=404, detail="Code invalide ou déjà utilisé")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reward["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Ce code a expiré")
    
    return reward

@api_router.post("/loyalty/use-code")
async def use_loyalty_code(code: str, order_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a loyalty code as used"""
    result = await db.loyalty_rewards.update_one(
        {
            "code": code,
            "user_id": current_user["id"],
            "used": False
        },
        {
            "$set": {
                "used": True,
                "used_at": datetime.now(timezone.utc).isoformat(),
                "used_order_id": order_id
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Code invalide ou déjà utilisé")
    
    return {"message": "Code appliqué avec succès"}

# ================== REFERRAL SYSTEM (PARRAINAGE) ==================

@api_router.get("/referral/me")
async def get_referral_info(current_user: dict = Depends(get_current_user)):
    """Get current user's referral information"""
    referral_code = current_user.get("referral_code")
    
    # Generate code if user doesn't have one (for existing users)
    if not referral_code:
        referral_code = generate_referral_code(current_user["name"])
        while await db.users.find_one({"referral_code": referral_code}):
            referral_code = generate_referral_code(current_user["name"])
        
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"referral_code": referral_code, "referral_count": 0}}
        )
    
    # Get referral stats
    referrals = await db.referrals.find(
        {"referrer_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    total_points_earned = sum(r.get("points_awarded", 0) for r in referrals)
    
    # Get referred by info
    referred_by_name = None
    if current_user.get("referred_by"):
        referrer = await db.users.find_one(
            {"id": current_user["referred_by"]},
            {"_id": 0, "name": 1}
        )
        if referrer:
            referred_by_name = referrer["name"]
    
    return {
        "referral_code": referral_code,
        "referral_link": f"{SITE_URL}/auth?ref={referral_code}",
        "referral_count": current_user.get("referral_count", 0),
        "total_points_earned": total_points_earned,
        "referred_by": referred_by_name,
        "rewards_config": {
            "referrer_points": REFERRAL_REWARDS["referrer_points"],
            "referee_points": REFERRAL_REWARDS["referee_points"],
            "bonus_per_purchase": REFERRAL_REWARDS["referrer_bonus_per_purchase"]
        }
    }

@api_router.get("/referral/my-referrals")
async def get_my_referrals(current_user: dict = Depends(get_current_user), limit: int = 50):
    """Get list of users referred by current user"""
    referrals = await db.referrals.find(
        {"referrer_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    # Get stats for each referral
    enriched_referrals = []
    for ref in referrals:
        # Get referee's order count
        orders_count = await db.orders.count_documents({
            "buyer_id": ref["referee_id"],
            "payment_status": "completed"
        })
        
        enriched_referrals.append({
            "id": ref["id"],
            "referee_name": ref.get("referee_name", "Utilisateur"),
            "points_awarded": ref.get("points_awarded", 0),
            "bonus_points": ref.get("bonus_points", 0),
            "orders_count": orders_count,
            "status": ref.get("status", "active"),
            "created_at": ref["created_at"]
        })
    
    return {
        "referrals": enriched_referrals,
        "total": len(enriched_referrals)
    }

@api_router.get("/referral/validate/{code}")
async def validate_referral_code(code: str):
    """Validate a referral code (public endpoint)"""
    user = await db.users.find_one(
        {"referral_code": code.upper()},
        {"_id": 0, "name": 1, "referral_code": 1}
    )
    
    if not user:
        return {"valid": False, "message": "Code de parrainage invalide"}
    
    return {
        "valid": True,
        "referrer_name": user["name"],
        "bonus_points": REFERRAL_REWARDS["referee_points"],
        "message": f"Code valide ! Vous recevrez {REFERRAL_REWARDS['referee_points']} points de bienvenue"
    }

@api_router.get("/referral/leaderboard")
async def get_referral_leaderboard(limit: int = 10):
    """Get top referrers leaderboard"""
    # Get users with most referrals
    top_referrers = await db.users.find(
        {"referral_count": {"$gt": 0}},
        {"_id": 0, "name": 1, "referral_count": 1}
    ).sort("referral_count", -1).to_list(limit)
    
    leaderboard = []
    for i, user in enumerate(top_referrers, 1):
        leaderboard.append({
            "rank": i,
            "name": user["name"][:2] + "***" + user["name"][-1:] if len(user["name"]) > 3 else user["name"][:1] + "***",
            "referral_count": user["referral_count"]
        })
    
    return {"leaderboard": leaderboard}


# ================== PRO TRIAL SYSTEM (ESSAI GRATUIT) ==================

@api_router.get("/pro/trial/status")
async def get_pro_trial_status(current_user: dict = Depends(get_current_user)):
    """Vérifie le statut de l'essai PRO de l'utilisateur"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    trial_used = user.get("pro_trial_used", False)
    trial_active = False
    trial_days_left = 0
    trial_end_date = None
    
    if user.get("pro_trial_end"):
        trial_end = datetime.fromisoformat(user["pro_trial_end"].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) < trial_end:
            trial_active = True
            trial_days_left = (trial_end - datetime.now(timezone.utc)).days + 1
            trial_end_date = user["pro_trial_end"]
    
    has_pro_subscription = user.get("has_pro_subscription", False)
    is_professional = user.get("is_professional", False)
    
    return {
        "trial_available": not trial_used and not has_pro_subscription,
        "trial_used": trial_used,
        "trial_active": trial_active,
        "trial_days_left": trial_days_left,
        "trial_end_date": trial_end_date,
        "is_pro": has_pro_subscription or is_professional or trial_active,
        "has_pro_subscription": has_pro_subscription
    }

@api_router.post("/pro/trial/activate")
async def activate_pro_trial(current_user: dict = Depends(get_current_user)):
    """Active l'essai gratuit PRO de 14 jours"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    # Vérifier si l'essai a déjà été utilisé
    if user.get("pro_trial_used"):
        raise HTTPException(status_code=400, detail="Vous avez déjà utilisé votre essai gratuit PRO")
    
    # Vérifier si l'utilisateur a déjà un abonnement PRO
    if user.get("has_pro_subscription"):
        raise HTTPException(status_code=400, detail="Vous avez déjà un abonnement PRO actif")
    
    # Calculer la date de fin de l'essai (14 jours)
    trial_end = datetime.now(timezone.utc) + timedelta(days=14)
    
    # Activer l'essai
    trial_pack = PRICING_PACKAGES["pro_trial"]
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "pro_trial_used": True,
                "pro_trial_start": datetime.now(timezone.utc).isoformat(),
                "pro_trial_end": trial_end.isoformat(),
                "has_pro_subscription": True,
                "max_photos_per_listing": trial_pack["max_photos"]
            },
            "$inc": {
                "credits": trial_pack["credits"]
            }
        }
    )
    
    # Enregistrer dans l'historique
    await db.subscriptions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "pro_trial",
        "name": trial_pack["name"],
        "credits": trial_pack["credits"],
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": trial_end.isoformat(),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Envoyer un email de bienvenue PRO
    try:
        send_email(
            to_email=current_user["email"],
            subject="🎉 Bienvenue dans World Auto PRO !",
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1E3A5F, #F97316); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">👑 Bienvenue dans World Auto PRO !</h1>
                </div>
                <div style="background: #fff; padding: 30px; border: 1px solid #eee;">
                    <p>Bonjour <strong>{current_user.get('name', 'cher vendeur')}</strong>,</p>
                    <p>Votre essai gratuit PRO de <strong>14 jours</strong> est maintenant actif !</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1E3A5F;">✨ Vos avantages PRO :</h3>
                        <ul style="color: #666;">
                            <li>📸 Jusqu'à <strong>50 photos</strong> par annonce</li>
                            <li>🎁 <strong>50 crédits</strong> offerts</li>
                            <li>🚀 Visibilité <strong>prioritaire</strong></li>
                            <li>📊 Tableau de bord <strong>PRO</strong></li>
                            <li>💰 <strong>-10%</strong> sur tous les frais</li>
                        </ul>
                    </div>
                    
                    <p style="color: #F97316;"><strong>⏰ Votre essai se termine le {trial_end.strftime('%d/%m/%Y')}</strong></p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{SITE_URL}/deposer" style="background: #F97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Déposer ma première annonce PRO
                        </a>
                    </div>
                    
                    <p>Des questions ? Notre équipe est là pour vous aider !</p>
                </div>
                <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                    <p style="margin: 0;">© World Auto France - L'équipe PRO</p>
                </div>
            </div>
            """
        )
    except Exception as e:
        print(f"Error sending PRO welcome email: {e}")
    
    return {
        "message": "🎉 Essai PRO activé avec succès !",
        "trial_end_date": trial_end.isoformat(),
        "credits_added": trial_pack["credits"],
        "max_photos": trial_pack["max_photos"],
        "days": 14
    }

@api_router.get("/pro/benefits")
async def get_pro_benefits():
    """Retourne les avantages PRO pour affichage"""
    return {
        "benefits": [
            {"icon": "📸", "title": "50 photos par annonce", "description": "Au lieu de 6 en compte standard"},
            {"icon": "🚀", "title": "Visibilité prioritaire", "description": "Vos annonces apparaissent en premier"},
            {"icon": "💰", "title": "-10% sur les frais", "description": "Sur toutes les transactions"},
            {"icon": "📊", "title": "Statistiques avancées", "description": "Tableau de bord PRO complet"},
            {"icon": "🏷️", "title": "Badge PRO", "description": "Confiance et crédibilité accrues"},
            {"icon": "📞", "title": "Support prioritaire", "description": "Réponse sous 24h garantie"}
        ],
        "trial": {
            "duration_days": 14,
            "credits": 50,
            "price": 0
        },
        "plans": [
            {"id": "pro_monthly", "name": "Mensuel", "price": 49, "duration": "1 mois", "popular": False},
            {"id": "pro_3months", "name": "Trimestriel", "price": 99, "duration": "3 mois", "popular": True, "savings": "33%"},
            {"id": "pro_6months", "name": "Semestriel", "price": 179, "duration": "6 mois", "popular": False, "savings": "40%"}
        ]
    }


# ================== PROMOTE / BOOST SYSTEM ==================

BOOST_OPTIONS = {
    "boost_24h": {"name": "Boost 24h", "duration_days": 1, "price": 299, "type": "boost"},
    "boost_7d": {"name": "Boost 7 jours", "duration_days": 7, "price": 699, "type": "boost"},
    "boost_30d": {"name": "Boost 30 jours", "duration_days": 30, "price": 1499, "type": "boost"},
    "featured_24h": {"name": "À la Une 24h", "duration_days": 1, "price": 499, "type": "featured"},
    "featured_7d": {"name": "À la Une 7 jours", "duration_days": 7, "price": 1499, "type": "featured"},
    "featured_30d": {"name": "À la Une 30 jours", "duration_days": 30, "price": 3999, "type": "featured"},
}

PRO_SUBSCRIPTIONS = {
    "pro_starter": {"name": "Starter", "price": 999, "boosts_per_month": 3, "featured_per_month": 0},
    "pro_business": {"name": "Business", "price": 2499, "boosts_per_month": 10, "featured_per_month": 1},
    "pro_premium": {"name": "Premium", "price": 4999, "boosts_per_month": -1, "featured_per_month": 8},  # -1 = unlimited
}

class PromoteCheckoutRequest(BaseModel):
    type: str  # 'boost', 'featured', 'subscription'
    option_id: str
    listing_id: Optional[str] = None

@api_router.post("/promote/checkout")
async def create_promote_checkout(request: PromoteCheckoutRequest, current_user: dict = Depends(get_current_user)):
    """Create Stripe checkout for boost/featured/subscription"""
    import stripe
    stripe.api_key = os.environ.get('STRIPE_API_KEY')
    
    site_url = os.environ.get('SITE_URL', 'https://worldautofrance.com')
    
    if request.type in ['boost', 'featured']:
        option = BOOST_OPTIONS.get(request.option_id)
        if not option:
            raise HTTPException(status_code=400, detail="Option invalide")
        
        if not request.listing_id:
            raise HTTPException(status_code=400, detail="ID d'annonce requis")
        
        # Verify listing belongs to user
        listing = await db.listings.find_one({
            "id": request.listing_id,
            "seller_id": current_user["id"]
        })
        if not listing:
            raise HTTPException(status_code=404, detail="Annonce non trouvée")
        
        # Create Stripe checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'unit_amount': option["price"],
                    'product_data': {
                        'name': option["name"],
                        'description': f'Promotion pour: {listing["title"]}'
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{site_url}/promote/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{site_url}/promouvoir?listing={request.listing_id}',
            metadata={
                'type': request.type,
                'option_id': request.option_id,
                'listing_id': request.listing_id,
                'user_id': current_user["id"],
                'duration_days': option["duration_days"]
            }
        )
        
        return {"checkout_url": checkout_session.url}
    
    elif request.type == 'subscription':
        plan = PRO_SUBSCRIPTIONS.get(request.option_id)
        if not plan:
            raise HTTPException(status_code=400, detail="Plan invalide")
        
        # Create Stripe subscription checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'unit_amount': plan["price"],
                    'product_data': {
                        'name': f'Abonnement {plan["name"]}',
                        'description': 'Abonnement mensuel World Auto France Pro'
                    },
                    'recurring': {'interval': 'month'}
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{site_url}/promote/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{site_url}/promouvoir',
            metadata={
                'type': 'subscription',
                'plan_id': request.option_id,
                'user_id': current_user["id"]
            }
        )
        
        return {"checkout_url": checkout_session.url}
    
    raise HTTPException(status_code=400, detail="Type de promotion invalide")

@api_router.get("/promote/success")
async def promote_success(session_id: str, current_user: dict = Depends(get_current_user)):
    """Handle successful promotion payment"""
    import stripe
    stripe.api_key = os.environ.get('STRIPE_API_KEY')
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        metadata = session.metadata
        
        if session.payment_status != 'paid' and session.status != 'complete':
            raise HTTPException(status_code=400, detail="Paiement non complété")
        
        promo_type = metadata.get('type')
        
        if promo_type in ['boost', 'featured']:
            listing_id = metadata.get('listing_id')
            duration_days = int(metadata.get('duration_days', 7))
            option_id = metadata.get('option_id')
            
            end_time = datetime.now(timezone.utc) + timedelta(days=duration_days)
            
            update_data = {}
            if promo_type == 'boost':
                update_data = {
                    "is_boosted": True,
                    "boost_end": end_time.isoformat(),
                    "boost_option": option_id
                }
            else:
                update_data = {
                    "is_featured": True,
                    "featured_end": end_time.isoformat(),
                    "featured_option": option_id
                }
            
            await db.listings.update_one(
                {"id": listing_id},
                {"$set": update_data}
            )
            
            # Log promotion
            promo_doc = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "listing_id": listing_id,
                "type": promo_type,
                "option_id": option_id,
                "stripe_session_id": session_id,
                "amount": session.amount_total,
                "start_time": datetime.now(timezone.utc).isoformat(),
                "end_time": end_time.isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.promotions.insert_one(promo_doc)
            
            return {"message": "Promotion activée", "end_time": end_time.isoformat()}
        
        elif promo_type == 'subscription':
            plan_id = metadata.get('plan_id')
            plan = PRO_SUBSCRIPTIONS.get(plan_id)
            
            # Create/update subscription
            sub_doc = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "plan_id": plan_id,
                "plan_name": plan["name"],
                "stripe_session_id": session_id,
                "stripe_subscription_id": session.subscription,
                "boosts_per_month": plan["boosts_per_month"],
                "boosts_remaining": plan["boosts_per_month"],
                "featured_per_month": plan["featured_per_month"],
                "featured_remaining": plan["featured_per_month"],
                "status": "active",
                "current_period_start": datetime.now(timezone.utc).isoformat(),
                "current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Upsert subscription
            await db.subscriptions.update_one(
                {"user_id": current_user["id"]},
                {"$set": sub_doc},
                upsert=True
            )
            
            # Update user as pro
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"is_pro": True, "pro_plan": plan_id}}
            )
            
            return {"message": "Abonnement activé", "plan": plan["name"]}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/subscription/me")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription"""
    sub = await db.subscriptions.find_one(
        {"user_id": current_user["id"], "status": "active"},
        {"_id": 0}
    )
    return sub

@api_router.post("/promote/use-free")
async def use_free_boost(type: str, listing_id: str, current_user: dict = Depends(get_current_user)):
    """Use a free boost from subscription"""
    sub = await db.subscriptions.find_one({
        "user_id": current_user["id"],
        "status": "active"
    })
    
    if not sub:
        raise HTTPException(status_code=400, detail="Aucun abonnement actif")
    
    # Verify listing
    listing = await db.listings.find_one({"id": listing_id, "seller_id": current_user["id"]})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    if type == 'boost':
        if sub.get("boosts_remaining", 0) == 0 and sub.get("boosts_per_month") != -1:
            raise HTTPException(status_code=400, detail="Plus de boosts disponibles ce mois")
        
        end_time = datetime.now(timezone.utc) + timedelta(days=7)
        await db.listings.update_one(
            {"id": listing_id},
            {"$set": {"is_boosted": True, "boost_end": end_time.isoformat()}}
        )
        
        if sub.get("boosts_per_month") != -1:
            await db.subscriptions.update_one(
                {"user_id": current_user["id"]},
                {"$inc": {"boosts_remaining": -1}}
            )
    
    elif type == 'featured':
        if sub.get("featured_remaining", 0) == 0:
            raise HTTPException(status_code=400, detail="Plus de mises en avant disponibles ce mois")
        
        end_time = datetime.now(timezone.utc) + timedelta(days=7)
        await db.listings.update_one(
            {"id": listing_id},
            {"$set": {"is_featured": True, "featured_end": end_time.isoformat()}}
        )
        
        await db.subscriptions.update_one(
            {"user_id": current_user["id"]},
            {"$inc": {"featured_remaining": -1}}
        )
    
    return {"message": "Promotion appliquée", "type": type}

@api_router.post("/promote/use-loyalty")
async def use_loyalty_boost(listing_id: str, current_user: dict = Depends(get_current_user)):
    """Use loyalty points for a 7-day boost (200 points)"""
    LOYALTY_BOOST_COST = 200
    
    user_points = current_user.get("loyalty_points", 0)
    if user_points < LOYALTY_BOOST_COST:
        raise HTTPException(status_code=400, detail=f"Vous avez besoin de {LOYALTY_BOOST_COST} points")
    
    # Verify listing
    listing = await db.listings.find_one({"id": listing_id, "seller_id": current_user["id"]})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Apply boost
    end_time = datetime.now(timezone.utc) + timedelta(days=7)
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"is_boosted": True, "boost_end": end_time.isoformat(), "boost_source": "loyalty"}}
    )
    
    # Deduct points
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"loyalty_points": -LOYALTY_BOOST_COST}}
    )
    
    # Add to loyalty history
    history_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "points": -LOYALTY_BOOST_COST,
        "description": f"Boost 7 jours: {listing.get('title', 'Annonce')}",
        "listing_id": listing_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.loyalty_history.insert_one(history_doc)
    
    return {"message": "Boost fidélité appliqué (7 jours)", "end_time": end_time.isoformat()}

# ================== FAIRE UNE OFFRE ==================

class OfferCreate(BaseModel):
    listing_id: str
    amount: float
    message: Optional[str] = None

class OfferResponse(BaseModel):
    accept: bool
    counter_amount: Optional[float] = None

@api_router.post("/offers")
async def create_offer(offer: OfferCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Faire une offre sur une annonce"""
    listing = await db.listings.find_one({"id": offer.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    if listing["seller_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas faire une offre sur votre propre annonce")
    
    if listing.get("status") != "active":
        raise HTTPException(status_code=400, detail="Cette annonce n'est plus disponible")
    
    # Vérifier que l'offre est raisonnable (min 50% du prix)
    if offer.amount < listing["price"] * 0.5:
        raise HTTPException(status_code=400, detail="L'offre doit être d'au moins 50% du prix demandé")
    
    offer_doc = {
        "id": str(uuid.uuid4()),
        "listing_id": offer.listing_id,
        "buyer_id": current_user["id"],
        "buyer_name": current_user.get("name", "Acheteur"),
        "seller_id": listing["seller_id"],
        "original_price": listing["price"],
        "offered_amount": offer.amount,
        "message": offer.message,
        "status": "pending",  # pending, accepted, rejected, countered, expired
        "counter_amount": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    }
    
    await db.offers.insert_one(offer_doc)
    
    # Notifier le vendeur par email
    seller = await db.users.find_one({"id": listing["seller_id"]})
    if seller and seller.get("email"):
        discount_percent = round((1 - offer.amount / listing["price"]) * 100)
        background_tasks.add_task(
            send_email,
            seller["email"],
            f"💰 Nouvelle offre sur votre annonce - {listing['title'][:30]}",
            f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f97316; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">World Auto</h1>
                </div>
                <div style="padding: 30px; background: #fff;">
                    <h2>Nouvelle offre reçue !</h2>
                    <p><strong>{current_user.get('name', 'Un acheteur')}</strong> vous fait une offre :</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; color: #666;">Prix demandé : <s>{listing['price']:.2f} €</s></p>
                        <p style="margin: 10px 0; font-size: 28px; color: #f97316; font-weight: bold;">{offer.amount:.2f} €</p>
                        <p style="margin: 0; color: #666;">(-{discount_percent}%)</p>
                    </div>
                    {f'<p><em>Message : "{offer.message}"</em></p>' if offer.message else ''}
                    <a href="{SITE_URL}/mes-offres" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir l'offre</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">Cette offre expire dans 48h.</p>
                </div>
            </div>
            """
        )
    
    return {"id": offer_doc["id"], "message": "Offre envoyée", "expires_at": offer_doc["expires_at"]}

@api_router.get("/offers/received")
async def get_received_offers(current_user: dict = Depends(get_current_user)):
    """Récupérer les offres reçues (vendeur)"""
    offers = await db.offers.find(
        {"seller_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrichir avec les infos des annonces
    for offer in offers:
        listing = await db.listings.find_one({"id": offer["listing_id"]}, {"_id": 0, "title": 1, "images": 1, "price": 1})
        offer["listing"] = listing
    
    return offers

@api_router.get("/offers/sent")
async def get_sent_offers(current_user: dict = Depends(get_current_user)):
    """Récupérer les offres envoyées (acheteur)"""
    offers = await db.offers.find(
        {"buyer_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrichir avec les infos des annonces
    for offer in offers:
        listing = await db.listings.find_one({"id": offer["listing_id"]}, {"_id": 0, "title": 1, "images": 1, "price": 1})
        offer["listing"] = listing
    
    return offers

@api_router.post("/offers/{offer_id}/respond")
async def respond_to_offer(offer_id: str, response: OfferResponse, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Répondre à une offre (accepter, refuser, contre-offre)"""
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    
    if offer["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas le vendeur")
    
    if offer["status"] != "pending":
        raise HTTPException(status_code=400, detail="Cette offre a déjà été traitée")
    
    buyer = await db.users.find_one({"id": offer["buyer_id"]})
    listing = await db.listings.find_one({"id": offer["listing_id"]})
    
    if response.accept:
        # Accepter l'offre
        await db.offers.update_one(
            {"id": offer_id},
            {"$set": {"status": "accepted", "responded_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Notifier l'acheteur
        if buyer and buyer.get("email"):
            background_tasks.add_task(
                send_email,
                buyer["email"],
                f"✅ Votre offre a été acceptée !",
                f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #22c55e; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Offre acceptée !</h1>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <p>Bonne nouvelle ! Votre offre de <strong>{offer['offered_amount']:.2f} €</strong> pour <strong>{listing['title']}</strong> a été acceptée.</p>
                        <a href="{SITE_URL}/annonce/{listing['id']}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Finaliser l'achat</a>
                    </div>
                </div>
                """
            )
        
        return {"message": "Offre acceptée", "status": "accepted"}
    
    elif response.counter_amount:
        # Contre-offre
        if response.counter_amount <= offer["offered_amount"]:
            raise HTTPException(status_code=400, detail="La contre-offre doit être supérieure à l'offre reçue")
        
        await db.offers.update_one(
            {"id": offer_id},
            {"$set": {
                "status": "countered",
                "counter_amount": response.counter_amount,
                "responded_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Notifier l'acheteur
        if buyer and buyer.get("email"):
            background_tasks.add_task(
                send_email,
                buyer["email"],
                f"↩️ Contre-offre reçue",
                f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #f97316; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Contre-offre</h1>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <p>Le vendeur a fait une contre-offre pour <strong>{listing['title']}</strong> :</p>
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #666;">Votre offre : <s>{offer['offered_amount']:.2f} €</s></p>
                            <p style="margin: 10px 0; font-size: 28px; color: #f97316; font-weight: bold;">{response.counter_amount:.2f} €</p>
                        </div>
                        <a href="{SITE_URL}/mes-offres" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir la contre-offre</a>
                    </div>
                </div>
                """
            )
        
        return {"message": "Contre-offre envoyée", "status": "countered", "counter_amount": response.counter_amount}
    
    else:
        # Refuser
        await db.offers.update_one(
            {"id": offer_id},
            {"$set": {"status": "rejected", "responded_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"message": "Offre refusée", "status": "rejected"}

@api_router.post("/offers/{offer_id}/accept-counter")
async def accept_counter_offer(offer_id: str, current_user: dict = Depends(get_current_user)):
    """Accepter une contre-offre (acheteur)"""
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    
    if offer["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas l'acheteur")
    
    if offer["status"] != "countered":
        raise HTTPException(status_code=400, detail="Pas de contre-offre en attente")
    
    await db.offers.update_one(
        {"id": offer_id},
        {"$set": {"status": "accepted", "final_amount": offer["counter_amount"]}}
    )
    
    return {"message": "Contre-offre acceptée", "final_amount": offer["counter_amount"]}

# ================== LOTS DE PIÈCES ==================

class BundleCreate(BaseModel):
    title: str
    description: str
    listing_ids: List[str]
    bundle_price: float  # Prix du lot (remise appliquée)

@api_router.post("/bundles")
async def create_bundle(bundle: BundleCreate, current_user: dict = Depends(get_current_user)):
    """Créer un lot de pièces"""
    if len(bundle.listing_ids) < 2:
        raise HTTPException(status_code=400, detail="Un lot doit contenir au moins 2 annonces")
    
    # Vérifier que toutes les annonces appartiennent au vendeur
    listings = []
    total_original_price = 0
    for lid in bundle.listing_ids:
        listing = await db.listings.find_one({"id": lid, "seller_id": current_user["id"]})
        if not listing:
            raise HTTPException(status_code=400, detail=f"Annonce {lid} non trouvée ou ne vous appartient pas")
        if listing.get("status") != "active":
            raise HTTPException(status_code=400, detail=f"L'annonce '{listing['title']}' n'est plus active")
        listings.append(listing)
        total_original_price += listing["price"]
    
    # Le prix du lot doit être inférieur au total
    if bundle.bundle_price >= total_original_price:
        raise HTTPException(status_code=400, detail="Le prix du lot doit être inférieur au total des pièces")
    
    discount_percent = round((1 - bundle.bundle_price / total_original_price) * 100)
    
    bundle_doc = {
        "id": str(uuid.uuid4()),
        "seller_id": current_user["id"],
        "seller_name": current_user.get("name", "Vendeur"),
        "title": bundle.title,
        "description": bundle.description,
        "listing_ids": bundle.listing_ids,
        "listings": [{"id": l["id"], "title": l["title"], "price": l["price"], "images": l.get("images", [])} for l in listings],
        "original_total": total_original_price,
        "bundle_price": bundle.bundle_price,
        "discount_percent": discount_percent,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bundles.insert_one(bundle_doc)
    
    return {"id": bundle_doc["id"], "message": "Lot créé", "discount_percent": discount_percent}

@api_router.get("/bundles")
async def get_bundles(seller_id: Optional[str] = None, limit: int = 20):
    """Récupérer les lots disponibles"""
    query = {"status": "active"}
    if seller_id:
        query["seller_id"] = seller_id
    
    bundles = await db.bundles.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return bundles

@api_router.get("/bundles/{bundle_id}")
async def get_bundle(bundle_id: str):
    """Récupérer un lot"""
    bundle = await db.bundles.find_one({"id": bundle_id}, {"_id": 0})
    if not bundle:
        raise HTTPException(status_code=404, detail="Lot non trouvé")
    return bundle

@api_router.delete("/bundles/{bundle_id}")
async def delete_bundle(bundle_id: str, current_user: dict = Depends(get_current_user)):
    """Supprimer un lot"""
    bundle = await db.bundles.find_one({"id": bundle_id})
    if not bundle:
        raise HTTPException(status_code=404, detail="Lot non trouvé")
    
    if bundle["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas supprimer ce lot")
    
    await db.bundles.delete_one({"id": bundle_id})
    return {"message": "Lot supprimé"}

# ================== COMPTEUR LIVE ==================

@api_router.get("/stats/live")
async def get_live_stats():
    """Récupérer les statistiques en temps réel pour le Hero"""
    # Compter les annonces actives
    listings_count = await db.listings.count_documents({"status": "active"})
    
    # Compter les utilisateurs
    users_count = await db.users.count_documents({})
    
    # Compter les ventes réalisées
    sales_count = await db.orders.count_documents({"status": {"$in": ["paid", "shipped", "delivered"]}})
    
    # Vendeurs actifs (qui ont au moins une annonce)
    sellers_count = len(await db.listings.distinct("seller_id", {"status": "active"}))
    
    return {
        "listings_count": listings_count,
        "users_count": users_count,
        "sales_count": sales_count,
        "sellers_count": sellers_count
    }

# ================== RELANCE PANIER ABANDONNÉ ==================

class AbandonedCartItem(BaseModel):
    listing_id: str
    title: str
    price: float
    image: Optional[str] = None

class AbandonedCartCreate(BaseModel):
    items: List[AbandonedCartItem]
    email: Optional[str] = None

@api_router.post("/cart/track")
async def track_cart(cart: AbandonedCartCreate, request: Request, current_user: dict = Depends(get_current_user_optional)):
    """Tracker un panier pour relance"""
    if not cart.items:
        return {"message": "Panier vide"}
    
    user_id = current_user["id"] if current_user else None
    email = current_user.get("email") if current_user else cart.email
    
    if not email:
        return {"message": "Email requis pour la relance"}
    
    cart_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "email": email,
        "items": [item.model_dump() for item in cart.items],
        "total": sum(item.price for item in cart.items),
        "status": "active",  # active, converted, reminded, expired
        "reminder_sent": False,
        "reminder_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert basé sur l'email
    await db.abandoned_carts.update_one(
        {"email": email, "status": "active"},
        {"$set": cart_doc},
        upsert=True
    )
    
    return {"message": "Panier enregistré"}

@api_router.post("/cart/convert")
async def mark_cart_converted(current_user: dict = Depends(get_current_user)):
    """Marquer un panier comme converti (achat effectué)"""
    await db.abandoned_carts.update_many(
        {"email": current_user["email"], "status": "active"},
        {"$set": {"status": "converted", "converted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Panier marqué comme converti"}

@api_router.post("/admin/send-cart-reminders")
async def send_cart_reminders(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Envoyer des relances pour paniers abandonnés (admin)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails:
        raise HTTPException(status_code=403, detail="Accès admin requis")
    
    # Trouver les paniers abandonnés depuis plus de 2h mais moins de 7 jours
    cutoff_min = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    cutoff_max = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    carts = await db.abandoned_carts.find({
        "status": "active",
        "reminder_count": {"$lt": 2},  # Max 2 relances
        "created_at": {"$lt": cutoff_min, "$gt": cutoff_max}
    }).to_list(100)
    
    sent_count = 0
    for cart in carts:
        items_html = "".join([
            f"""<div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <img src="{item.get('image', '')}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                <div>
                    <p style="margin: 0; font-weight: bold;">{item['title']}</p>
                    <p style="margin: 5px 0; color: #f97316; font-weight: bold;">{item['price']:.2f} €</p>
                </div>
            </div>"""
            for item in cart["items"]
        ])
        
        background_tasks.add_task(
            send_email,
            cart["email"],
            "🛒 Vous avez oublié quelque chose...",
            f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f97316; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">World Auto</h1>
                </div>
                <div style="padding: 30px; background: #fff;">
                    <h2>Votre panier vous attend !</h2>
                    <p>Vous avez laissé des articles dans votre panier :</p>
                    <div style="margin: 20px 0; border: 1px solid #eee; border-radius: 8px;">
                        {items_html}
                    </div>
                    <p style="font-size: 18px; font-weight: bold;">Total : {cart['total']:.2f} €</p>
                    <a href="{SITE_URL}/panier" style="display: inline-block; background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-size: 16px;">Finaliser ma commande</a>
                </div>
                <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
                    <p>Les pièces sont disponibles en quantité limitée, ne tardez pas !</p>
                </div>
            </div>
            """
        )
        
        await db.abandoned_carts.update_one(
            {"id": cart["id"]},
            {"$set": {"reminder_sent": True, "last_reminder_at": datetime.now(timezone.utc).isoformat()}, "$inc": {"reminder_count": 1}}
        )
        sent_count += 1
    
    return {"message": f"{sent_count} relances envoyées"}

@api_router.get("/admin/abandoned-carts/stats")
async def get_abandoned_cart_stats(current_user: dict = Depends(get_current_user)):
    """Obtenir les statistiques des paniers abandonnés (admin)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails:
        raise HTTPException(status_code=403, detail="Accès admin requis")
    
    # Stats globales
    total_active = await db.abandoned_carts.count_documents({"status": "active"})
    total_converted = await db.abandoned_carts.count_documents({"status": "converted"})
    total_reminded = await db.abandoned_carts.count_documents({"reminder_count": {"$gt": 0}})
    
    # Valeur des paniers actifs
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": None, "total_value": {"$sum": "$total"}}}
    ]
    value_result = await db.abandoned_carts.aggregate(pipeline).to_list(1)
    active_value = value_result[0]["total_value"] if value_result else 0
    
    # Taux de conversion
    total_carts = total_active + total_converted
    conversion_rate = (total_converted / total_carts * 100) if total_carts > 0 else 0
    
    # Paniers récents actifs (dernières 24h)
    recent_cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    recent_carts = await db.abandoned_carts.find(
        {"status": "active", "created_at": {"$gt": recent_cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "stats": {
            "active_carts": total_active,
            "converted_carts": total_converted,
            "reminded_carts": total_reminded,
            "active_value": round(active_value, 2),
            "conversion_rate": round(conversion_rate, 1)
        },
        "recent_carts": recent_carts
    }

# ================== WIDGET EMBARQUABLE ==================

@api_router.get("/widget/listings")
async def get_widget_listings(seller_id: Optional[str] = None, category: Optional[str] = None, limit: int = 6):
    """Récupérer les annonces pour le widget embarquable"""
    query = {"status": "active"}
    if seller_id:
        query["seller_id"] = seller_id
    if category:
        query["category"] = category
    
    listings = await db.listings.find(
        query,
        {"_id": 0, "id": 1, "title": 1, "price": 1, "images": 1, "condition": 1, "location": 1}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "listings": listings,
        "base_url": SITE_URL
    }

@api_router.get("/widget/code")
async def get_widget_code(seller_id: Optional[str] = None, category: Optional[str] = None, theme: str = "light"):
    """Générer le code du widget embarquable"""
    params = []
    if seller_id:
        params.append(f"seller_id={seller_id}")
    if category:
        params.append(f"category={category}")
    params.append(f"theme={theme}")
    
    api_url = SITE_URL.replace("https://", "").replace("http://", "")
    params_str = "&".join(params)
    
    widget_code = f"""<!-- World Auto Widget -->
<div id="worldauto-widget" data-params="{params_str}"></div>
<script>
(function() {{
  var container = document.getElementById('worldauto-widget');
  var params = container.dataset.params;
  var iframe = document.createElement('iframe');
  iframe.src = '{SITE_URL}/widget?' + params;
  iframe.style.width = '100%';
  iframe.style.minHeight = '400px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  container.appendChild(iframe);
}})();
</script>
<!-- Fin World Auto Widget -->"""
    
    return {
        "code": widget_code,
        "preview_url": f"{SITE_URL}/widget?{params_str}"
    }

# ================== COUPONS / CODES PROMO ==================

class CouponCreate(BaseModel):
    code: str
    discount_type: str  # "percentage" or "fixed"
    discount_value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None  # For percentage coupons
    usage_limit: Optional[int] = None
    per_user_limit: int = 1
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    active: bool = True
    description: Optional[str] = None

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    active: Optional[bool] = None
    description: Optional[str] = None

@api_router.get("/admin/coupons")
async def get_all_coupons(current_user: dict = Depends(get_current_user)):
    """Get all coupons (admin only)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    return coupons

@api_router.post("/admin/coupons")
async def create_coupon(coupon: CouponCreate, current_user: dict = Depends(get_current_user)):
    """Create a new coupon (admin only)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Check if code already exists
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Ce code promo existe déjà")
    
    coupon_doc = {
        "id": str(uuid.uuid4()),
        "code": coupon.code.upper(),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_purchase": coupon.min_purchase,
        "max_discount": coupon.max_discount,
        "usage_limit": coupon.usage_limit,
        "usage_count": 0,
        "per_user_limit": coupon.per_user_limit,
        "valid_from": coupon.valid_from,
        "valid_until": coupon.valid_until,
        "active": coupon.active,
        "description": coupon.description,
        "used_by": [],  # List of user IDs who used this coupon
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.coupons.insert_one(coupon_doc)
    return {"message": "Coupon créé avec succès", "coupon": {k: v for k, v in coupon_doc.items() if k != "_id"}}

@api_router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon: CouponUpdate, current_user: dict = Depends(get_current_user)):
    """Update a coupon (admin only)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    existing = await db.coupons.find_one({"id": coupon_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon non trouvé")
    
    update_data = {k: v for k, v in coupon.dict().items() if v is not None}
    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()
        # Check if new code already exists
        code_exists = await db.coupons.find_one({"code": update_data["code"], "id": {"$ne": coupon_id}})
        if code_exists:
            raise HTTPException(status_code=400, detail="Ce code promo existe déjà")
    
    if update_data:
        await db.coupons.update_one({"id": coupon_id}, {"$set": update_data})
    
    updated = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    return {"message": "Coupon mis à jour", "coupon": updated}

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a coupon (admin only)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon non trouvé")
    
    return {"message": "Coupon supprimé"}

@api_router.post("/coupons/validate")
async def validate_coupon(code: str, cart_total: float, current_user: dict = Depends(get_current_user_optional)):
    """Validate a coupon code and calculate discount"""
    coupon = await db.coupons.find_one({"code": code.upper()}, {"_id": 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Code promo invalide")
    
    # Check if active
    if not coupon.get("active", True):
        raise HTTPException(status_code=400, detail="Ce code promo n'est plus actif")
    
    # Check dates
    now = datetime.now(timezone.utc)
    if coupon.get("valid_from"):
        valid_from = datetime.fromisoformat(coupon["valid_from"].replace("Z", "+00:00"))
        if now < valid_from:
            raise HTTPException(status_code=400, detail="Ce code promo n'est pas encore valide")
    
    if coupon.get("valid_until"):
        valid_until = datetime.fromisoformat(coupon["valid_until"].replace("Z", "+00:00"))
        if now > valid_until:
            raise HTTPException(status_code=400, detail="Ce code promo a expiré")
    
    # Check usage limit
    if coupon.get("usage_limit") and coupon.get("usage_count", 0) >= coupon["usage_limit"]:
        raise HTTPException(status_code=400, detail="Ce code promo a atteint sa limite d'utilisation")
    
    # Check per-user limit
    if current_user and coupon.get("per_user_limit"):
        user_uses = coupon.get("used_by", []).count(current_user["id"])
        if user_uses >= coupon["per_user_limit"]:
            raise HTTPException(status_code=400, detail="Vous avez déjà utilisé ce code promo")
    
    # Check minimum purchase
    if cart_total < coupon.get("min_purchase", 0):
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum d'achat requis: {coupon['min_purchase']} €"
        )
    
    # Calculate discount
    if coupon["discount_type"] == "percentage":
        discount = cart_total * (coupon["discount_value"] / 100)
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    else:  # fixed
        discount = min(coupon["discount_value"], cart_total)
    
    return {
        "valid": True,
        "code": coupon["code"],
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount_amount": round(discount, 2),
        "new_total": round(cart_total - discount, 2),
        "description": coupon.get("description"),
    }

@api_router.post("/coupons/apply")
async def apply_coupon(code: str, current_user: dict = Depends(get_current_user)):
    """Mark a coupon as used (call after successful checkout)"""
    coupon = await db.coupons.find_one({"code": code.upper()})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Code promo invalide")
    
    # Update usage
    await db.coupons.update_one(
        {"code": code.upper()},
        {
            "$inc": {"usage_count": 1},
            "$push": {"used_by": current_user["id"]}
        }
    )
    
    return {"message": "Coupon appliqué"}

# ================== PUSH NOTIFICATIONS ==================

class PushSubscription(BaseModel):
    subscription: dict
    preferences: Optional[dict] = None

class PushPreferences(BaseModel):
    preferences: dict

@api_router.post("/push/subscribe")
async def subscribe_push(data: PushSubscription, current_user: dict = Depends(get_current_user)):
    """Subscribe to push notifications"""
    subscription_data = {
        "user_id": current_user["id"],
        "endpoint": data.subscription.get("endpoint"),
        "keys": data.subscription.get("keys"),
        "preferences": data.preferences or {
            "messages": True,
            "price_alerts": True,
            "new_offers": True,
            "order_updates": True,
            "promotions": False
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update or create subscription
    await db.push_subscriptions.update_one(
        {"user_id": current_user["id"]},
        {"$set": subscription_data},
        upsert=True
    )
    
    # Update user's push notification status
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"push_enabled": True}}
    )
    
    return {"success": True, "message": "Notifications activées"}

@api_router.post("/push/unsubscribe")
async def unsubscribe_push(endpoint: str = Body(..., embed=True), current_user: dict = Depends(get_current_user)):
    """Unsubscribe from push notifications"""
    await db.push_subscriptions.delete_one({
        "user_id": current_user["id"]
    })
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"push_enabled": False}}
    )
    
    return {"success": True, "message": "Notifications désactivées"}

@api_router.put("/push/preferences")
async def update_push_preferences(data: PushPreferences, current_user: dict = Depends(get_current_user)):
    """Update push notification preferences"""
    await db.push_subscriptions.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "preferences": data.preferences,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True}

@api_router.get("/push/status")
async def get_push_status(current_user: dict = Depends(get_current_user)):
    """Get push notification status"""
    subscription = await db.push_subscriptions.find_one({"user_id": current_user["id"]})
    
    if subscription:
        subscription.pop("_id", None)
        return {
            "subscribed": True,
            "preferences": subscription.get("preferences", {})
        }
    
    return {"subscribed": False, "preferences": {}}

@api_router.get("/push/vapid-key")
async def get_vapid_public_key():
    """Get the VAPID public key for push subscriptions"""
    vapid_public_key = os.environ.get('VAPID_PUBLIC_KEY')
    if not vapid_public_key:
        raise HTTPException(status_code=500, detail="VAPID key not configured")
    return {"public_key": vapid_public_key}

@api_router.post("/push/test")
async def test_push_notification(current_user: dict = Depends(get_current_user)):
    """Send a test push notification to the current user"""
    success = await send_push_notification(
        user_id=current_user["id"],
        title="World Auto Pro",
        body="Les notifications fonctionnent ! 🎉",
        url="/profil",
        tag="test"
    )
    if not success:
        raise HTTPException(status_code=400, detail="Notifications non activées ou erreur d'envoi")
    return {"success": True, "message": "Notification envoyée !"}

# Helper function to send push notification (called from other parts of the app)
async def send_push_notification(user_id: str, title: str, body: str, url: str = "/", tag: str = "default"):
    """Send a push notification to a user using Web Push"""
    subscription = await db.push_subscriptions.find_one({"user_id": user_id})
    
    if not subscription or not subscription.get("subscription"):
        logging.info(f"No push subscription found for user {user_id}")
        return False
    
    # Get VAPID keys from environment
    vapid_private_key = os.environ.get('VAPID_PRIVATE_KEY')
    vapid_mailto = os.environ.get('VAPID_MAILTO', 'mailto:contact@worldautofrance.com')
    
    if not vapid_private_key:
        logging.error("VAPID_PRIVATE_KEY not configured")
        return False
    
    # Build notification payload
    payload = json.dumps({
        "title": title,
        "body": body,
        "icon": "/logo192.png",
        "badge": "/logo192.png",
        "tag": tag,
        "url": url,
        "requireInteraction": tag in ["message", "order"]
    })
    
    try:
        sub_info = subscription["subscription"]
        webpush(
            subscription_info=sub_info,
            data=payload,
            vapid_private_key=vapid_private_key,
            vapid_claims={"sub": vapid_mailto}
        )
        logging.info(f"Push notification sent to user {user_id}: {title}")
        
        # Store notification in history
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "body": body,
            "url": url,
            "tag": tag,
            "read": False,
            "delivered": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return True
    except WebPushException as e:
        logging.error(f"WebPush error for user {user_id}: {e}")
        # If subscription is expired/invalid, remove it
        if e.response and e.response.status_code in [404, 410]:
            await db.push_subscriptions.delete_one({"user_id": user_id})
            logging.info(f"Removed invalid subscription for user {user_id}")
        return False
    except Exception as e:
        logging.error(f"Failed to send push notification: {e}")
        return False


# Helper to send push notifications to multiple users
async def send_push_to_users(user_ids: List[str], title: str, body: str, url: str = "/", tag: str = "default"):
    """Send push notification to multiple users"""
    results = []
    for user_id in user_ids:
        success = await send_push_notification(user_id, title, body, url, tag)
        results.append({"user_id": user_id, "success": success})
    return results

# ================== IDENTITY VERIFICATION ==================

class IdentitySubmission(BaseModel):
    id_front_url: str
    id_back_url: Optional[str] = None
    selfie_url: str

@api_router.post("/identity/submit")
async def submit_identity_verification(data: IdentitySubmission, current_user: dict = Depends(get_current_user)):
    """Submit identity verification request"""
    
    # Check if already verified
    if current_user.get("identity_status") == "verified":
        raise HTTPException(status_code=400, detail="Votre identité est déjà vérifiée")
    
    # Check if pending
    if current_user.get("identity_status") == "pending":
        raise HTTPException(status_code=400, detail="Une demande est déjà en cours de traitement")
    
    verification_request = {
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "user_name": current_user.get("name", ""),
        "id_front_url": data.id_front_url,
        "id_back_url": data.id_back_url,
        "selfie_url": data.selfie_url,
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": None,
        "reviewed_by": None,
        "rejection_reason": None
    }
    
    await db.identity_verifications.insert_one(verification_request)
    
    # Update user status
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"identity_status": "pending"}}
    )
    
    return {"success": True, "message": "Demande de vérification soumise"}

@api_router.get("/identity/status")
async def get_identity_status(current_user: dict = Depends(get_current_user)):
    """Get identity verification status"""
    return {
        "status": current_user.get("identity_status", "not_submitted"),
        "verified": current_user.get("identity_status") == "verified"
    }

@api_router.get("/admin/identity/pending")
async def get_pending_verifications(current_user: dict = Depends(get_current_user)):
    """Get pending identity verifications (admin only)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin only")
    
    verifications = await db.identity_verifications.find({"status": "pending"}).sort("submitted_at", -1).to_list(100)
    
    for v in verifications:
        v["id"] = str(v.pop("_id"))
    
    return verifications

@api_router.post("/admin/identity/{user_id}/approve")
async def approve_identity(user_id: str, current_user: dict = Depends(get_current_user)):
    """Approve identity verification (admin only)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Update verification request
    await db.identity_verifications.update_one(
        {"user_id": user_id, "status": "pending"},
        {"$set": {
            "status": "verified",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": current_user["id"]
        }}
    )
    
    # Update user
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "identity_status": "verified",
            "identity_verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Identité vérifiée"}

@api_router.post("/admin/identity/{user_id}/reject")
async def reject_identity(user_id: str, reason: str = Body(..., embed=True), current_user: dict = Depends(get_current_user)):
    """Reject identity verification (admin only)"""
    admin_emails = ['contact@worldautofrance.com', 'admin@worldautofrance.com']
    if current_user.get('email') not in admin_emails and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Update verification request
    await db.identity_verifications.update_one(
        {"user_id": user_id, "status": "pending"},
        {"$set": {
            "status": "rejected",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": current_user["id"],
            "rejection_reason": reason
        }}
    )
    
    # Update user
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"identity_status": "rejected"}}
    )
    
    return {"success": True, "message": "Vérification refusée"}

# ================== STORIES ==================

class StoryCreate(BaseModel):
    media_url: str
    type: str = "image"  # image or video
    caption: Optional[str] = None

@api_router.get("/stories")
async def get_stories(current_user: dict = Depends(get_current_user_optional)):
    """Get all active stories (last 24 hours)"""
    twenty_four_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    
    stories = await db.stories.find({
        "created_at": {"$gte": twenty_four_hours_ago},
        "deleted": {"$ne": True}
    }).sort("created_at", -1).to_list(200)
    
    # Get user data for each story
    user_ids = list(set([s["user_id"] for s in stories]))
    users = await db.users.find({"id": {"$in": user_ids}}).to_list(100)
    users_map = {u["id"]: u for u in users}
    
    # Get viewed stories for current user
    viewed_story_ids = set()
    if current_user:
        views = await db.story_views.find({
            "user_id": current_user["id"],
            "created_at": {"$gte": twenty_four_hours_ago}
        }).to_list(500)
        viewed_story_ids = set([v["story_id"] for v in views])
    
    result = []
    for story in stories:
        story.pop("_id", None)
        user = users_map.get(story["user_id"], {})
        story["user_name"] = user.get("name", "Vendeur")
        story["user_avatar"] = user.get("avatar")
        story["user_verified"] = user.get("identity_status") == "verified"
        story["viewed"] = story["id"] in viewed_story_ids
        result.append(story)
    
    return result

@api_router.post("/stories")
async def create_story(data: StoryCreate, current_user: dict = Depends(get_current_user)):
    """Create a new story"""
    story = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "media_url": data.media_url,
        "type": data.type,
        "caption": data.caption,
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "deleted": False
    }
    
    await db.stories.insert_one(story)
    story.pop("_id", None)
    
    return story

@api_router.post("/stories/{story_id}/view")
async def view_story(story_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a story as viewed"""
    # Check if already viewed
    existing = await db.story_views.find_one({
        "story_id": story_id,
        "user_id": current_user["id"]
    })
    
    if not existing:
        await db.story_views.insert_one({
            "story_id": story_id,
            "user_id": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Increment view count
        await db.stories.update_one(
            {"id": story_id},
            {"$inc": {"views": 1}}
        )
    
    return {"success": True}

@api_router.delete("/stories/{story_id}")
async def delete_story(story_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a story"""
    story = await db.stories.find_one({"id": story_id})
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    if story["user_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.stories.update_one(
        {"id": story_id},
        {"$set": {"deleted": True}}
    )
    
    return {"success": True}

@api_router.get("/stories/my")
async def get_my_stories(current_user: dict = Depends(get_current_user)):
    """Get current user's stories"""
    twenty_four_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    
    stories = await db.stories.find({
        "user_id": current_user["id"],
        "created_at": {"$gte": twenty_four_hours_ago},
        "deleted": {"$ne": True}
    }).sort("created_at", -1).to_list(50)
    
    for story in stories:
        story.pop("_id", None)
    
    return stories

# ================== ROOT ==================

@api_router.get("/")
async def root():
    return {"message": "World Auto Marketplace API", "version": "1.0.0"}

app.include_router(api_router)

# Custom middleware to add no-cache headers to all API responses
from starlette.middleware.base import BaseHTTPMiddleware

class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # Add no-cache headers to all API responses
        if request.url.path.startswith('/api'):
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response

app.add_middleware(NoCacheMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Cache-Control", "Pragma", "Expires"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ================== ABANDONED CART SCHEDULER ==================
import asyncio

async def process_abandoned_cart_reminders():
    """Tâche planifiée pour envoyer les relances de panier abandonné"""
    while True:
        try:
            # Attendre 1 heure entre chaque vérification
            await asyncio.sleep(3600)
            
            # Trouver les paniers abandonnés depuis plus de 2h mais moins de 7 jours
            cutoff_min = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
            cutoff_max = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            
            carts = await db.abandoned_carts.find({
                "status": "active",
                "reminder_count": {"$lt": 2},
                "created_at": {"$lt": cutoff_min, "$gt": cutoff_max}
            }, {"_id": 0}).to_list(50)
            
            sent_count = 0
            for cart in carts:
                # Espacer les relances d'au moins 24h
                last_reminder = cart.get("last_reminder_at")
                if last_reminder:
                    last_time = datetime.fromisoformat(last_reminder.replace('Z', '+00:00'))
                    if datetime.now(timezone.utc) - last_time < timedelta(hours=24):
                        continue
                
                items_html = "".join([
                    f"""<div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                        <img src="{item.get('image', '')}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                        <div>
                            <p style="margin: 0; font-weight: bold;">{item['title']}</p>
                            <p style="margin: 5px 0; color: #f97316; font-weight: bold;">{item['price']:.2f} €</p>
                        </div>
                    </div>"""
                    for item in cart.get("items", [])
                ])
                
                email_sent = send_email(
                    cart["email"],
                    "🛒 Vous avez oublié quelque chose...",
                    f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #f97316; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">World Auto</h1>
                        </div>
                        <div style="padding: 30px; background: #fff;">
                            <h2>Votre panier vous attend !</h2>
                            <p>Vous avez laissé des articles dans votre panier :</p>
                            <div style="margin: 20px 0; border: 1px solid #eee; border-radius: 8px;">
                                {items_html}
                            </div>
                            <p style="font-size: 18px; font-weight: bold;">Total : {cart.get('total', 0):.2f} €</p>
                            <a href="{SITE_URL}/panier" style="display: inline-block; background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-size: 16px;">Finaliser ma commande</a>
                        </div>
                        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
                            <p>Les pièces sont disponibles en quantité limitée, ne tardez pas !</p>
                        </div>
                    </div>
                    """
                )
                
                if email_sent:
                    await db.abandoned_carts.update_one(
                        {"id": cart["id"]},
                        {"$set": {"last_reminder_at": datetime.now(timezone.utc).isoformat()}, "$inc": {"reminder_count": 1}}
                    )
                    sent_count += 1
            
            if sent_count > 0:
                logger.info(f"✅ {sent_count} relances de panier abandonnées envoyées")
                
        except Exception as e:
            logger.error(f"Erreur dans le scheduler de relance panier: {e}")

# ================== BOXTAL SHIPPING API ==================

# Boxtal Config
BOXTAL_APP_ID = os.environ.get('BOXTAL_APP_ID', '')
BOXTAL_ACCESS_KEY = os.environ.get('BOXTAL_ACCESS_KEY', '')
BOXTAL_SECRET_KEY = os.environ.get('BOXTAL_SECRET_KEY', '')
BOXTAL_API_URL = os.environ.get('BOXTAL_API_URL', 'https://api.boxtal.com')
BOXTAL_MODE = os.environ.get('BOXTAL_MODE', 'simulation')  # simulation or production
BOXTAL_MARGIN_PERCENT = float(os.environ.get('BOXTAL_MARGIN_PERCENT', '15'))  # Marge sur les frais de port

def apply_shipping_margin(price: float) -> float:
    """Applique la marge sur le prix de livraison"""
    return round(price * (1 + BOXTAL_MARGIN_PERCENT / 100), 2)

class BoxtalAddress(BaseModel):
    company_name: Optional[str] = None
    first_name: str
    last_name: str
    street: str
    postal_code: str
    city: str
    country_code: str = "FR"
    phone: Optional[str] = None
    email: Optional[str] = None

class BoxtalParcel(BaseModel):
    weight: float  # in grams
    length: float  # in cm
    width: float   # in cm
    height: float  # in cm
    description: Optional[str] = None
    value: Optional[float] = None  # for insurance

class BoxtalQuoteRequest(BaseModel):
    sender_address: BoxtalAddress
    receiver_address: BoxtalAddress
    parcels: List[BoxtalParcel]

class BoxtalShipmentRequest(BaseModel):
    quote_id: str
    service_id: str
    reference: str
    sender_address: BoxtalAddress
    receiver_address: BoxtalAddress
    parcels: List[BoxtalParcel]

# Boxtal Auth Token Cache
boxtal_token_cache = {
    "token": None,
    "expires_at": None
}

async def get_boxtal_token():
    """Get Boxtal Bearer Token (with caching)"""
    import base64
    
    # Check cache
    if boxtal_token_cache["token"] and boxtal_token_cache["expires_at"]:
        if datetime.now() < boxtal_token_cache["expires_at"] - timedelta(minutes=5):
            return boxtal_token_cache["token"]
    
    # Generate new token using App ID, Access Key and Secret Key
    credentials = f"{BOXTAL_ACCESS_KEY}:{BOXTAL_SECRET_KEY}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    # Include app_id in the request if available
    data = {"grant_type": "client_credentials"}
    if BOXTAL_APP_ID:
        data["app_id"] = BOXTAL_APP_ID
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BOXTAL_API_URL}/v3/auth/token",
            headers=headers,
            data=data
        )
        
        if response.status_code != 200:
            logger.error(f"Boxtal auth failed: {response.status_code} - {response.text}")
            raise HTTPException(status_code=401, detail=f"Boxtal authentication failed: {response.text}")
        
        data = response.json()
        boxtal_token_cache["token"] = data.get("access_token")
        expires_in = data.get("expires_in", 3600)
        boxtal_token_cache["expires_at"] = datetime.now() + timedelta(seconds=expires_in)
        
        return boxtal_token_cache["token"]

@app.get("/api/boxtal/status")
async def boxtal_status():
    """Check Boxtal integration status"""
    return {
        "configured": bool(BOXTAL_ACCESS_KEY and BOXTAL_SECRET_KEY),
        "mode": BOXTAL_MODE,
        "api_url": BOXTAL_API_URL,
        "simulation_active": BOXTAL_MODE == "simulation",
        "margin_percent": BOXTAL_MARGIN_PERCENT
    }

@app.post("/api/boxtal/quotes")
async def get_boxtal_quotes(request: BoxtalQuoteRequest):
    """Get shipping quotes from Boxtal"""
    
    # In simulation mode, return simulated quotes
    if BOXTAL_MODE == "simulation":
        # Prix de base (simulés)
        base_colissimo = round(5.50 + (request.parcels[0].weight / 1000) * 2, 2)
        base_mondial = round(3.90 + (request.parcels[0].weight / 1000) * 1.5, 2)
        base_chronopost = round(12.90 + (request.parcels[0].weight / 1000) * 3, 2)
        base_dpd = round(6.90 + (request.parcels[0].weight / 1000) * 2.2, 2)
        
        simulated_options = [
            {
                "service_id": "colissimo_domicile",
                "carrier_name": "Colissimo",
                "carrier_logo": "https://www.colissimo.fr/images/logo-colissimo.png",
                "service_name": "Livraison à domicile",
                "delivery_time_min": 2,
                "delivery_time_max": 4,
                "price_ht_base": base_colissimo,
                "price_ht": apply_shipping_margin(base_colissimo),
                "price_ttc": apply_shipping_margin(base_colissimo * 1.20),
                "insurance_available": True
            },
            {
                "service_id": "mondial_relay_point",
                "carrier_name": "Mondial Relay",
                "carrier_logo": "https://www.mondialrelay.fr/media/108418/logo-mondial-relay.png",
                "service_name": "Point Relais",
                "delivery_time_min": 3,
                "delivery_time_max": 5,
                "price_ht_base": base_mondial,
                "price_ht": apply_shipping_margin(base_mondial),
                "price_ttc": apply_shipping_margin(base_mondial * 1.20),
                "insurance_available": False
            },
            {
                "service_id": "chronopost_express",
                "carrier_name": "Chronopost",
                "carrier_logo": "https://www.chronopost.fr/sites/chronopost/files/logo-chronopost.png",
                "service_name": "Express 24h",
                "delivery_time_min": 1,
                "delivery_time_max": 1,
                "price_ht_base": base_chronopost,
                "price_ht": apply_shipping_margin(base_chronopost),
                "price_ttc": apply_shipping_margin(base_chronopost * 1.20),
                "insurance_available": True
            },
            {
                "service_id": "dpd_classic",
                "carrier_name": "DPD",
                "carrier_logo": "https://www.dpd.fr/sites/default/files/dpd_logo.png",
                "service_name": "DPD Classic",
                "delivery_time_min": 2,
                "delivery_time_max": 3,
                "price_ht_base": base_dpd,
                "price_ht": apply_shipping_margin(base_dpd),
                "price_ttc": apply_shipping_margin(base_dpd * 1.20),
                "insurance_available": True
            }
        ]
        
        quote_id = f"SIM-{uuid.uuid4().hex[:12].upper()}"
        
        # Store quote in database for reference
        await db.shipping_quotes.insert_one({
            "quote_id": quote_id,
            "mode": "simulation",
            "request": request.dict(),
            "options": simulated_options,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "valid_until": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        })
        
        return {
            "quote_id": quote_id,
            "mode": "simulation",
            "options": simulated_options,
            "valid_until": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        }
    
    # Production mode - call real Boxtal API
    try:
        token = await get_boxtal_token()
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Format request for Boxtal API
        payload = {
            "shipper": {
                "company": request.sender_address.company_name,
                "firstname": request.sender_address.first_name,
                "lastname": request.sender_address.last_name,
                "street": request.sender_address.street,
                "zipcode": request.sender_address.postal_code,
                "city": request.sender_address.city,
                "country": request.sender_address.country_code,
                "phone": request.sender_address.phone,
                "email": request.sender_address.email
            },
            "recipient": {
                "company": request.receiver_address.company_name,
                "firstname": request.receiver_address.first_name,
                "lastname": request.receiver_address.last_name,
                "street": request.receiver_address.street,
                "zipcode": request.receiver_address.postal_code,
                "city": request.receiver_address.city,
                "country": request.receiver_address.country_code,
                "phone": request.receiver_address.phone,
                "email": request.receiver_address.email
            },
            "parcels": [{
                "weight": p.weight / 1000,  # Convert to kg
                "length": p.length,
                "width": p.width,
                "height": p.height
            } for p in request.parcels]
        }
        
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.post(
                f"{BOXTAL_API_URL}/v3/shipping/quote",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"Boxtal quote error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Boxtal error: {response.text}")
            
            data = response.json()
            quote_id = data.get("id", f"BOX-{uuid.uuid4().hex[:12].upper()}")
            
            # Parse and format options with margin
            options = []
            for offer in data.get("offers", []):
                base_price_ht = float(offer.get("price", {}).get("tax_exclusive", 0))
                base_price_ttc = float(offer.get("price", {}).get("tax_inclusive", 0))
                options.append({
                    "service_id": offer.get("id"),
                    "carrier_name": offer.get("carrier", {}).get("name"),
                    "carrier_logo": offer.get("carrier", {}).get("logo"),
                    "service_name": offer.get("service", {}).get("name"),
                    "delivery_time_min": offer.get("delivery", {}).get("min_days", 1),
                    "delivery_time_max": offer.get("delivery", {}).get("max_days", 5),
                    "price_ht_base": base_price_ht,
                    "price_ht": apply_shipping_margin(base_price_ht),
                    "price_ttc": apply_shipping_margin(base_price_ttc),
                    "insurance_available": offer.get("insurance_available", False)
                })
            
            # Store quote
            await db.shipping_quotes.insert_one({
                "quote_id": quote_id,
                "mode": "production",
                "request": request.dict(),
                "options": options,
                "raw_response": data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "valid_until": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
            })
            
            return {
                "quote_id": quote_id,
                "mode": "production",
                "options": options,
                "valid_until": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Boxtal quote error: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting shipping quotes: {str(e)}")

@app.post("/api/boxtal/shipments")
async def create_boxtal_shipment(request: BoxtalShipmentRequest, current_user: dict = Depends(get_current_user)):
    """Create a shipment with Boxtal"""
    
    # In simulation mode, return simulated shipment
    if BOXTAL_MODE == "simulation":
        shipment_id = f"SIM-SHIP-{uuid.uuid4().hex[:12].upper()}"
        tracking_number = f"SIMTRACK{uuid.uuid4().hex[:10].upper()}"
        
        shipment_data = {
            "shipment_id": shipment_id,
            "tracking_number": tracking_number,
            "quote_id": request.quote_id,
            "service_id": request.service_id,
            "reference": request.reference,
            "user_id": current_user["id"],
            "mode": "simulation",
            "status": "simulated",
            "label_url": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.shipments.insert_one(shipment_data)
        
        logger.info(f"⚠️ SIMULATION: Shipment {shipment_id} created (no real shipment)")
        
        return {
            "shipment_id": shipment_id,
            "tracking_number": tracking_number,
            "mode": "simulation",
            "status": "simulated",
            "message": "Mode simulation - Aucune expédition réelle créée",
            "label_url": None
        }
    
    # Production mode - create real shipment
    try:
        token = await get_boxtal_token()
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "quote_id": request.quote_id,
            "offer_id": request.service_id,
            "reference": request.reference,
            "shipper": {
                "company": request.sender_address.company_name,
                "firstname": request.sender_address.first_name,
                "lastname": request.sender_address.last_name,
                "street": request.sender_address.street,
                "zipcode": request.sender_address.postal_code,
                "city": request.sender_address.city,
                "country": request.sender_address.country_code,
                "phone": request.sender_address.phone,
                "email": request.sender_address.email
            },
            "recipient": {
                "company": request.receiver_address.company_name,
                "firstname": request.receiver_address.first_name,
                "lastname": request.receiver_address.last_name,
                "street": request.receiver_address.street,
                "zipcode": request.receiver_address.postal_code,
                "city": request.receiver_address.city,
                "country": request.receiver_address.country_code,
                "phone": request.receiver_address.phone,
                "email": request.receiver_address.email
            },
            "parcels": [{
                "weight": p.weight / 1000,
                "length": p.length,
                "width": p.width,
                "height": p.height
            } for p in request.parcels]
        }
        
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            response = await http_client.post(
                f"{BOXTAL_API_URL}/v3/shipping/order",
                headers=headers,
                json=payload
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Boxtal shipment error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Boxtal error: {response.text}")
            
            data = response.json()
            
            shipment_data = {
                "shipment_id": data.get("id"),
                "tracking_number": data.get("tracking_number"),
                "quote_id": request.quote_id,
                "service_id": request.service_id,
                "reference": request.reference,
                "user_id": current_user["id"],
                "mode": "production",
                "status": data.get("status", "created"),
                "label_url": data.get("label", {}).get("url"),
                "carrier": data.get("carrier", {}).get("name"),
                "raw_response": data,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.shipments.insert_one(shipment_data)
            
            return {
                "shipment_id": data.get("id"),
                "tracking_number": data.get("tracking_number"),
                "mode": "production",
                "status": data.get("status", "created"),
                "label_url": data.get("label", {}).get("url"),
                "carrier": data.get("carrier", {}).get("name")
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Boxtal shipment error: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating shipment: {str(e)}")

@app.get("/api/boxtal/tracking/{tracking_number}")
async def get_boxtal_tracking(tracking_number: str):
    """Get tracking information for a shipment"""
    
    # Check if simulated shipment
    shipment = await db.shipments.find_one({"tracking_number": tracking_number})
    
    if shipment and shipment.get("mode") == "simulation":
        return {
            "tracking_number": tracking_number,
            "mode": "simulation",
            "status": "simulated",
            "carrier": "Simulation",
            "events": [
                {
                    "date": shipment.get("created_at"),
                    "status": "Expédition simulée créée",
                    "location": "Mode test"
                }
            ],
            "message": "Ceci est une expédition simulée - pas de suivi réel"
        }
    
    # Production mode - get real tracking
    if BOXTAL_MODE == "simulation":
        return {
            "tracking_number": tracking_number,
            "mode": "simulation",
            "status": "unknown",
            "message": "Mode simulation activé - pas de suivi réel disponible"
        }
    
    try:
        token = await get_boxtal_token()
        
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.get(
                f"{BOXTAL_API_URL}/v3/tracking/{tracking_number}",
                headers=headers
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Tracking not found")
            
            data = response.json()
            
            return {
                "tracking_number": tracking_number,
                "mode": "production",
                "status": data.get("status"),
                "carrier": data.get("carrier", {}).get("name"),
                "estimated_delivery": data.get("estimated_delivery"),
                "events": data.get("events", [])
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Boxtal tracking error: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting tracking: {str(e)}")

@app.get("/api/boxtal/shipments")
async def get_user_shipments(current_user: dict = Depends(get_current_user)):
    """Get all shipments for current user"""
    shipments = await db.shipments.find(
        {"user_id": current_user["id"]},
        {"_id": 0, "raw_response": 0}
    ).sort("created_at", -1).to_list(100)
    
    return shipments

@app.get("/api/admin/boxtal/config")
async def get_boxtal_config(current_user: dict = Depends(get_current_user)):
    """Get Boxtal configuration (admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "mode": BOXTAL_MODE,
        "margin_percent": BOXTAL_MARGIN_PERCENT,
        "configured": bool(BOXTAL_ACCESS_KEY and BOXTAL_SECRET_KEY)
    }

@app.put("/api/admin/boxtal/margin")
async def update_boxtal_margin(data: dict, current_user: dict = Depends(get_current_user)):
    """Update shipping margin percentage (admin only)"""
    global BOXTAL_MARGIN_PERCENT
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_margin = data.get("margin_percent")
    if new_margin is None or not isinstance(new_margin, (int, float)):
        raise HTTPException(status_code=400, detail="margin_percent is required and must be a number")
    
    if new_margin < 0 or new_margin > 100:
        raise HTTPException(status_code=400, detail="margin_percent must be between 0 and 100")
    
    BOXTAL_MARGIN_PERCENT = float(new_margin)
    
    # Save to database for persistence
    await db.site_settings.update_one(
        {"setting_type": "boxtal"},
        {"$set": {"margin_percent": BOXTAL_MARGIN_PERCENT, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    logger.info(f"📦 Boxtal margin updated to {BOXTAL_MARGIN_PERCENT}%")
    
    return {
        "success": True,
        "margin_percent": BOXTAL_MARGIN_PERCENT,
        "message": f"Marge mise à jour à {BOXTAL_MARGIN_PERCENT}%"
    }

@app.on_event("startup")
async def startup_event():
    """Démarrer les tâches planifiées au lancement de l'application"""
    global BOXTAL_MARGIN_PERCENT
    
    logger.info("🚀 Démarrage des tâches planifiées...")
    # Lancer le scheduler de relance panier en arrière-plan
    asyncio.create_task(process_abandoned_cart_reminders())
    logger.info("✅ Scheduler de relance panier abandonné activé")
    
    # Load Boxtal margin from database if exists
    boxtal_settings = await db.site_settings.find_one({"setting_type": "boxtal"})
    if boxtal_settings and "margin_percent" in boxtal_settings:
        BOXTAL_MARGIN_PERCENT = float(boxtal_settings["margin_percent"])
        logger.info(f"📦 Marge Boxtal chargée depuis la base: {BOXTAL_MARGIN_PERCENT}%")
    
    # Log Boxtal configuration
    if BOXTAL_ACCESS_KEY and BOXTAL_SECRET_KEY:
        logger.info(f"📦 Boxtal API configuré - Mode: {BOXTAL_MODE}, Marge: {BOXTAL_MARGIN_PERCENT}%")
    else:
        logger.warning("⚠️ Boxtal API non configuré (clés manquantes)")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
