# World Auto Pro - PRD

## Original Problem Statement
Application marketplace de pièces automobiles avec fonctionnalités avancées : annonces, messagerie, paiements Stripe, assistant IA, livraison multi-transporteurs, système de radio intégré.

## Core Requirements
- Marketplace d'annonces auto (création, recherche, filtres)
- Authentification utilisateur (particuliers/professionnels)
- Système de crédits pour publier des annonces
- Paiements sécurisés via Stripe Connect
- Messagerie entre acheteurs/vendeurs
- Support multilingue (8 langues)

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, i18next
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Payments**: Stripe
- **Media**: Cloudinary

## What's Been Implemented

### Traductions (Janvier 2025)
- ✅ `Home.jsx` - Page d'accueil
- ✅ `Listings.jsx` - Liste des annonces
- ✅ `Auth.jsx` - Authentification
- ✅ `ListingDetail.jsx` - Détail d'annonce
- ✅ `CreateListing.jsx` - Création d'annonce
- ✅ `Dashboard.jsx` - Tableau de bord
- ✅ `Profile.jsx` - Profil utilisateur
- ✅ `Pricing.jsx` - Tarifs
- ✅ 8 fichiers de langues (fr, en, de, es, it, nl, pt, sv)

### Fonctionnalités récentes
- ✅ Lecteur radio avec 4 nouvelles stations + mode mini
- ✅ Page admin paiements (`/admin/paiements`)
- ✅ Correction SEO sitemap/robots.txt
- ✅ Bouton téléchargement page présentation

## Prioritized Backlog

### P0 (Haute priorité)
- [ ] Traduire `Contact.jsx`
- [ ] Traduire `FAQ.jsx`

### P1 (Moyenne priorité)
- [ ] Traduire `About.jsx`
- [ ] Traduire `Newsletter.jsx`

### P2 (Basse priorité)
- [ ] Traduire pages légales (CGV, LegalNotice, ReturnsPolicy)
- [ ] Refactoriser `server.py` (monolithe)
- [ ] Améliorer processus déploiement Docker

## Known Issues
- Processus de déploiement Docker parfois instable sur VPS utilisateur
- Erreurs Sentry "Network Error AxiosError" (à investiguer)

## 3rd Party Integrations
- Stripe (Paiements)
- Cloudinary (Images)
- Boxtal, Mondial Relay, Colissimo, Chronopost (Livraison)
- Emergent LLM Key (Assistant Tobi)
- Google reCAPTCHA v3
- i18next & react-i18next (Traduction)
