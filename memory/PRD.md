# WorldAutoFrance - Marketplace Pièces Auto

## Statut Actuel
**Date**: 25 janvier 2026
**État**: Production ✅

## Fonctionnalités Complétées

### Session 25/01/2026
- ✅ **P0 - Champ Quantity** - Ajouté au modèle ListingCreate et formulaires
- ✅ **P0 - Badge "Dernière pièce"** - Affiche ⚠️ sur annonces avec quantity=1 (clignotant)
- ✅ **P0 - Badge "Stock limité"** - Affiche 📦 quand 2-3 pièces en stock
- ✅ **P0 - Migration annonces** - Bouton dans /admin > Outils & Migrations
- ✅ **P1 - Interface Bundles** - Page /creer-lot pour créer des lots groupés
- ✅ **P1 - Lots vendeur** - Sélection multiple d'annonces, calcul remise automatique
- ✅ **P2 - Wishlist partageable** - API /api/wishlist/share et /api/wishlist/shared/{shareId}
- ✅ **P2 - Page wishlist partagée** - /wishlist/{shareId} avec affichage public
- ✅ **P2 - Bouton de partage** - Dans /favoris avec copie du lien
- ✅ **Interface compatibilité améliorée** - Suggestions de modèles par marque (BMW, Peugeot, Renault, etc.)
- ✅ **Suggestions années** - Boutons rapides pour plages d'années (2020-2025, 2015-2020, etc.)
- ✅ **Historique des prix** - Affichage sur page annonce avec timeline et % de baisse/hausse

### Session 24/01/2026
- ✅ **Badge "Populaire"** - Affiche le nombre de vues sur les annonces (🔥 Populaire si 10+ vues)
- ✅ **Correction Service Worker** - Les vidéos Cloudinary et ressources externes ne sont plus bloquées
- ✅ **Correction images Unsplash 404** - Remplacement des images mortes (freinage, engins)
- ✅ **FAQ mise à jour** - Reversements PRO hebdomadaires (tous les lundis)
- ✅ **Page Nouveautés** - Ajout versions 6.0.0 et 6.1.0

### Session 23/01/2026
- ✅ **Dashboard admin unifié** - /admin avec accès à toutes les sections
- ✅ **Gestion des utilisateurs** - /admin/utilisateurs (bloquer/débloquer, compteur annonces)
- ✅ **Correction pages admin blanches** - Vérification admin par email + is_admin
- ✅ **Correction bug "reserved"** - Annonces restent actives jusqu'à confirmation
- ✅ **Correction bug panier** - Mise à jour instantanée navbar
- ✅ **Sitemap dynamique** - Utilise les bons IDs (UUID)

## Prochaines Tâches (Backlog)
1. **Refactorisation server.py** - Diviser le monolithe backend en modules séparés (routes, models, services)

## Liens Admin
- /admin - Dashboard principal
- /admin/parametres - Paramètres du site
- /admin/utilisateurs - Gestion utilisateurs
- /admin/ventes - Ventes & Reversements
- /admin/signalements - Modération
- /admin/paiements - Historique paiements
- /admin/actualites - Newsletter
- ✅ **Intégration Boxtal API V1** - Devis de livraison fonctionnels (37+ transporteurs)
- ✅ **Frais de port inclus dans Stripe** - Le total affiché et facturé inclut maintenant les frais Boxtal
- ✅ **Système de reversements automatiques** - Nouveau module complet créé
- ✅ **Correction BoxtalPicker** - Sélection de transporteur fonctionnelle

### Sessions précédentes
- ✅ Bouton "offre de lancement" visible sur mobile
- ✅ Gestion des radios (CRUD) dans l'admin
- ✅ Catégories "Rare & Collection" et "Engins" sur la page d'accueil
- ✅ Traductions 8 langues
- ✅ Widget Mondial Relay, lecteur vidéo, pagination, etc.

## Nouveaux Modules Créés

### Service de Reversements (`/app/backend/services/payout_service.py`)
- Reversements Stripe Connect automatiques
- Virements bancaires semi-automatiques
- Scheduler quotidien (optionnel)
- Configuration: `AUTO_PAYOUT_ENABLED`, `PAYOUT_DELAY_DAYS`, `MIN_PAYOUT_AMOUNT`

### Routes Reversements (`/app/backend/routes/payouts.py`)
- `GET /api/payouts/pending` - Reversements en attente
- `POST /api/payouts/process` - Traiter un reversement
- `POST /api/payouts/process-batch` - Traitement en lot
- `GET /api/payouts/bank-transfers/pending` - Virements en attente
- `POST /api/payouts/bank-transfers/confirm` - Confirmer virement
- `GET /api/payouts/history` - Historique
- `GET /api/payouts/my-payouts` - Mes reversements (vendeur)

## Configuration Boxtal
```env
BOXTAL_APP_ID=app-7f579a44-ed18-40a6-8feb-b924396302d2
BOXTAL_ACCESS_KEY=CK05W1WNPLJ23IKPXS5M92MPQJTTZX4FTHLP4ZAK
BOXTAL_SECRET_KEY=retailrescue
BOXTAL_API_URL=https://api.boxtal.com
BOXTAL_API_V1_URL=https://www.envoimoinscher.com/api/v1
BOXTAL_MODE=production
BOXTAL_MARGIN_PERCENT=15
```

## Prochaines Tâches (Backlog)

### P1 - Priorité Haute
- [ ] Traduction complète du site (About, Newsletter, admin, légales)
- [ ] Upload direct Cloudinary pour vidéos dans l'éditeur Hero

### P2 - Priorité Moyenne  
- [ ] Refactorisation du monolithe `server.py` (12000+ lignes)
- [ ] Interface admin pour les reversements

### P3 - Améliorations
- [ ] Erreurs Sentry "Network Error AxiosError"
