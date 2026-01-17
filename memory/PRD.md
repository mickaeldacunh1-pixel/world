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

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Integrations**: Stripe, Cloudinary, i18next, @dnd-kit

---

## What's Been Implemented

### Session du 17 Janvier 2026 - Amélioration Mobile Hero + Éditeur Mobile

#### Phase 1 : Amélioration affichage mobile
1. **Home.jsx** - Barre de recherche et CTA responsive
   - Recherche compacte sur mobile (bouton "OK")
   - Catégorie et vocal sur même ligne
   - Scanner de plaque caché < 640px
   - Boutons secondaires cachés sur mobile

2. **HeroFreePosition.jsx** - Refactoring complet
   - Hook `useIsMobile()` 
   - Positions par défaut mobile optimisées
   - Support `hero_element_positions_mobile`
   - Mode compact automatique sur mobile

3. **Navbar.jsx** - PromoBanner caché < 480px

4. **index.js** - ServiceWorker limité à production

#### Phase 2 : Éditeur mobile admin
5. **HeroFreePositionEditor.jsx** - Nouvel éditeur avec support mobile
   - Toggle Desktop/Mobile
   - Canvas 9:16 pour mobile, 16:9 pour desktop
   - Positions séparées `hero_element_positions` et `hero_element_positions_mobile`
   - Bouton "Copier Desktop vers Mobile"
   - Visibilité par défaut différente (scanner, premium masqués sur mobile)
   - Sauvegarde des deux configurations ensemble

### Fonctionnalités déjà complétées (sessions précédentes)
- ✅ Intégration Stock/Annonces
- ✅ Correction Notifications Push
- ✅ Restauration bouton Tobi
- ✅ Éditeur de Hero à positionnement libre
- ✅ Personnalisation Navbar admin
- ✅ Début internationalisation (i18next configuré)
- ✅ Page de présentation commerciale

---

## Prioritized Backlog

### P0 - Critique
- [ ] Résoudre problème de traduction i18n sur VPS utilisateur
  - Vérifier que les commits sont bien déployés
  - Tester les pages modifiées localement

### P1 - Important  
- [ ] Tester éditeur Hero position libre mobile en production
- [ ] Traduire pages principales (Home, Pricing, FAQ)

### P2 - Normal
- [ ] Résoudre erreurs Docker récurrentes lors des déploiements
- [ ] Intégration complète Boxtal (frais livraison temps réel)

### P3 - Futur
- [ ] Solution pre-rendering SEO
- [ ] Refactoring backend server.py (> 10k lignes)

---

## Key API Endpoints
- `POST/GET /api/settings/hero` - Paramètres Hero (inclut `hero_element_positions` et `hero_element_positions_mobile`)
- `POST/GET /api/settings/navbar` - Paramètres Navbar
- `GET /api/categories/stats` - Stats par catégorie
- `GET /api/listings` - Liste des annonces

## Known Issues
1. **Traduction i18n** - Perçue comme non fonctionnelle car beaucoup de pages restent en texte dur
2. **Déploiement Docker** - Erreurs récurrentes sur VPS utilisateur

## Files of Reference
- `/app/frontend/src/pages/Home.jsx`
- `/app/frontend/src/components/HeroFreePosition.jsx`
- `/app/frontend/src/components/HeroFreePositionEditor.jsx` (MISE À JOUR)
- `/app/frontend/src/components/Navbar.jsx`
- `/app/frontend/src/pages/AdminSettings.jsx`
- `/app/frontend/src/i18n/` (configuration traduction)
- `/app/frontend/tailwind.config.js`
