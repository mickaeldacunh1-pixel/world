# AutoPièces Marketplace - PRD

## Problem Statement
Créer un site de mise en relation style Opisto pour particuliers et professionnels, avec les mêmes tarifications que Opisto par annonces. Le site propose des pièces détachées, voitures d'occasion, motos, utilitaires et accessoires.

## User Personas
1. **Particulier Vendeur**: Vend occasionnellement des pièces ou véhicules
2. **Professionnel (Casse Auto)**: Vend régulièrement des pièces détachées  
3. **Concessionnaire**: Vend des véhicules d'occasion
4. **Acheteur**: Recherche des pièces ou véhicules à prix compétitifs

## Core Requirements
- Authentification classique (email/mot de passe)
- 5 catégories: Pièces Détachées, Voitures, Motos, Utilitaires, Accessoires
- Système de tarification par crédits/annonces
- Messagerie interne acheteur-vendeur
- Paiement Stripe (PayPal à intégrer)
- Thème clair professionnel

## What's Implemented (Décembre 2024)
### Backend (FastAPI + MongoDB)
- ✅ Authentification JWT (register, login, me)
- ✅ CRUD Annonces avec filtres (catégorie, prix, condition, recherche)
- ✅ Système de messagerie (conversations, messages)
- ✅ Tarification avec 4 packs (single 2€, pack5 8€, pack20 25€, unlimited 49€)
- ✅ Intégration Stripe checkout
- ✅ Dashboard stats API

### Frontend (React + TailwindCSS + Shadcn)
- ✅ Page d'accueil avec hero, recherche, catégories
- ✅ Page listing annonces avec filtres sidebar
- ✅ Page détail annonce avec contact vendeur
- ✅ Authentification (connexion + inscription particulier/pro)
- ✅ Page tarifs avec les 4 packs
- ✅ Tableau de bord vendeur avec stats
- ✅ Messagerie interne
- ✅ Création d'annonce

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Core user flows (auth, annonces, paiement)
- [x] Search and filters

### P1 (High Priority)
- [ ] Upload d'images (actuellement URLs uniquement)
- [ ] Intégration PayPal complète
- [ ] Notifications email

### P2 (Medium)
- [ ] Favoris/Wishlist
- [ ] Historique de paiements
- [ ] Modération annonces (admin)
- [ ] Boost/Mise en avant annonces

### P3 (Low)
- [ ] App mobile
- [ ] Alertes prix
- [ ] Statistiques avancées vendeur

## Tech Stack
- Backend: FastAPI, MongoDB, JWT, Stripe
- Frontend: React 19, TailwindCSS, Shadcn/UI, React Router
- Fonts: Chivo (headings), Inter (body)
- Colors: Primary #0F172A, Accent #F97316

## What's Implemented - Phase 2 (Janvier 2025)
### Sous-catégories Pièces Détachées (31 types)
- Moteur, Boîte de vitesse, Embrayage, Transmission, Turbo
- Carrosserie, Optiques, Rétroviseurs, Vitrage
- Freinage, Suspension, Direction, Roues/Pneus
- Électricité, Démarreur, Batterie, Climatisation, Capteurs, etc.

### Sous-catégories Accessoires (25 types)
- Jantes, Pneus, GPS/Navigation, Autoradio, Alarmes
- Caméras, Éclairage LED, Tapis, Housses
- Attelages, Porte-vélos, Accessoires bébé, etc.

### Système de Compatibilité Véhicule
- 61 marques automobiles (de Abarth à Volvo)
- Sélection multiple de marques compatibles
- Modèles compatibles (séparés par virgules)
- Années compatibles (format: 2015-2020)
- Référence OEM constructeur
- Référence équipementier

### Filtres Avancés
- Filtre par sous-catégorie (pièces et accessoires)
- Filtre par marque compatible
- Recherche par référence OEM

## Next Tasks
1. Ajouter l'upload d'images via un service cloud
2. Finaliser l'intégration PayPal
3. Ajouter les notifications par email
4. Système de modération admin
5. Recherche par immatriculation/VIN
