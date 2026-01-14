# World Auto France - PRD (Product Requirements Document)

## Problème Original
Site de type "Opisto" pour la vente de pièces automobiles - Marketplace complète pour particuliers et professionnels.

## URL Production
https://worldautofrance.com

## Comptes
| Email | Mot de passe | Statut |
|-------|--------------|--------|
| contact@worldautofrance.com | Admin123!2 | Admin |
| 2db.auto.service@gmail.com | Admin123!2 | PRO ✅ |

## Fonctionnalités Implémentées

### Core
- ✅ Authentification (JWT)
- ✅ Création/gestion d'annonces
- ✅ Messagerie entre utilisateurs
- ✅ Paiement Stripe Connect
- ✅ **Paiement IBAN direct** (nouveau v5.3)
- ✅ Upload images Cloudinary
- ✅ Radio intégrée
- ✅ Agent Tobi (assistant IA)

### Transporteurs (v5.2.0)
- ✅ Remise en main propre
- ✅ Colissimo
- ✅ Mondial Relay
- ✅ Chronopost
- ✅ Boxtal Multi-Transporteurs
- ✅ Autre transporteur

### Mon Entrepôt Pro (v5.2.0)
- ✅ Gestion des sections
- ✅ Gestion des articles (CRUD)
- ✅ Statistiques (stock, valeur, alertes)
- ✅ Publication en 1 clic vers annonces
- ✅ Export CSV
- ✅ Réservé aux comptes PRO

### Paiements (v5.3.0)
- ✅ Option IBAN direct (comme eBay)
- ✅ Option Stripe Connect (dashboard complet)
- ✅ Validation IBAN avec checksum mod-97
- ✅ Stockage sécurisé des coordonnées bancaires

### Photos Mobile (v5.3.0)
- ✅ Support HEIC/HEIF (iPhone/iPad)
- ✅ Correction automatique orientation EXIF
- ✅ Conversion auto en JPG

### Catégories (v5.3.0)
- ✅ Vignette "Recherche" sur page d'accueil
- ✅ Vignette "Rare & Collection" sur page d'accueil

### Système Promo LANCEMENT
- ✅ Code: LANCEMENT
- ✅ 20 annonces gratuites par utilisateur
- ✅ Limite globale: 1000 annonces
- ✅ Décompte automatique

### Essai PRO (Professionnels)
- ✅ 10 crédits offerts à l'inscription
- ✅ 14 jours d'accès PRO
- ✅ Jusqu'à 50 photos par annonce
- ✅ Cumulable avec code LANCEMENT (= 30 annonces)

### Pays Autorisés (Vendeurs)
France, Belgique, Suisse, Allemagne, Pays-Bas, Italie, Espagne, Portugal, Suède

## Architecture Technique

### Stack
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI (Python)
- Database: MongoDB
- Déploiement: Docker-Compose sur VPS Hostinger

### Fichiers Clés
- `/var/www/worldauto/backend/server.py`
- `/var/www/worldauto/frontend/src/pages/CreateListing.jsx`
- `/var/www/worldauto/frontend/src/pages/Warehouse.jsx`
- `/var/www/worldauto/frontend/src/pages/Profile.jsx`
- `/var/www/worldauto/frontend/src/App.js`

## Intégrations 3rd Party
- Cloudinary (images)
- Stripe (paiements)
- Boxtal (expédition)
- Mondial Relay
- emergentintegrations (IA - Tobi)

## Clés API
- EMERGENT_LLM_KEY: sk-emergent-aDf9fBa54C9Be5691B
- Boxtal Access: 5DAZG2L2AVL5JUBMASPXJVBZXJY3Y0O0P09AY416
- Boxtal Secret: a97a9989-227a-4997-a826-6bd8e0ffe712

## Procédure de Restauration VPS

```bash
cd /var/www/worldauto && git fetch origin && git reset --hard origin/code-agent-v && sed -i '/emergentintegrations/d' backend/requirements.txt && sed -i 's/yarn install --frozen-lockfile/yarn install/' frontend/Dockerfile && cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
EOF
docker-compose down && docker-compose up -d --build
```

## Changelog
- **14 Jan 2026 (v5.3.0)**: Option paiement IBAN + Support photos HEIC + Catégories Recherche/Rare + FAQ mise à jour
- **13 Jan 2026 (v5.2.0)**: 6 transporteurs + Mon Entrepôt Pro + Bouton Entrepôt + Tobi assistant IA
- **12 Jan 2026 (v5.1.0)**: Essai PRO automatique + Restriction vendeurs 9 pays

## Backlog / Tâches Futures
- Intégration Boxtal complète (calcul frais en temps réel)
- Amélioration du système d'enchères
- Notifications push

### Sécurité Renforcée (v5.4.0) - 14 Janvier 2026

#### Rate Limiting
- ✅ Login : Max 5 tentatives/minute, blocage 15 min après 5 échecs
- ✅ Register : Max 3 inscriptions/minute par IP
- ✅ Forgot Password : Max 3 demandes/minute
- ✅ Reset Password : Max 5 tentatives/minute
- ✅ Blocage automatique des IPs suspectes (score > 10)
- ✅ Détection des bots malveillants (sqlmap, nikto, etc.)

#### Double Authentification (2FA)
- ✅ Méthode TOTP (Google Authenticator)
- ✅ Méthode Email OTP (code par email)
- ✅ Codes de secours (8 codes pour TOTP)
- ✅ Activation optionnelle par l'utilisateur
- ✅ Interface complète dans Profil > Mot de passe
- ✅ Support au login avec gestion des 2 méthodes

#### reCAPTCHA v3 (Préparé)
- ✅ Infrastructure backend prête
- ⏳ Configuration des clés Google à faire
- Variables d'environnement : RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY, RECAPTCHA_ENABLED

#### Endpoints Admin Sécurité
- GET /api/admin/security/status - Voir IPs bloquées et stats
- POST /api/admin/security/block/{ip} - Bloquer manuellement
- POST /api/admin/security/unblock/{ip} - Débloquer une IP
- GET /api/security/config - Config publique (reCAPTCHA)

### Boxtal
- ✅ Mode Production activé (était en simulation)

### Radio
- ✅ CSP corrigée (media-src avec https: et http:)

