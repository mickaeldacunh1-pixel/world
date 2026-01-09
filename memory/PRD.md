# World Auto Pro - PRD

## Description du Projet
Plateforme de vente de pièces automobiles avec assistant IA "Tobi", fonctionnalités avancées (mode sombre, PWA, vidéos, gamification), outils de fidélisation et panneau d'administration complet.

## Architecture
- **Frontend**: React (port 3000/80/443)
- **Backend**: FastAPI (port 8001)
- **Base de données**: MongoDB (127.0.0.1:27017 - sécurisé)
- **Hébergement**: VPS Hostinger

## Sécurité MongoDB
- ✅ Accès local uniquement (127.0.0.1)
- ✅ Authentification activée (user: worldauto_admin)
- ✅ Port 27017 non exposé publiquement
- ✅ docker-compose.yml mis à jour avec auth intégrée

## Session du 2026-01-09 - Accomplissements

### Nouvelles fonctionnalités implémentées (cette session)
- ✅ **Notifications Push** : 
  - Clés VAPID générées et configurées
  - API complète (subscribe, unsubscribe, status, test)
  - Envoi de push via pywebpush
  - Push automatiques sur nouveaux messages et commandes
  - Composant frontend PushNotificationManager dans le profil
  
- ✅ **Stories Vendeurs** :
  - API complète (create, view, delete, list)
  - Expiration automatique après 24h
  - Composant Stories type Instagram
  - Section visible sur la page d'accueil
  - **Page dédiée /stories** avec stats et interface de création
  - **Bouton Stories (Camera) dans la navbar** entre Messages et Profil
  - Support images et vidéos

- ✅ **Vérification d'identité** :
  - API complète (submit, status)
  - Interface admin pour approuver/rejeter (onglet Vérifications)
  - Composant IdentityVerification dans le profil
  - Upload de documents (ID recto/verso + selfie)

- ✅ **Historique des prix** :
  - API /api/listings/{id}/price-history
  - Affichage dans ListingDetail avec graphique

- ✅ **UI/UX Navbar** :
  - Sélecteur de langue déplacé à droite du panier
  - Bouton Stories ajouté entre Messages et Profil

### Session précédente
- ✅ **Lecteur Radio Configurable** : 14 stations françaises, gestion depuis l'admin
- ✅ **Crédits en attente** : Pré-distribuer des crédits avant inscription (prospection)
- ✅ **Amélioration aperçu admin** : Bannière orange, bouton recharger, lien site actuel
- ✅ **Options boutons avancées** : Disposition, alignement, taille, arrondi, espacement

### Corrections UI/UX
- ✅ Bouton "World Auto PRO" visible sur mobile/tablette
- ✅ Lien Emergent centré dans le footer
- ✅ Renommage "World Auto" → "World Auto Pro" (SEO, PWA, toutes pages)
- ✅ Bug admin identity APIs (403 pour admin) corrigé

## Commandes utiles VPS

### Ajouter crédits à un utilisateur existant
```bash
docker exec -i worldauto-mongodb mongosh -u worldauto_admin -p 'WA_Secure_2026!' --authenticationDatabase admin worldauto --eval 'db.users.updateOne({email: "EMAIL"}, {$inc: {credits: 5}})'
```

### Ajouter crédits en attente (prospection)
```bash
cat > /tmp/add_pending.js << 'EOF'
use worldauto
db.pending_credits.insertOne({email: "EMAIL", credits: 5, created_at: new Date().toISOString()})
EOF
docker exec -i worldauto-mongodb mongosh -u worldauto_admin -p 'WA_Secure_2026!' --authenticationDatabase admin < /tmp/add_pending.js
```

### Changer clé Stripe
```bash
nano /var/www/worldauto/backend/.env
docker restart worldauto-backend
```

## Backlog
### P1
- Intégration API Colissimo (en attente clés)
- Intégration API SIV (en attente décision)

### P2
- Interface admin pour gérer les crédits en attente

## Collections MongoDB ajoutées
- `push_subscriptions` : Abonnements push (user_id, subscription, preferences)
- `notifications` : Historique des notifications envoyées
- `stories` : Stories des vendeurs (media_url, type, caption, views, created_at)
- `story_views` : Vues des stories (story_id, user_id)
- `identity_verifications` : Demandes de vérification d'identité
- `price_history` : Historique des changements de prix

## Credentials Production
- MongoDB: worldauto_admin / WA_Secure_2026!
- Admin: contact@worldautofrance.com / Admin123!
- Test user: storiestest@test.com / test123456
