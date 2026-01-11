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

- ✅ **Commission hybride optimisée** :
  - Formule : 5% avec minimum 1,50€ et maximum 15€
  - API /api/commission/calculate pour simuler
  - Appliquée aux ventes Stripe et enchères
  - Documentation mise à jour (FAQ, Profil)
  - **Simulateur de commission** intégré dans CreateListing et EditListing

- ✅ **Tableau de bord Ventes** :
  - Onglet "💰 Ventes" avec 4 cartes de statistiques
  - Graphique d'évolution des revenus sur 6 mois
  - Explication détaillée de la commission
  - **Export PDF comptabilité** : relevé complet pour la comptabilité

- ✅ **Mise à jour FAQ** :
  - Nouvelles sections : Notifications Push, Stories Vendeurs, Vérification d'identité, Tableau de bord Ventes
  - Question sur la commission mise à jour avec formule hybride

- ✅ **Mise à jour page Nouveautés** :
  - v4.0.0 : Tableau de bord Ventes & Export PDF
  - v3.9.0 : Commission hybride optimisée
  - v3.8.0 : Stories Vendeurs & Vérification d'identité
  - v3.7.0 : Notifications Push

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
- ✅ **Traduction page Nouveautés (Updates.jsx)** : Interface entièrement multilingue (8 langues : FR, EN, DE, ES, IT, NL, PT, SV) avec dates formatées selon la locale
- ✅ **Bouton Messages déplacé** à droite du sélecteur de langue

## Session du 2026-01-11 - Boutons Premium Hero Editor & Personnalisation Cody & Éditeur Pages

### Corrections et améliorations rapides (2026-01-11)
- ✅ **Boutons Premium activés** : CTA3 et CTA4 activés dans la base de données
- ✅ **Aperçu live amélioré** : Affichage des boutons CTA1-4 dans l'aperçu admin avec couleurs personnalisées
- ✅ **Message d'aperçu amélioré** : Nouvelle bannière avec explication claire (🔴 Aperçu en temps réel)
- ✅ **Page Nouveautés mise à jour** : Ajout v4.5.0, v4.6.0, v4.7.0 avec toutes les nouvelles fonctionnalités

### Hero Editor - Boutons Premium (P0) ✅
- ✅ **CTA3 (Bouton Premium 1)** : Nouveau bouton entièrement configurable
  - Icône, texte, lien, style (plein/contour/transparent)
  - Taille, arrondi, couleurs (fond, texte, bordure)
  - Effets hover : Aucun, Agrandir (scale), Brillance (glow), Vibration (shake)
  - Bordure dorée distinctive dans l'admin (⭐)
- ✅ **CTA4 (Bouton Premium 2)** : Identique à CTA3
- ✅ **Rendu dans Home.jsx** : Les boutons s'affichent dans le Hero quand activés
- ✅ **Tests passés** : 18/18 (100%)

### Personnalisation Agent Cody (P1) ✅
- ✅ **Nouvel onglet Admin "Agent Cody"** avec icône 🤖
  - Nom de l'agent personnalisable
  - Mode de thème : Clair / Sombre / Système
  - 8 couleurs mode clair + 5 couleurs mode sombre
  - 8 thèmes prédéfinis
  - Typographie : police et taille
  - Options : sons, emojis, animations
  - Export JSON pour cody_config.json
  - Aperçu live du thème
- ✅ **Cody v2.2.0** : Charge automatiquement cody_config.json au démarrage
- ✅ **Tests passés** : 16/16 (100%)

### Éditeur de Pages Complet (P2) ✅
- ✅ **Composant PagesEditor** : Nouveau composant avec sélecteur de page
  - 4 pages : Accueil, À propos, Contact, FAQ
  - Interface avec boutons de sélection
- ✅ **Page À propos** : Éditeur complet
  - En-tête (titre, sous-titre)
  - Section Mission (titre, 3 paragraphes)
  - Section Valeurs (3 valeurs avec icônes)
  - Section Chiffres (toggle, titre, 4 stats)
- ✅ **Page Contact** : Éditeur complet
  - En-tête (titre, sous-titre)
  - Informations de contact (email, téléphone, horaires, adresse)
  - Formulaire de contact (toggle, message succès, titre)
  - Délai de réponse (toggle, texte)
- ✅ **Page FAQ** : Éditeur complet + Barre de recherche
  - En-tête (titre, sous-titre)
  - Recherche (toggle, placeholder)
  - Catégories (toggle)
  - Section Contact (toggle, texte bouton)
- ✅ **Pages publiques modifiées** : About.jsx, Contact.jsx, FAQ.jsx chargent les settings depuis l'API
- ✅ **Tests passés** : 10/10 (100%)

### Corrections
- ✅ **Fix erreur de syntaxe Home.jsx** : Parenthèses en double corrigées

---

## Session du 2026-01-10 - Améliorations Hero Editor & Code Agent

### Améliorations Hero Editor (P0)
- ✅ **Grid des onglets corrigé** : Passage de 5 à 8 colonnes pour afficher tous les onglets (Textes, Couleurs, Layout, Éléments, Raccourcis, Mobile, Planning, Images)
- ✅ **Drag & Drop des raccourcis** : Intégration de @dnd-kit pour réorganiser les raccourcis (Vidéos, Stories, Fidélité, KIM Agent) par glisser-déposer
- ✅ **Ordre dynamique des raccourcis** : Les raccourcis sur la page d'accueil respectent maintenant l'ordre configuré dans l'admin (setting `hero_shortcuts_order`)
- ✅ **KIM Agent visible par défaut** : Le raccourci KIM est activé par défaut sur la page d'accueil

