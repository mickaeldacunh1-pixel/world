# World Auto France - PRD (Product Requirements Document)

## Problème Original
Site de type "Opisto" pour la vente de pièces automobiles. Le projet inclut un agent de développement IA nommé "Cody" et des fonctionnalités avancées pour les professionnels.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + Motor (MongoDB async)
- **Database**: MongoDB
- **Agent Cody**: Python (Flask local) avec accès SSH

## Fonctionnalités Implémentées

### Session du 12 Janvier 2026
1. ✅ **Bug Fix: Création d'annonce (page blanche)**
   - Corrigé le modèle `ListingResponse` avec tous les champs requis
   - Ajouté les champs: `video_url`, `part_origin`, `vehicle_mileage`, `has_warranty`, `warranty_duration`, `is_promo_free`
   - Correction de la vérification des crédits (inclut maintenant `free_ads_remaining`)
   - Ajout du header d'autorisation dans les requêtes axios

2. ✅ **Mon Entrepôt Pro (nouvelle fonctionnalité)**
   - Route `/entrepot` ajoutée au routeur
   - Page complète avec:
     - Statistiques (pièces en stock, références, sections, valeur, alertes)
     - Gestion des sections (CRUD)
     - Gestion des articles (CRUD)
     - Recherche par nom, référence, marque, emplacement
     - Filtres avancés (état, marque, tri, stock bas)
     - Vue tableau et grille
     - Ajustement stock (+/-)
     - Publication d'articles en annonces
     - Export CSV
   - Backend corrigé pour utiliser MongoDB async correctement (await + to_list())
   - `app.include_router(api_router)` déplacé après les routes warehouse

### Fonctionnalités Existantes
- Agent Cody v3.5.3 avec accès SSH
- Calculateur Boxtal (simulation)
- FAQ exhaustive (18 catégories, 109 questions)
- Sécurité HSTS/CSP
- Radio player, personnalisation Cody
- Mode sombre mobile

## Endpoints API Warehouse

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/warehouse/categories` | GET | Catégories prédéfinies |
| `/api/warehouse/sections` | GET | Liste des sections |
| `/api/warehouse/sections` | POST | Créer une section |
| `/api/warehouse/sections/{id}` | PUT | Modifier une section |
| `/api/warehouse/sections/{id}` | DELETE | Supprimer une section |
| `/api/warehouse/items` | GET | Liste des articles (avec recherche) |
| `/api/warehouse/items` | POST | Créer un article |
| `/api/warehouse/items/{id}` | GET | Détail article |
| `/api/warehouse/items/{id}` | PUT | Modifier un article |
| `/api/warehouse/items/{id}` | DELETE | Supprimer un article |
| `/api/warehouse/items/{id}/adjust-stock` | POST | Ajuster le stock |
| `/api/warehouse/items/{id}/publish` | POST | Publier en annonce |
| `/api/warehouse/stats` | GET | Statistiques entrepôt |
| `/api/warehouse/import-csv` | POST | Import CSV |

## Collections MongoDB
- `warehouse_sections`: Sections d'entrepôt par utilisateur
- `warehouse_items`: Articles de stock
- `warehouse_movements`: Historique des mouvements de stock

## Tests
- **Test Report**: `/app/test_reports/iteration_11.json`
- **Pytest Results**: `/app/test_reports/pytest/warehouse_results.xml`
- **Success Rate**: 100% (11/11 backend tests passed)

## Tâches Restantes

### P1 - Priorité Haute
- [ ] Traduction FAQ (i18n)
- [ ] Bug monitoring Cody (RAM/Disque affiche "N/A")

### P2 - Priorité Moyenne
- [ ] Refactorisation `backend/server.py` (10000+ lignes)
- [ ] Refactorisation `AdminSettings.jsx` (4600+ lignes)
- [ ] Refactorisation `agent.py` (2000+ lignes)

## Credentials de Test
- **Admin**: contact@worldautofrance.com / Admin123!

## APIs Mockées
- Boxtal (mode simulation)
