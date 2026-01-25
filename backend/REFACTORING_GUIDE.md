# Guide de Refactoring Backend - World Auto France

## État Actuel (25 janvier 2026)

Le fichier `server.py` contient **12 472 lignes** de code avec 69 sections. Une structure modulaire existe déjà et certains modules ont été extraits.

## Structure Actuelle

```
/app/backend/
├── server.py              # Point d'entrée principal (12 472 lignes - à réduire)
├── config.py              # ✅ Configuration centralisée
├── database.py            # ✅ Connexion MongoDB
├── models/                # ✅ Modèles Pydantic
│   ├── __init__.py        
│   └── schemas.py         # UserCreate, ListingCreate, etc.
├── routes/                # 🔄 Endpoints API (en cours)
│   ├── __init__.py        
│   ├── auth.py            # ✅ /api/auth/* (existe mais non utilisé)
│   ├── payouts.py         # ✅ Reversements
│   ├── radio.py           # ✅ Radio streaming
│   └── videos.py          # ✅ /api/videos/*
├── services/              # ✅ Logique métier
│   ├── __init__.py        
│   ├── email_service.py   # ✅ Service d'envoi d'emails
│   ├── moderation_service.py  # ✅ Modération de contenu
│   └── payout_service.py  # ✅ Service de reversements
└── utils/                 # ✅ Utilitaires
    ├── __init__.py        
    └── auth.py            # JWT, hashing, authentication
```

## Sections de server.py (69 sections)

| Ligne | Section | Lignes estimées | Priorité |
|-------|---------|-----------------|----------|
| 43 | SECURITY & RATE LIMITING | ~130 | P2 |
| 174 | EMAIL SERVICE | ~550 | ✅ Partiellement extrait |
| 730 | MODELS | ~185 | ✅ Extrait dans models/ |
| 748 | SYSTÈME PROMO LANCEMENT | ~20 | P3 |
| 771 | CONTENT MODERATION | ~130 | ✅ Extrait |
| 915 | 2FA MODELS | ~10 | P3 |
| 1235 | AUTH HELPERS | ~50 | ✅ Extrait dans utils/auth.py |
| 1286 | AUTH ROUTES | ~180 | P1 - À migrer |
| 1654 | 2FA ENDPOINTS | ~280 | P2 |
| 1932 | SIRET VERIFICATION | ~100 | P3 |
| 2036 | PROFILE MANAGEMENT | ~200 | P2 |
| 2309 | **LISTINGS ROUTES** | ~190 | **P0 - Prioritaire** |
| 2498 | IMAGE UPLOAD | ~70 | P2 |
| 2693 | VIDEO LISTINGS & BOOST | ~560 | P2 |
| 3257 | FAVORITES ROUTES | ~50 | P2 |
| 3307 | WISHLIST PARTAGEABLE | ~80 | P3 |
| 3580 | MESSAGES ROUTES | ~100 | P1 |
| 3861 | **ORDERS & SHIPPING** | ~390 | **P0 - Prioritaire** |
| 4499 | REVIEWS ROUTES | ~90 | P2 |
| 4592 | WEBSOCKET CHAT | ~180 | P2 |
| 5266 | SETTINGS ROUTES | ~110 | P3 |
| 5805 | PAYMENT ROUTES | ~30 | P1 |
| 6292 | **STRIPE CONNECT** | ~160 | **P1 - Important** |
| 6943 | STATS ROUTES | ~280 | P2 |
| 7221 | REPORTS (SIGNALEMENTS) | ~150 | P2 |
| 7373 | AUTOEXPERT AI | ~180 | P3 |
| 7638 | AI TOOLS | ~120 | P3 |
| 8055 | AUCTIONS (ENCHÈRES) | ~300 | P2 |
| 8392 | LOYALTY PROGRAM | ~220 | P3 |
| 8615 | REFERRAL SYSTEM | ~120 | P3 |
| 9194 | FAIRE UNE OFFRE | ~220 | P2 |
| 9412 | LOTS DE PIÈCES | ~80 | P3 |
| 9921 | PUSH NOTIFICATIONS | ~180 | P2 |
| 10451 | **ADMIN PAYMENTS** | ~210 | **P1 - Important** |
| 10661 | ADMIN VENTES | ~220 | P1 |
| 10882 | ADMIN USERS | ~190 | P1 |
| 11192 | BOXTAL SHIPPING | ~960 | P1 |
| 12149 | WAREHOUSE | ~320 | P2 |

## Plan de Refactorisation (Approche Progressive)

### Phase 1 : Routes critiques (P0)
1. `routes/listings.py` - CRUD annonces, recherche, filtres
2. `routes/orders.py` - Commandes, livraison, tracking

### Phase 2 : Routes importantes (P1)  
3. `routes/stripe.py` - Paiements Stripe Connect
4. `routes/admin.py` - Administration (users, ventes, paiements)
5. `routes/messages.py` - Messagerie
6. `routes/boxtal.py` - API Boxtal shipping

### Phase 3 : Routes secondaires (P2)
7. `routes/favorites.py` - Favoris et wishlist
8. `routes/reviews.py` - Avis et notations
9. `routes/auctions.py` - Enchères
10. `routes/stats.py` - Statistiques
11. `routes/reports.py` - Signalements

### Phase 4 : Services et utilitaires (P3)
12. `services/cloudinary_service.py` - Upload images/vidéos
13. `services/stripe_service.py` - Logique Stripe
14. `services/notification_service.py` - Push notifications

## Comment Migrer une Section

### Étape 1 : Créer le nouveau fichier
```python
# routes/listings.py
from fastapi import APIRouter, Depends, HTTPException
from database import db
from utils.auth import get_current_user
from models import ListingCreate, ListingResponse

router = APIRouter(prefix="/listings", tags=["Listings"])

@router.get("/")
async def get_listings():
    # Code migré depuis server.py
    pass
```

### Étape 2 : Tester le nouveau module isolément
```bash
python -c "from routes.listings import router; print('OK')"
```

### Étape 3 : Inclure dans server.py
```python
from routes.listings import router as listings_router
app.include_router(listings_router, prefix="/api")
```

### Étape 4 : Commenter l'ancien code (ne pas supprimer)
```python
# MIGRÉ VERS routes/listings.py
# @api_router.get("/listings")
# async def get_listings():
#     ...
```

### Étape 5 : Tester en production
- Vérifier que les routes fonctionnent
- Vérifier les logs d'erreur
- Rollback si problème

## Notes Importantes

1. **NE PAS supprimer le code original** tant que le nouveau n'est pas validé
2. **Tester après chaque migration** de route
3. **Conserver la rétrocompatibilité** des URLs
4. **Éviter les imports circulaires** - utiliser des imports locaux si nécessaire
5. **Faire des commits réguliers** pour pouvoir rollback

## Estimation de Réduction

Après refactorisation complète :
- `server.py` : ~4000-5000 lignes (réduction de 60%)
- Modules extraits : ~15-20 fichiers
- Maintenabilité : +++++

## Statistiques Actuelles

- Lignes dans server.py : 12 472
- Modules créés : 10 (routes: 4, services: 3, utils: 1, models: 1, config: 1)
- Routes migrées : 2 (videos, radio)
- Prochaine migration : listings