### Code Agent Local - Fix mémoire (P1)
- ✅ **Gestion de session persistante** : Nouveau `SessionManager` pour conserver l'historique de conversation entre les messages
- ✅ **Indicateur de mémoire** : Affichage du nombre de messages en mémoire (🧠) dans l'interface
- ✅ **Limite d'historique** : Maximum 50 messages conservés pour éviter les dépassements de tokens
- ✅ **Nouvel endpoint /api/history** : Pour debug et visualisation de l'historique
- ✅ **Version mise à jour** : Code Agent v1.3.0 (ZIP régénéré)

### Tests passés
- ✅ 9/9 tests frontend (100%)
- Hero Editor 8 onglets fonctionnels
- Drag & drop des raccourcis vérifié
- Raccourcis affichés dans l'ordre configuré sur la page d'accueil

## Session du 2026-01-09 - Nouvelles fonctionnalités (suite)

### Intégration Boxtal (v4.2.0)
- ✅ **API Boxtal V3 intégrée** : calcul automatique des frais de livraison
- ✅ Multi-transporteurs : Colissimo, Mondial Relay, Chronopost, DPD et plus
- ✅ Mode production activé (clés API configurées dans .env)
- ✅ Endpoints : `/api/boxtal/status`, `/api/boxtal/quotes`, `/api/boxtal/shipments`, `/api/boxtal/tracking/{num}`
- ✅ Collections MongoDB : `shipping_quotes`, `shipments`

### Nouvelles catégories
- ✅ **"Recherche"** : Permet aux acheteurs de publier ce qu'ils cherchent
- ✅ **"Rare & Collection"** : Pièces vintage, collector et introuvables
- ✅ Ajoutées dans : Navbar, Home, CreateListing
- ✅ Traduites dans les 8 langues

### Mises à jour de contenu
- ✅ **FAQ** : Nouvelles sections Boxtal/Livraison et Catégories spéciales
- ✅ **Mentions légales** : Section partenaires (Stripe, Boxtal, Cloudinary)
- ✅ **Politique de retours** : Commission min/max mise à jour
- ✅ **Page Nouveautés** : v4.1.0 et v4.2.0 ajoutées
- ✅ **Flyer** : "Boxtal et ses partenaires" au lieu de "Mondial Relay"

## Traductions i18n (toutes les pages)
- ✅ Page Nouveautés (Updates.jsx) : Titre, sous-titre, légende, catégories, dates, CTA newsletter
- ✅ Toutes les nouvelles clés ajoutées dans `frontend/src/i18n/locales/*.json`

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

## Session du 2026-01-09/10 - KIM Agent & Code Agent

### KIM Agent (v4.4.0)
- ✅ **Application KIM Agent** : Assistant IA automobile accessible à `/kim-agent`
  - Interface de chat React moderne (dark mode)
  - Connecté à l'API GPT-4o via Emergent
  - Réponses IA réelles pour diagnostic, recherche de pièces, conseils
  - Quick actions : Trouver une pièce, Diagnostic, Estimation
- ✅ **Page de présentation** : `/kim-assistant` avec instructions d'installation

### Améliorations UI Hero
- ✅ **Raccourcis stylés** ajoutés entre CTA et stats :
  - 🎬 Vidéos (rouge)
  - 📸 Stories (rose)
  - 🎁 Fidélité (jaune)
  - ✨ KIM Agent (bleu)
- ✅ **Bouton Diagnostic** déplacé sur la ligne des CTA (avec Enchères)
- ✅ **Navbar allégée** : boutons Diag IA et Vidéos retirés

### Section Nouveautés en haut de page
- ✅ **Bannière "WHAT'S NEW"** visible immédiatement en haut de la page d'accueil
- ✅ Lien direct vers `/nouveautes`
- ✅ Traductions dans 8 langues (FR, EN, DE, ES, IT, NL, PT, SV)

### Code Agent (v1.1.0) - Application Desktop
- ✅ **Agent de développement Python** téléchargeable
  - Clone de l'agent Emergent pour usage local
  - Interface web sur localhost:8888
  - Lecture/écriture de fichiers
  - Exécution de commandes shell
  - Recherche dans le code
  - Multi-LLM : GPT-4o + Claude via Emergent Key
  - Auto-update intégré
- ✅ **Téléchargement** : `/downloads/code-agent.zip`

## Backlog
### P1
- ⏳ Intégration API SIV (en attente décision utilisateur)
- ⏸️ Upload d'images pour vignettes de sous-catégories (tâche 5)

### P2
- Interface admin pour gérer les crédits en attente
- Intégration eBay (reportée - pas de compte développeur)

## Collections MongoDB ajoutées
- `push_subscriptions` : Abonnements push (user_id, subscription, preferences)
- `notifications` : Historique des notifications envoyées
- `stories` : Stories des vendeurs (media_url, type, caption, views, created_at)
- `story_views` : Vues des stories (story_id, user_id)
- `identity_verifications` : Demandes de vérification d'identité
- `price_history` : Historique des changements de prix
- `shipping_quotes` : Devis de livraison Boxtal
- `shipments` : Expéditions créées via Boxtal

## Credentials Production
- MongoDB: worldauto_admin / WA_Secure_2026!
- Admin: contact@worldautofrance.com / Admin123!
- Test user: storiestest@test.com / test123456
