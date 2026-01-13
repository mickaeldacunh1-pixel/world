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
- ✅ Paiement Stripe
- ✅ Upload images Cloudinary
- ✅ Radio intégrée
- ✅ Agent Cody (assistant IA)

### Transporteurs (v5.2.0 - 13 Jan 2026)
- ✅ Remise en main propre
- ✅ Colissimo
- ✅ Mondial Relay
- ✅ Chronopost
- ✅ Boxtal Multi-Transporteurs
- ✅ Autre transporteur

### Mon Entrepôt Pro (v5.2.0 - 13 Jan 2026)
- ✅ Gestion des sections
- ✅ Gestion des articles (CRUD)
- ✅ Statistiques (stock, valeur, alertes)
- ✅ Publication en 1 clic vers annonces
- ✅ Export CSV
- ✅ Réservé aux comptes PRO

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
- `/var/www/worldauto/frontend/src/App.js`
- `/var/www/worldauto/docker-compose.yml`

## Intégrations 3rd Party
- Cloudinary (images)
- Stripe (paiements)
- Boxtal (expédition)
- Mondial Relay
- emergentintegrations (IA)

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

## Backlog / Tâches Futures
- Intégration Boxtal complète (clés: Access `5DAZG2L2AVL5JUBMASPXJVBZXJY3Y0O0P09AY416`, Secret `a97a9989-227a-4997-a826-6bd8e0ffe712`)
- Amélioration du système d'enchères
- Notifications push

## Changelog
- **13 Jan 2026 (v5.2.0)**: Ajout 6 transporteurs + Mon Entrepôt Pro + Bouton Entrepôt dans Dashboard + FAQ/Nouveautés mises à jour
- **12 Jan 2026 (v5.1.0)**: Essai PRO automatique + Restriction vendeurs 9 pays
