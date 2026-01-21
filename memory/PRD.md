# World Auto Pro - PRD (Product Requirements Document)

## Projet
Marketplace automobile full-stack pour l'achat/vente de pièces détachées, véhicules et accessoires.

## Stack Technique
- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Déploiement**: Docker Compose sur VPS Hostinger (4Go RAM, 1 CPU + 2Go swap)

## Fonctionnalités Principales

### Authentification & Utilisateurs
- Inscription/Connexion JWT
- Rôles: user, seller, admin, pro
- Profil utilisateur avec adresse, téléphone, IBAN

### Annonces
- CRUD complet
- Upload images Cloudinary
- Catégories multiples (pièces, voitures, motos, utilitaires, accessoires)
- Statuts: active, reserved, sold, draft

### Paiements
- **Stripe Direct**: Paiement CB via compte plateforme
- **Stripe Connect**: Paiement direct au vendeur
- **Contact Direct**: Réservation + paiement hors plateforme
- Commission: 5% (min 0.50€, max 15€)
- Reversements: 2x/mois (1er et 15)
- Page Admin `/admin/ventes` pour gestion

### Livraison
- Remise en main propre
- Colissimo, Chronopost
- **Mondial Relay**: Widget jQuery (Code: CC23S7ZB)
- **Boxtal**: API multi-transporteurs (mode simulation actif, production en attente)

### Crédits & Abonnements
- Crédits offerts à l'inscription: **expirent après 30 jours**
- Crédits achetés: **n'expirent pas**
- Packs: 1 à 100 crédits
- Abonnements Pro: Mensuel (30 crédits) à Annuel (500 crédits)

### Assistant IA "Tobi"
- Chat IA sécurisé (auth requise)
- Accès conditionné par crédits ou annonce active

### Internationalisation
- i18next / react-i18next
- FR, EN supportés

### Hero Section
- Mode standard et mode "position libre" (drag & drop)
- Vidéo de fond optionnelle
- Lecteur vidéo promo positionnable

## Intégrations 3rd Party
- Stripe (paiements)
- Cloudinary (images/vidéos)
- Mondial Relay (points relais)
- Boxtal (multi-transporteurs) - EN ATTENTE PRODUCTION
- Google reCAPTCHA v3
- Emergent LLM Key (Tobi)

---

## Changelog

### 2026-01-20
- ✅ Crédits offerts expirent après 30 jours
- ✅ FAQ mise à jour (Stripe Direct, reversements, expiration crédits)
- ✅ Sitemap Content-Type corrigé (application/xml)
- ✅ Forfait Vidéo Étendue 1€ ajouté au backend
- ✅ Route modification annonce corrigée
- ✅ Scroll pagination corrigé
- ✅ Estimation livraison corrigée (ID string vs ObjectId)
- ✅ Boutons pricing traductions corrigées
- ⏳ Boxtal: ticket support ouvert (erreur 502)

### 2026-01-19
- ✅ Lecteur vidéo promo Hero (déplaçable)
- ✅ Espace blanc Hero corrigé
- ✅ Mondial Relay CSP corrigée
- ✅ Boxtal mode simulation fonctionnel
- ✅ Webhook Boxtal créé
- ✅ Swap 2Go ajouté au VPS
- ✅ .gitignore nettoyé

---

## Backlog

### P0 - Critique
- ⏳ Boxtal mode production (attente réponse support)

### P1 - Important
- Traduction pages: `About.jsx`, `Newsletter.jsx`, `FAQ.jsx` interface
- Bouton upload Cloudinary pour vidéos promo

### P2 - Amélioration
- Reversements automatiques programmés
- Traduire pages admin et légales
- Refactoriser `server.py` (>10000 lignes)

---

## Architecture Fichiers Clés

```
/app/
├── backend/
│   ├── server.py          # API FastAPI principale
│   └── .env               # Config (MONGO_URL, STRIPE_KEY, BOXTAL_*, etc.)
├── frontend/
│   ├── public/index.html  # Scripts jQuery/MR
│   ├── nginx.conf         # Config nginx avec CSP
│   ├── src/
│   │   ├── components/
│   │   │   ├── HeroFreePosition.jsx
│   │   │   ├── HeroFreePositionEditor.jsx
│   │   │   ├── MondialRelayPicker.jsx
│   │   │   └── BoxtalPicker.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── FAQ.jsx
│   │   │   ├── Listings.jsx
│   │   │   └── AdminSales.jsx
│   │   └── i18n/locales/
│   └── .env               # REACT_APP_BACKEND_URL
├── docker-compose.yml
└── wabuild.sh
```

## Credentials Production (VPS)
- Mondial Relay: Code Enseigne `CC23S7ZB`, Clé `5etShiYU`
- Boxtal: App ID `app-7f579a44-ed18-40a6-8feb-b924396302d2`
- Stripe: Clé dans `backend/.env`

## Commande de déploiement
```bash
cd /var/www/worldauto && git pull origin main && docker-compose up -d --build --remove-orphans
```
