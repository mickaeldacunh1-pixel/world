# World Auto Pro - PRD (Product Requirements Document)

## Projet
Marketplace automobile full-stack pour l'achat/vente de pièces détachées, véhicules et accessoires.

## Stack Technique
- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Déploiement**: Docker Compose sur VPS

## Fonctionnalités Principales

### Authentification & Utilisateurs
- Inscription/Connexion JWT
- Rôles: user, seller, admin
- Profil utilisateur avec adresse, téléphone

### Annonces
- CRUD complet
- Upload images Cloudinary
- Catégories multiples (pièces, voitures, motos, utilitaires, accessoires)
- Statuts: active, reserved, sold, draft

### Paiements
- **Stripe Direct**: Paiement CB via compte plateforme (pour tous)
- **Contact Direct**: Réservation + paiement hors plateforme
- Page Admin `/admin/ventes` pour gestion commissions et reversements

### Livraison
- Remise en main propre
- Colissimo, Chronopost
- **Mondial Relay**: Widget jQuery intégré (Code Enseigne: CC23S7ZB)
- **Boxtal**: API multi-transporteurs (credentials en DB `site_settings`)

### Assistant IA "Tobi"
- Chat IA pour aide à l'achat
- Accès sécurisé (auth requise + crédits ou annonce active)
- Utilise Emergent LLM Key

### Internationalisation
- i18next / react-i18next
- FR, EN supportés
- Traductions dans `/frontend/src/i18n/locales/`

### Hero Section
- Mode standard et mode "position libre" (drag & drop)
- Vidéo de fond optionnelle
- Lecteur vidéo promo positionnable
- Personnalisation complète depuis Admin

## Intégrations 3rd Party
- Stripe (paiements)
- Cloudinary (images/vidéos)
- Mondial Relay (points relais)
- Boxtal (multi-transporteurs)
- Google reCAPTCHA v3
- Emergent LLM Key (Tobi)

---

## Changelog

### 2025-01-19
- ✅ Corrigé bug vidéo Hero (image de fond supprimée)
- ✅ Corrigé chargement Mondial Relay (scripts jQuery sans defer)
- ✅ Boxtal lit maintenant les credentials depuis MongoDB
- ✅ Nettoyé `.gitignore` corrompu (500+ lignes doublons)
- ✅ Nouvel endpoint `/api/admin/boxtal/credentials`

### Sessions précédentes
- ✅ Sécurisation assistant Tobi
- ✅ Paiement Stripe Direct (compte plateforme)
- ✅ Page Admin Ventes avec gestion reversements
- ✅ Composants MondialRelayPicker et BoxtalPicker
- ✅ Traduction Home.jsx et Contact.jsx
- ✅ Docker healthchecks pour déploiement

---

## Backlog

### P0 - Critique
- ⏳ Tester déploiement VPS après corrections

### P1 - Important
- Terminer traduction: `About.jsx`, `Newsletter.jsx`, `FAQ.jsx`
- Bouton upload Cloudinary pour vidéos promo

### P2 - Amélioration
- Traduire pages admin et légales
- Refactoriser `server.py` (>10000 lignes)
- Automatiser reversements vendeurs

---

## Architecture Fichiers Clés

```
/app/
├── backend/
│   ├── server.py          # API FastAPI principale
│   └── .env               # Config (MONGO_URL, STRIPE_KEY, etc.)
├── frontend/
│   ├── public/index.html  # Scripts jQuery/MR
│   ├── src/
│   │   ├── components/
│   │   │   ├── HeroFreePosition.jsx
│   │   │   ├── MondialRelayPicker.jsx
│   │   │   └── BoxtalPicker.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Checkout.jsx
│   │   │   └── AdminSales.jsx
│   │   └── i18n/locales/
│   └── .env               # REACT_APP_BACKEND_URL
├── docker-compose.yml
└── wabuild.sh
```

## Credentials Production (VPS)
- Mondial Relay: Code Enseigne `CC23S7ZB`
- Boxtal: Credentials stockés dans MongoDB `site_settings`
- Stripe: Clé dans `backend/.env`
