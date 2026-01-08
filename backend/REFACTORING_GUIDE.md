# Guide de Refactoring Backend - MISE À JOUR

## État Actuel (Post-Refactoring Phase 1-3)

Le fichier `server.py` contient ~8070 lignes de code. La structure modulaire a été créée et les premiers modules ont été extraits.

## Structure Actuelle

```
/app/backend/
├── server.py              # Point d'entrée principal (à réduire progressivement)
├── config.py              # ✅ Configuration centralisée
├── database.py            # ✅ Connexion MongoDB
├── models/                # ✅ Modèles Pydantic
│   ├── __init__.py        
│   └── schemas.py         # UserCreate, ListingCreate, etc.
├── routes/                # 🔄 Endpoints API (en cours)
│   ├── __init__.py        
│   ├── auth.py            # ✅ /api/auth/*
│   └── videos.py          # ✅ /api/videos/*, /api/listings/videos
├── services/              # ✅ Logique métier
│   ├── __init__.py        
│   ├── email_service.py   # Service d'envoi d'emails
│   └── moderation_service.py  # Modération de contenu
└── utils/                 # ✅ Utilitaires
    ├── __init__.py        
    └── auth.py            # JWT, hashing, authentication
```

## Modules Extraits ✅

### 1. config.py
- Variables d'environnement
- Configuration Cloudinary, Stripe, SMTP
- Constantes globales

### 2. database.py
- Connexion MongoDB async
- Export de `db` pour tous les modules

### 3. models/schemas.py
- UserCreate, UserUpdate, UserResponse
- ListingCreate, ListingUpdate
- OrderCreate, MessageCreate, ReviewCreate
- OfferCreate, AlertCreate, BundleCreate
- Constantes: WARRANTY_OPTIONS, PIECES_SUBCATEGORIES, etc.

### 4. services/email_service.py
- send_email()
- send_welcome_email()
- send_password_reset_email()
- send_order_confirmation_email()
- send_new_message_notification()
- send_listing_sold_notification()
- send_shipping_update_email()

### 5. services/moderation_service.py
- moderate_listing()
- moderate_message()
- moderate_review()
- sanitize_text()
- check_forbidden_words()
- check_suspicious_patterns()

### 6. utils/auth.py
- hash_password(), verify_password()
- create_access_token(), decode_token()
- get_current_user(), get_current_user_optional()
- get_admin_user()
- generate_reset_token(), verify_reset_token()

### 7. routes/auth.py
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/change-password

### 8. routes/videos.py
- GET /api/listings/videos
- GET /api/videos/featured
- GET /api/videos/homepage-showcase
- POST /api/video/boost/checkout
- POST /api/video/package/checkout
- GET /api/users/me/video-packages

## Prochaines Étapes (Phase 4+)

### Routes à extraire:
- [ ] routes/listings.py - CRUD annonces
- [ ] routes/orders.py - Commandes et livraison
- [ ] routes/messages.py - Messagerie
- [ ] routes/payments.py - Paiements Stripe
- [ ] routes/admin.py - Administration
- [ ] routes/ai.py - Outils IA
- [ ] routes/auctions.py - Enchères
- [ ] routes/loyalty.py - Fidélité et parrainage

### Services à extraire:
- [ ] services/stripe_service.py - Intégration Stripe
- [ ] services/cloudinary_service.py - Upload images/vidéos
- [ ] services/ai_service.py - Intégrations IA

## Comment Utiliser les Modules

```python
# Dans server.py ou tout autre fichier
from config import SITE_URL, JWT_SECRET
from database import db
from models import UserCreate, ListingCreate
from services import send_welcome_email, moderate_listing
from utils import get_current_user, hash_password
from routes import auth_router, videos_router

# Inclure les routers
app.include_router(auth_router, prefix="/api")
app.include_router(videos_router, prefix="/api")
```

## Notes Importantes

1. **Imports circulaires**: Utiliser des imports locaux si nécessaire
2. **Tests**: Tester après chaque migration de route
3. **Backwards compatibility**: Les anciennes routes dans server.py fonctionnent toujours
4. **Migration progressive**: Ne pas tout migrer d'un coup

## Statistiques

- Lignes dans server.py: ~8070 (avant refactoring complet)
- Modules créés: 8
- Routes migrées: 2 (auth, videos)
- Estimation réduction: ~15% après migration complète des routes listées
