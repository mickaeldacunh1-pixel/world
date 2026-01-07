"""Configuration centralisée de l'application"""
import os
from pathlib import Path
from dotenv import load_dotenv
import cloudinary

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB Config
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'autopieces-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Cloudinary Config
CLOUDINARY_CONFIG = {
    'cloud_name': os.environ.get('CLOUDINARY_CLOUD_NAME', 'dmtnmaloe'),
    'api_key': os.environ.get('CLOUDINARY_API_KEY', '743968936572992'),
    'api_secret': os.environ.get('CLOUDINARY_API_SECRET', 'S9L4owos6Okd_9bFqo5R2keEbcU')
}

# Initialize Cloudinary
cloudinary.config(**CLOUDINARY_CONFIG)

# Email Config
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.hostinger.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USER = os.environ.get('SMTP_USER', 'contact@worldautofrance.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SITE_URL = os.environ.get('SITE_URL', 'https://worldautofrance.com')
NEWSLETTER_SECRET_KEY = os.environ.get('NEWSLETTER_SECRET_KEY', '')
ADMIN_EMAIL = "contact@worldautofrance.com"

# CORS Config
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

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
