# WorldAutoFrance - Marketplace Pièces Auto

## Statut Actuel
**Date**: 22 janvier 2026
**État**: Production ✅

## Fonctionnalités Complétées

### Session actuelle (22/01/2026)
- ✅ **Intégration Boxtal API V1** - Devis de livraison fonctionnels
  - URL corrigée: `https://www.envoimoinscher.com/api/v1`
  - Parser XML implémenté
  - 37+ transporteurs disponibles (Mondial Relay, Chronopost, UPS, FedEx, DHL, etc.)
  - Marge commerciale 15% appliquée

### Sessions précédentes
- ✅ Bouton "offre de lancement" visible sur mobile
- ✅ Gestion des radios (CRUD) dans l'admin
- ✅ Catégories "Rare & Collection" et "Engins" sur la page d'accueil
- ✅ Traductions 8 langues (fr, en, de, es, it, nl, pt, sv)
- ✅ Alias `wabuild` pour déploiement simplifié
- ✅ Widget Mondial Relay
- ✅ Lecteur vidéo promotionnel
- ✅ Pagination
- ✅ Estimateur frais de port
- ✅ Expiration crédits offerts

## Prochaines Tâches (Backlog)

### P1 - Priorité Haute
- [ ] Traduction complète du site (pages About, Newsletter, admin, légales)
- [ ] Upload direct Cloudinary pour vidéos dans l'éditeur Hero

### P2 - Priorité Moyenne
- [ ] Refactorisation du monolithe `server.py`
- [ ] Automatisation des reversements vendeurs

### P3 - Améliorations
- [ ] Erreurs Sentry "Network Error AxiosError" (non priorisé)

## Architecture

```
/app/
├── backend/
│   ├── server.py        # API FastAPI (monolithe)
│   ├── routes/          # Routes modulaires
│   └── .env             # Configuration (Boxtal, Stripe, etc.)
├── frontend/
│   ├── src/
│   │   ├── components/  # Composants React
│   │   ├── pages/       # Pages
│   │   └── i18n/        # Traductions
│   └── .env
└── memory/
    └── PRD.md
```

## Configuration Boxtal
```env
BOXTAL_APP_ID=app-7f579a44-ed18-40a6-8feb-b924396302d2
BOXTAL_ACCESS_KEY=CK05W1WNPLJ23IKPXS5M92MPQJTTZX4FTHLP4ZAK
BOXTAL_SECRET_KEY=820931e6-f881-4e1b-b0c9-2bf651e633f0
BOXTAL_API_URL=https://api.boxtal.com
BOXTAL_API_V1_URL=https://www.envoimoinscher.com/api/v1
BOXTAL_MODE=production
BOXTAL_MARGIN_PERCENT=15
```

## Intégrations Tierces
- Stripe (paiements)
- Boxtal/Envoimoinscher (livraison)
- Mondial Relay (points relais)
- Cloudinary (médias)
- Google reCAPTCHA
- i18next (traductions)
