# WorldAutoFrance - Marketplace Pièces Auto

## Statut Actuel
**Date**: 23 janvier 2026
**État**: Production ✅

## Fonctionnalités Complétées

### Session 23/01/2026
- ✅ **Correction bug "reserved"** - Les annonces ne sont plus marquées "reserved" lors de l'ajout au panier ou du checkout. L'annonce reste "active" jusqu'à confirmation manuelle du vendeur.
- ✅ **Correction pages admin blanches** - Ajout de vérifications admin manquantes dans AdminPayments.jsx, AdminUpdates.jsx et AdminReports.jsx. Les pages affichent maintenant "Accès réservé" au lieu d'une page blanche.

### Session 22/01/2026
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
