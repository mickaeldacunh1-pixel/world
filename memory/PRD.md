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

## Agent Cody (téléchargeable) — v4.0.0 (2026-06-02)
Fichiers : `/app/frontend/public/downloads/code-agent/` (agent.py, version.txt, README.md, .env.example).
Améliorations majeures de cette session :
- **Boucle agentique** : Cody lit les résultats de ses outils et enchaîne plusieurs étapes (max 8). Avant, le résultat était juste injecté dans le texte sans que le LLM ne le voie.
- **Streaming SSE** : endpoint `/api/chat/stream` (token par token) + UI mise à jour (curseur live, masquage du JSON d'outils via holdback).
- **Parsing d'outils fiabilisé** : analyseur à équilibrage d'accolades (gère le JSON imbriqué de write_file) ; dispatch unifié `_execute_tool`.
- **Nouveaux outils** : `edit_file` (search/replace ciblé), `git_command` (status/diff/log/commit/push/pull).
- **Modèles à jour** : gpt-5.4, gpt-5.4-mini, claude-sonnet-4-6, gemini-3.1-pro-preview (via emergentintegrations).
- **Nettoyage** : ~415 lignes de code mort supprimées ; URL d'auto-update → worldautofrance.com.
- Validé par py_compile + tests unitaires (extraction, edit_file, dispatch, résolution modèles) + tests E2E boucle agentique & streaming (runner simulé) + test SSE via Flask test_client.
- Backlog : générer `code-agent.zip` au build pour l'auto-update ; streaming natif pour clés OpenAI/Anthropic perso.
