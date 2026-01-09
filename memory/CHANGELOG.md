# Changelog - World Auto Pro

Toutes les modifications notables du projet sont documentées ici.

---

## [4.4.0] - 2026-01-09
### Ajouté
- 🤖 **KIM Agent PWA** : Assistant IA automobile
  - Application accessible à `/kim-agent/`
  - Interface de chat moderne avec dark mode
  - Réponses IA pour diagnostic, recherche de pièces, conseils
  - Installation PWA possible sur mobile et desktop
  - Service Worker pour fonctionnement offline partiel
  - Quick actions : Trouver une pièce, Diagnostic, Estimation
- 📱 **Page de présentation KIM Agent** : `/kim-assistant`
  - Instructions d'installation (PWA, Desktop, Web)
  - FAQ intégrée
- 🗞️ **Bannière Nouveautés** : Section visible en haut de la page d'accueil
  - Lien direct vers `/nouveautes`
  - Traductions dans 8 langues

---

## [4.3.0] - 2026-01-09
### Ajouté
- 💰 **Marge sur frais de port** : Pourcentage configurable (défaut 15%)
  - Appliquée automatiquement sur tous les devis Boxtal
  - Interface admin pour modifier le pourcentage
  - Sauvegarde en base de données pour persistance
- ⚙️ Endpoints admin : `GET /api/admin/boxtal/config`, `PUT /api/admin/boxtal/margin`

---

## [4.2.0] - 2026-01-09
### Ajouté
- 📦 **Intégration Boxtal V3** : Calcul automatique des frais de livraison
  - Multi-transporteurs : Colissimo, Mondial Relay, Chronopost, DPD
  - Mode production activé
  - Endpoints : `/api/boxtal/status`, `/api/boxtal/quotes`, `/api/boxtal/shipments`, `/api/boxtal/tracking/{num}`
- 🔍 **Catégorie "Recherche"** : Publiez ce que vous cherchez, les vendeurs vous contactent
- ⭐ **Catégorie "Rare & Collection"** : Pièces vintage, collector et introuvables
### Modifié
- 💬 Bouton Messages déplacé à droite du sélecteur de langue
- 📋 FAQ mise à jour avec sections Boxtal/Livraison et Catégories spéciales
- 📜 Mentions légales : ajout section partenaires (Stripe, Boxtal, Cloudinary)
- 🔄 Politique de retours : commission min/max mise à jour
- 📰 Flyer : "Boxtal et ses partenaires" au lieu de "Mondial Relay"

---

## [4.1.0] - 2026-01-09
### Ajouté
- 🌍 **Traduction page Nouveautés** : Interface multilingue complète (8 langues)
  - Titre, sous-titre, légende, catégories, CTA newsletter
  - Dates formatées selon la locale utilisateur
  - Fichiers modifiés : `Updates.jsx`, tous les `locales/*.json`

---

## [4.0.0] - 2026-01-09
### Ajouté
- 💰 **Tableau de bord Ventes** : Onglet dédié dans le dashboard vendeur
  - 4 cartes de statistiques (ventes, revenus bruts, commission, revenus nets)
  - Graphique d'évolution des revenus sur 6 mois
  - Explication détaillée de la formule de commission
- 📄 **Export PDF comptabilité** : Téléchargement de relevé mensuel pour la compta
- 🧮 **Simulateur de commission** : Aperçu en temps réel sur CreateListing/EditListing

---

## [3.9.0] - 2026-01-09
### Ajouté
- 💸 **Commission hybride optimisée** : 5% avec min 1,50€ / max 15€
- 🔢 **API /commission/calculate** : Endpoint de simulation
### Modifié
- FAQ et Profil mis à jour avec la nouvelle formule

---

## [3.8.0] - 2026-01-09
### Ajouté
- 📸 **Stories Vendeurs** : Partage de photos/vidéos éphémères (24h)
  - Page dédiée `/stories` avec stats et création
  - Bouton Stories (icône caméra) dans la navbar
  - Section Stories sur la page d'accueil
- ✅ **Vérification d'identité** : Badge "Vérifié" pour les vendeurs
  - Interface admin pour approuver/rejeter
  - Upload de documents (ID recto/verso + selfie)
### Modifié
- 🌐 Sélecteur de langue déplacé à droite du panier

---

## [3.7.0] - 2026-01-09
### Ajouté
- 🔔 **Notifications Push** : Alertes natives dans le navigateur
  - Notifications pour nouveaux messages et commandes
  - Préférences personnalisables
  - Bouton de test
  - Clés VAPID sécurisées

---

## [3.6.0] - 2026-01-08
### Ajouté
- 🎬 **Page Vidéos** : Galerie des annonces avec vidéos
- 📺 **Lecteur vidéo Homepage** : Diffusion en continu
- 🔥 **Boost Vidéo** : Mise en avant (0,50€/h ou 5€/24h)
- 📹 **Forfaits Vidéo** : Intermédiaire (3min/2,99€) et PRO (10min/9,99€)
### Amélioré
- Design responsive style YouTube/TikTok
- Filtres vidéos (catégorie, tri)
- Lecture au survol sur les miniatures

