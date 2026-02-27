# World Auto France - Product Requirements Document

## Overview
Marketplace de pièces automobiles d'occasion avec fonctionnalités e-commerce complètes.

**URL Production**: https://worldautofrance.com

## Architecture
- **Frontend**: React avec Nginx (Docker)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Media**: Cloudinary
- **Paiements**: Stripe
- **Livraison**: Boxtal, Mondial Relay

## Statut Actuel

### ✅ Résolu (27 Février 2026)
- **Bug critique**: Site inaccessible (Error 111) - CORRIGÉ
  - Cause: Configuration Nginx avec résolution DNS statique du backend
  - Solution: Utilisation de variable `$backend_upstream` avec résolution dynamique DNS Docker (`127.0.0.11`)
  - Fichier modifié: `/frontend/nginx.conf`

### 🔶 À faire (P1)
- Réactiver reCAPTCHA (actuellement désactivé dans `server.py`)

### 📋 Backlog (P2)
- Ajouter compteurs sur les filtres (ex: "Diesel (15)")
- Refactorisation de `server.py`

## Intégrations Tierces
- Boxtal (Livraison)
- Stripe (Paiements)
- Cloudinary (Médias)
- Mondial Relay (Points relais)
- Google Ads (Suivi conversions)
- Google reCAPTCHA (désactivé temporairement)

## Fichiers Clés
- `/frontend/nginx.conf` - Configuration proxy Nginx
- `/backend/server.py` - API FastAPI principale
- `/docker-compose.yml` - Orchestration Docker

## Notes Techniques
- Le resolver DNS Docker interne est `127.0.0.11`
- Utiliser `docker-compose down && docker-compose up -d --build` pour les rebuilds complets
- Ne pas utiliser `docker-compose restart` seul car ça ne rebuild pas les images
