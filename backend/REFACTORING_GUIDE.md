# Guide de Refactoring Backend

## État Actuel
Le fichier `server.py` contient ~7500 lignes de code. Il est fonctionnel mais nécessite une restructuration pour une meilleure maintenabilité.

## Structure Cible

```
/app/backend/
├── server.py          # Point d'entrée principal (FastAPI app)
├── config.py          # Configuration centralisée ✅
├── database.py        # Connexion MongoDB ✅
├── models/            # Modèles Pydantic
│   ├── __init__.py    ✅
│   ├── user.py        # UserCreate, UserUpdate, etc.
│   ├── listing.py     # ListingCreate, ListingUpdate
│   ├── order.py       # OrderCreate, etc.
│   └── ...
├── routes/            # Endpoints API
│   ├── __init__.py    ✅
│   ├── auth.py        # /api/auth/*
│   ├── listings.py    # /api/listings/*
│   ├── orders.py      # /api/orders/*
│   ├── payments.py    # /api/payments/*
│   ├── admin.py       # /api/admin/*
│   ├── ai.py          # /api/ai/*
│   └── ...
├── services/          # Logique métier
│   ├── email.py       # Service d'envoi d'emails
│   ├── stripe.py      # Intégration Stripe
│   ├── moderation.py  # Modération de contenu
│   └── ...
└── utils/             # Utilitaires
    ├── __init__.py    ✅
    ├── auth.py        # JWT, hashing
    └── helpers.py     # Fonctions diverses
```

## Sections dans server.py (Lignes approximatives)

| Section | Lignes | Description |
|---------|--------|-------------|
| EMAIL SERVICE | 55-500 | Templates et envoi d'emails |
| MODELS | 504-532 | Modèles Pydantic |
| CONTENT MODERATION | 533-960 | Filtrage de contenu |
| AUTH HELPERS | 960-1007 | JWT et helpers d'auth |
| AUTH ROUTES | 1007-1201 | Login, register, etc. |
| SIRET VERIFICATION | 1201-1305 | Vérification SIRET |
| PROFILE MANAGEMENT | 1305-1427 | Gestion profil |
| PASSWORD RESET | 1427-1490 | Reset mot de passe |
| LISTINGS ROUTES | 1490-1595 | CRUD annonces |
| IMAGE UPLOAD | 1595-1983 | Upload Cloudinary |
| FAVORITES | 1983-2033 | Favoris |
| SEARCH HISTORY | 2033-2105 | Historique recherche |
| SEARCH ALERTS | 2105-2222 | Alertes recherche |
| MESSAGES | 2222-2313 | Messagerie |
| CONFIANCE & GARANTIE | 2313-2488 | Confiance vendeurs |
| ORDERS & SHIPPING | 2488-2865 | Commandes et livraison |
| SELLER STATS | 2865-3001 | Statistiques vendeur |
| Q&A | 3001-3115 | Questions/Réponses |
| REVIEWS | 3115-3208 | Avis |
| WEBSOCKET CHAT | 3208-3392 | Chat temps réel |
| BUYER REVIEWS | 3392-3577 | Notation acheteurs |
| UPDATES (CHANGELOG) | 3577-3649 | Notes de version |
| NEWSLETTER | 3649-3882 | Newsletter |
| SETTINGS | 3882-3974 | Paramètres site |
| EMAIL TEST | 3974-4022 | Test email |
| EXTRA PHOTOS | 4022-4081 | Photos supplémentaires |
| SHIPPING | 4081-4327 | Expédition |
| PAYMENT | 4327-4597 | Paiements |
| STRIPE CONNECT | 4597-5036 | Marketplace Stripe |
| STATS | 5036-5113 | Statistiques |
| REPORTS | 5113-5265 | Signalements |
| AUTOEXPERT AI | 5265-5375 | Assistant IA |
| AI TOOLS | 5375-5493 | Outils IA |
| PLATE SCANNER | 5493-5542 | Scan plaque |
| DIAGNOSTIC IA | 5542-5792 | Diagnostic IA |
| AUCTIONS | 5792-5986 | Enchères |
| VIDEO CALL | 5986-6019 | Appel vidéo |
| LOYALTY PROGRAM | 6019-6242 | Fidélité |
| REFERRAL SYSTEM | 6242-6361 | Parrainage |
| PROMOTE/BOOST | 6361-6665 | Mise en avant |
| FAIRE UNE OFFRE | 6665-6883 | Négociation |
| LOTS DE PIÈCES | 6883-6965 | Lots |
| COMPTEUR LIVE | 6965-6989 | Compteur temps réel |
| RELANCE PANIER | 6989-7149 | Panier abandonné |
| WIDGET EMBARQUABLE | 7149-7205 | Widget externe |
| COUPONS | 7205-7392 | Codes promo |
| ROOT + MIDDLEWARE | 7392-7517 | App config finale |

## Priorité de Migration

1. **Phase 1** : Extraire `config.py` et `database.py` ✅
2. **Phase 2** : Extraire les modèles Pydantic
3. **Phase 3** : Extraire les services (email, moderation)
4. **Phase 4** : Migrer les routes progressivement

## Notes Importantes

- Tester après chaque modification
- Garder les imports synchronisés
- Ne pas casser les dépendances circulaires
- Utiliser `from database import db` pour l'accès BDD
