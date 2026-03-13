# World Auto France - Product Requirements Document

## Overview
Marketplace de pièces automobiles et véhicules d'occasion (React/FastAPI/MongoDB).

**URL Production**: https://worldautofrance.com

## Architecture
- **Frontend**: React avec Nginx (Docker)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Media**: Cloudinary
- **Paiements**: Stripe
- **Livraison**: Boxtal, Mondial Relay

## Statut Actuel - 27 Février 2026

### ✅ Résolu cette session
1. **Bug critique** : Site inaccessible (Error 111) - CORRIGÉ
   - Cause: Configuration Nginx avec résolution DNS statique du backend
   - Solution: Variable `$backend_upstream` avec resolver Docker `127.0.0.11`

2. **reCAPTCHA** : Réactivé et fonctionnel
   - Code décommenté dans `server.py`
   - `RECAPTCHA_ENABLED=true` dans `.env`

3. **Compteurs sur filtres** : Implémenté
   - Nouvel endpoint `/api/listings/filter-counts`
   - Affichage "(X)" à côté des options de filtres

4. **Hero Desktop/Mobile séparé** : Implémenté
   - Nouvelle option `hero_free_position_desktop_only`
   - Mode libre sur Desktop, mode standard sur Mobile
   - À déployer avec `wabuild`

### 🔶 En attente
- Page Facebook : Compte trop récent, attendre 3-7 jours

### 📋 Backlog (P2)
- Refactorisation de `server.py`

## Intégrations Tierces
- Boxtal (Livraison)
- Stripe (Paiements)
- Cloudinary (Médias)
- Mondial Relay (Points relais)
- Google Ads (Suivi conversions)
- Google reCAPTCHA v3 (Sécurité inscription)

## Fichiers Clés Modifiés
- `/frontend/nginx.conf` - Configuration proxy avec resolver Docker
- `/backend/server.py` - Endpoint filter-counts, reCAPTCHA actif
- `/frontend/src/pages/Home.jsx` - Hook useIsMobile, logique Hero
- `/frontend/src/pages/Listings.jsx` - Affichage compteurs filtres
- `/frontend/src/components/HeroFreePositionEditor.jsx` - Option desktop only

## Notes Techniques
- Resolver DNS Docker interne : `127.0.0.11`
- Commande déploiement : `wabuild` ou `docker-compose down && docker-compose up -d --build`
- Ne pas utiliser `docker-compose restart` seul (ne rebuild pas les images)
