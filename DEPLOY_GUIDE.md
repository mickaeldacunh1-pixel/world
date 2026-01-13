# Guide de Déploiement WorldAuto

## 1. Cloner le projet
```bash
git clone https://github.com/VOTRE_REPO.git /var/www/worldauto
cd /var/www/worldauto
git checkout main
```

## 2. Créer le fichier backend/.env
```bash
nano backend/.env
```

Collez le contenu suivant :
```
MONGO_URL=mongodb://worldauto_admin:WA_Secure_2026!@mongodb:27017/test_database?authSource=admin
DB_NAME=test_database
CORS_ORIGINS=*
JWT_SECRET=autopieces-marketplace-secret-key-2024
CLOUDINARY_CLOUD_NAME=dmtnmaloe
CLOUDINARY_API_KEY=419444557498491
CLOUDINARY_API_SECRET=S9L4owos6Okd_9bFqo5R2keEbcU
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@worldautofrance.com
SMTP_PASSWORD=#8024#Et-20041003-Ar
SITE_URL=https://worldautofrance.com
NEWSLETTER_SECRET_KEY=WAF2026Secret1767620372
EMERGENT_LLM_KEY=sk-emergent-aDf9fBa54C9Be5691B
MONDIAL_RELAY_ENSEIGNE=CC23S7ZB
MONDIAL_RELAY_PRIVATE_KEY=5etShiYU
MONDIAL_RELAY_BRAND=CC
BOXTAL_ACCESS_KEY=5DAZG2L2AVL5JUBMASPXJVBZXJY3Y0O0P09AY416
BOXTAL_SECRET_KEY=worldauto-agent
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_ICI
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_ICI
```

Sauvegardez avec `Ctrl+O`, `Enter`, `Ctrl+X`

## 3. Lancer le build
```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

## 4. Créer les comptes utilisateurs
```bash
docker exec worldauto-backend python3 -c "
from passlib.context import CryptContext
pwd = CryptContext(schemes=['bcrypt'], deprecated='auto')
print('Hash1:', pwd.hash('Admin123!2'))
print('Hash2:', pwd.hash('Admin123!3'))
"
```

Puis avec les hash obtenus :
```bash
docker exec worldauto-mongodb mongosh -u worldauto_admin -p 'WA_Secure_2026!' --authenticationDatabase admin --eval '
db = db.getSiblingDB("test_database");

db.users.insertOne({
  id: "admin-001",
  email: "contact@worldautofrance.com",
  password: "HASH1_ICI",
  name: "Admin WorldAuto",
  phone: "",
  is_professional: true,
  is_active: true,
  credits: 1000,
  role: "admin"
});

db.users.insertOne({
  id: "pro-002",
  email: "2db.auto.service@gmail.com",
  password: "HASH2_ICI",
  name: "2DB Auto Service",
  phone: "",
  is_professional: true,
  is_active: true,
  credits: 100,
  role: "pro"
});
'
```

## 5. Vérifier que tout tourne
```bash
docker ps
docker logs worldauto-backend --tail 20
```

## Commandes utiles

**Redémarrer un service :**
```bash
docker-compose restart backend
```

**Voir les logs :**
```bash
docker logs worldauto-backend --tail 50
docker logs worldauto-frontend --tail 50
```

**Mise à jour du code :**
```bash
cd /var/www/worldauto
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
