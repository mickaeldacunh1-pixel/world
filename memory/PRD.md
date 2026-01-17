# WorldAuto - Product Requirements Document

## Original Problem Statement
Plateforme marketplace automobile complète permettant l'achat/vente de véhicules et pièces détachées, avec fonctionnalités premium, notifications push, assistant IA (Tobi), système de parrainage, et gestion multi-pays.

## User Personas
- **Particuliers** : Achat/vente de véhicules et pièces
- **Professionnels** : Gestion de stock, annonces multiples, fonctionnalités PRO
- **Administrateur** : Personnalisation du site, gestion des utilisateurs

## Core Requirements
1. Système d'annonces avec catégories multiples
2. Paiement sécurisé (Stripe)
3. Messagerie intégrée
4. Notifications push
5. Assistant IA Tobi
6. Programme de fidélité/parrainage
7. Internationalisation (9 pays)
8. Personnalisation admin (Hero, Navbar)
9. Estimation des frais de livraison (Boxtal)
10. SEO optimisé (sitemap, meta tags)

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Integrations**: Stripe, Cloudinary, i18next, @dnd-kit, Boxtal API

---

## What's Been Implemented

### Session du 17 Janvier 2026

#### Phase 1 : Amélioration affichage mobile Hero
- Home.jsx - Barre de recherche et CTA responsive
- HeroFreePosition.jsx - Support mobile avec hook `useIsMobile()`
- Navbar.jsx - PromoBanner caché < 480px

#### Phase 2 : Éditeur mobile admin
- HeroFreePositionEditor.jsx - Toggle Desktop/Mobile, positions séparées

#### Phase 3 : Intégration Boxtal (frais de livraison)
- **ShippingEstimator.jsx** : Composant d'estimation des frais
  - Entrée code postal destination
  - Affiche Colissimo, Chronopost, Mondial Relay, DPD, GLS
  - Tri par prix, badge "MOINS CHER"
  - Sauvegarde du code postal en localStorage
- **Endpoint `/api/shipping/estimate`** :
  - Récupère les dimensions de l'annonce
  - Appelle l'API Boxtal en production
  - Applique la marge configurée (15%)
  - Fallback automatique si erreur API
- **Intégré dans ListingDetail.jsx**

#### Phase 4 : SEO Pre-rendering
- **Sitemap dynamique** (`/sitemap.xml`) :
  - Pages statiques avec priorités
  - Catégories (hourly)
  - Annonces actives (1000 max, triées par date)
- **Robots.txt** (`/robots.txt`) :
  - Bloque admin, profil, panier, paiement
  - Autorise annonces, vendeur, pages publiques
- **Meta tags enrichis** dans index.html :
  - OpenGraph complets (og:image, og:locale)
  - Twitter Card (summary_large_image)
  - Keywords SEO

### Fonctionnalités déjà complétées (sessions précédentes)
- ✅ Intégration Stock/Annonces
- ✅ Correction Notifications Push
- ✅ Restauration bouton Tobi
- ✅ Éditeur de Hero à positionnement libre
- ✅ Personnalisation Navbar admin
- ✅ Début internationalisation (i18next configuré)

---

## Prioritized Backlog

### P0 - Critique
- [ ] Résoudre problème de traduction i18n sur VPS utilisateur

### P1 - Important  
- [ ] Tester l'estimation Boxtal avec une vraie annonce en production
- [ ] Valider éditeur Hero mobile en production
- [ ] Traduire pages principales (Home, Pricing, FAQ)

### P2 - Normal
- [ ] Résoudre erreurs Docker récurrentes
- [ ] Améliorer performance sitemap pour gros volumes

### P3 - Futur
- [ ] Refactoring backend server.py (> 10k lignes)

---

## Key API Endpoints

### Nouveaux endpoints
- `POST /api/shipping/estimate` - Estimation frais de livraison
- `GET /sitemap.xml` - Sitemap dynamique SEO
- `GET /robots.txt` - Robots.txt SEO

### Endpoints existants
- `POST/GET /api/settings/hero` - Paramètres Hero
- `POST/GET /api/settings/navbar` - Paramètres Navbar
- `GET /api/boxtal/status` - Statut configuration Boxtal
- `POST /api/boxtal/quotes` - Devis complets Boxtal

## Files of Reference
- `/app/frontend/src/components/ShippingEstimator.jsx` (NOUVEAU)
- `/app/frontend/src/pages/ListingDetail.jsx` (MODIFIÉ)
- `/app/frontend/src/pages/Home.jsx`
- `/app/frontend/src/components/HeroFreePositionEditor.jsx`
- `/app/frontend/public/index.html` (META TAGS AMÉLIORÉS)
- `/app/backend/server.py` (ENDPOINTS SEO + SHIPPING)
