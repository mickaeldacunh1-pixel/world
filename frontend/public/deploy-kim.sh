#!/bin/bash

# ============================================
# 🤖 KIM Agent - Script de déploiement complet
# Domaine: agent.worldautofrance.com
# ============================================

set -e

DOMAIN="agent.worldautofrance.com"
EMAIL="contact@worldautofrance.com"
INSTALL_DIR="/var/www/kim-agent"
EMERGENT_KEY="sk-emergent-aDf9fBa54C9Be5691B"

echo "🤖 ======================================"
echo "   KIM Agent - Déploiement Automatique"
echo "   Domaine: $DOMAIN"
echo "========================================"
echo ""

# Vérifier si root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Exécutez en tant que root: sudo bash deploy-kim.sh"
    exit 1
fi

# 1. Mise à jour système
echo "📦 [1/10] Mise à jour du système..."
apt update && apt upgrade -y

# 2. Installer les dépendances
echo "📦 [2/10] Installation des dépendances..."
apt install -y python3 python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx curl wget gnupg

# 3. Installer MongoDB
echo "📦 [3/10] Installation de MongoDB..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt update
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    echo "✅ MongoDB installé"
else
    echo "✅ MongoDB déjà installé"
fi

# 4. Installer Yarn
echo "📦 [4/10] Installation de Yarn..."
npm install -g yarn

# 5. Créer le dossier et copier les fichiers
echo "📁 [5/10] Création du dossier d'installation..."
mkdir -p $INSTALL_DIR
cp -r /tmp/kim-agent/kim-agent-deploy/* $INSTALL_DIR/
cd $INSTALL_DIR

# 6. Configurer le Backend
echo "⚙️ [6/10] Configuration du Backend..."
cd $INSTALL_DIR/backend

# Créer .env backend
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=kim_agent
CORS_ORIGINS=https://$DOMAIN
EMERGENT_LLM_KEY=$EMERGENT_KEY
EOF

# Créer environnement Python et installer dépendances
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo "✅ Backend configuré"

# 7. Configurer le Frontend
echo "⚙️ [7/10] Configuration du Frontend..."
cd $INSTALL_DIR/frontend

# Créer .env frontend
cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN/api
EOF

# Installer dépendances et build
yarn install
yarn build

echo "✅ Frontend configuré et buildé"

# 8. Créer le service systemd
echo "🔧 [8/10] Création du service systemd..."
cat > /etc/systemd/system/kim-agent.service << EOF
[Unit]
Description=KIM Agent Backend
After=network.target mongod.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/venv/bin"
ExecStart=$INSTALL_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Permissions
chown -R www-data:www-data $INSTALL_DIR

systemctl daemon-reload
systemctl enable kim-agent
systemctl start kim-agent

echo "✅ Service kim-agent créé et démarré"

# 9. Configurer Nginx
echo "🌐 [9/10] Configuration de Nginx..."
cat > /etc/nginx/sites-available/kim-agent << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        root $INSTALL_DIR/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kim-agent /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "✅ Nginx configuré"

# 10. Certificat SSL
echo "🔒 [10/10] Installation du certificat SSL..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo ""
echo "🎉 ======================================"
echo "   INSTALLATION TERMINÉE !"
echo "========================================"
echo ""
echo "🌐 URL: https://$DOMAIN"
echo ""
echo "📋 Commandes utiles:"
echo "   - Voir les logs: journalctl -u kim-agent -f"
echo "   - Redémarrer: systemctl restart kim-agent"
echo "   - Status: systemctl status kim-agent"
echo ""
echo "⚠️  IMPORTANT: Ajoutez un enregistrement DNS A"
echo "    $DOMAIN → IP de ce serveur"
echo ""