---

## [3.5.0] - 2026-01-08
### Ajouté
- 📻 **Lecteur Radio** : 14 stations françaises intégrées
  - Contrôles complets (Play/Pause, volume, liste)
  - Design moderne avec couleur par station

---

## [3.4.0] - 2026-01-08
### Ajouté
- 👑 **Essai PRO 14 jours** : Test gratuit sans engagement
- 🎁 50 crédits offerts pendant l'essai PRO
- 📸 Jusqu'à 50 photos par annonce avec PRO
- ⚙️ Panneau admin : personnalisation bouton PRO

---

## [3.3.0] - 2026-01-08
### Ajouté
- ⚖️ **Comparateur de pièces** : Jusqu'à 4 annonces côte à côte
- 📉 **Historique des prix** : Suivi de l'évolution des prix
- 🏷️ Badge "Prix en baisse"
### Amélioré
- Widget comparateur flottant
- Navbar optimisée

---

## [3.2.0] - 2026-01-07
### Ajouté
- 🎟️ **Système de coupons** : Codes promo (% ou € fixe)
- 🌍 **Traduction i18n** : 8 langues (FR, EN, ES, DE, IT, PT, NL, SV)
- 🎨 11 animations saisonnières
### Amélioré
- Relance panier abandonné (emails auto toutes les 2h)

---

## [3.1.0] - 2026-01-07
### Ajouté
- 🛡️ **Certification "Pièce Vérifiée"** : Badges Or/Argent
- 📋 Traçabilité des pièces (origine, kilométrage)
- ✅ **Garantie World Auto Pro** : 3/6/12 mois
- 🎬 Limitation vidéo (30s gratuit, 2min pour 1€)
- 📱 Partage réseaux sociaux
- 📊 Tableau de bord PRO

---

## [3.0.0] - 2026-01-06
### Ajouté
- 🎨 **Éditeur Hero complet** : Personnalisation sans code
  - Onglets : Textes, Couleurs, Layout, Éléments, Images

---

## [2.9.0] - 2026-01-06
### Ajouté
- 🎤 Tobi avec micro (recherche vocale)
- 📸 Limitation photos (6 de base, +15 pour 1€)
- 📄 Flyer promotionnel avec QR code
### Corrigé
- Cache des annonces (affichage instantané)
- Service Worker optimisé

---

## [2.8.0] - 2026-01-06
### Ajouté
- 🤖 **Diagnostic IA par Tobi** : 0.99€/diagnostic ou gratuit avec annonce
- Endpoint /api/users/me/stats

---

## [2.7.0] - 2026-01-06
### Ajouté
- 🎁 **Système de Parrainage** : 100 pts parrain / 50 pts filleul
- Code unique auto-généré
- Leaderboard des meilleurs parrains

---

## [2.6.0] - 2026-01-05
### Ajouté
- 💰 **Monétisation** : Boost, À la Une, Packs Pro
- ⭐ **Programme Fidélité** : Points, niveaux (Bronze→Diamant), récompenses
- Intégration Stripe

---

## [2.5.5] - 2026-01-04
### Ajouté
- 📷 Scan de plaque d'immatriculation (OCR)
- 🎤 Recherche vocale
- 🔨 Système d'enchères en direct
- 📹 Appel vidéo vendeur (WhatsApp)
- ⭐ Notation des acheteurs
### Amélioré
- Chat WebSockets temps réel
- Indicateur "en train d'écrire..."

---

## [2.5.0] - 2026-01-05
### Ajouté
- Restriction inscriptions (pays européens fiables)
- Packs Pro 3 mois (99€) et 6 mois (179€)
- Pack 50 crédits (39€)
- Page "Toutes les marques"

---

## [2.4.0] - 2026-01-04
### Ajouté
- 📄 Factures PDF (vendeurs/acheteurs)
- 📧 Email de confirmation nouvelle annonce
- Frais de port configurables
- Page modification annonces

---

## [2.3.0] - 2026-01-03
### Ajouté
- ⚙️ Panel d'administration complet
- Logo personnalisé "France" bleu-blanc-rouge

---

## [2.2.0] - 2026-01-02
### Ajouté
- 🛒 Checkout groupé depuis le panier
- Page confirmation de commande
- Notifications email vendeurs/acheteurs

---

## [2.1.0] - 2026-01-01
### Ajouté
- ✅ Vérification SIRET automatique
- Auto-remplissage nom entreprise (API gouvernementale)

---

## [2.0.0] - 2025-12-15
### Lancement initial
- 🚗 Marketplace pièces détachées automobiles
- 💳 Système de crédits et paiement Stripe
- 💬 Messagerie acheteurs/vendeurs
- ❤️ Favoris et alertes personnalisées
- ⭐ Évaluations vendeurs
- 🔍 SEO optimisé
