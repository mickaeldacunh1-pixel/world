# World Auto France - PRD

## Description du Projet
Plateforme de vente de pièces automobiles avec assistant IA "Tobi", fonctionnalités avancées (mode sombre, PWA, vidéos, gamification), outils de fidélisation et panneau d'administration complet.

## Architecture
- **Frontend**: React (port 3000/80/443)
- **Backend**: FastAPI (port 8001)
- **Base de données**: MongoDB (127.0.0.1:27017 - sécurisé)
- **Hébergement**: VPS Hostinger

## Sécurité MongoDB (Mise à jour 2026-01-09)
- ✅ Accès local uniquement (127.0.0.1)
- ✅ Authentification activée (user: worldauto_admin)
- ✅ Port 27017 non exposé publiquement

## Fonctionnalités Implémentées
- Assistant IA "Tobi"
- Mode Sombre / PWA
- Galerie vidéo et forfaits vidéo
- Programme de fidélité et parrainage
- Système de paiement Stripe
- Intégration Cloudinary (images)
- Mondial Relay (livraison)
- Panneau d'administration complet

## Session du 2026-01-09
### Accompli
- ✅ Restauration après incident de sécurité (ransomware)
- ✅ Nouvelle instance MongoDB sécurisée
- ✅ Bouton "World Auto PRO" visible sur mobile/tablette
- ✅ Lien Emergent centré dans le footer
- ✅ Compte admin recréé (contact@worldautofrance.com)
- ✅ Vérification de sécurité : ports, accès, authentification

### Base de données
- Vidée par l'attaque, données à recréer manuellement
- Compte admin : contact@worldautofrance.com / Admin123!

## Backlog
### P1
- Intégration API Colissimo (en attente clés)
- Intégration API SIV (en attente décision)
- Améliorer aperçu admin (problème récurrent)

### P2
- Lecteur radio configurable depuis l'admin

## Credentials Production
- MongoDB: worldauto_admin / WA_Secure_2026!
- Admin: contact@worldautofrance.com / Admin123!
