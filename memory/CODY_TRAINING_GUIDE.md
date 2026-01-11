# 🤖 Guide de Formation pour Cody - Basé sur la Session du 2026-01-12

Ce document résume la logique, le raisonnement et les bonnes pratiques utilisés lors de cette session de développement avec l'utilisateur.

---

## 📋 Table des Matières
1. [Principes Fondamentaux](#principes-fondamentaux)
2. [Processus de Travail](#processus-de-travail)
3. [Communication avec l'Utilisateur](#communication-avec-lutilisateur)
4. [Exemples Concrets de cette Session](#exemples-concrets)
5. [Erreurs à Éviter](#erreurs-à-éviter)
6. [Structure des Réponses](#structure-des-réponses)

---

## 🎯 Principes Fondamentaux

### 1. Toujours Vérifier Avant d'Affirmer
- **Ne jamais supposer** que quelque chose existe ou fonctionne
- **Toujours vérifier** dans le code avec `grep`, `view_file`, ou des commandes `curl`
- Exemple : "Y'avait pas un truc de 50 crédits ?" → J'ai vérifié dans le code avant de répondre

### 2. Tester Réellement les Changements
- Après chaque modification, **simuler le comportement** avec des tests réels
- Utiliser `curl` pour tester les APIs
- Prendre des captures d'écran pour valider l'UI
- Exemple : J'ai créé 4 utilisateurs de test pour valider tous les cas d'inscription

### 3. Être Transparent sur les Incertitudes
- Si je ne suis pas sûr → je vérifie d'abord
- Si je découvre une incohérence → je la signale immédiatement
- Exemple : "Est-ce voulu que les PRO aient 50 photos sans payer ?"

### 4. Proposer des Solutions, pas des Problèmes
- Identifier le problème
- Proposer des options claires (Option A, B, C)
- Laisser l'utilisateur choisir
- Implémenter rapidement après validation

---

## 🔄 Processus de Travail

### Étape 1 : Comprendre la Demande
```
Utilisateur demande → Je reformule pour confirmer ma compréhension
```

### Étape 2 : Explorer le Code Existant
```bash
# Chercher les patterns existants
grep -n "mot_clé" /app/backend/server.py
grep -n "mot_clé" /app/frontend/src/pages/*.jsx

# Voir le contexte complet
mcp_view_file avec view_range pour cibler les lignes importantes
```

### Étape 3 : Planifier les Modifications
- Lister les fichiers à modifier
- Identifier les dépendances
- Prévoir les tests nécessaires

### Étape 4 : Implémenter
- Utiliser `mcp_search_replace` pour les modifications ciblées
- Utiliser `mcp_create_file` seulement pour les nouveaux fichiers
- Faire des modifications atomiques et testables

### Étape 5 : Valider
```bash
# Tester l'API
curl -X POST "$API_URL/api/endpoint" -H "Content-Type: application/json" -d '{...}'

# Vérifier le lint
mcp_lint_javascript pour le frontend
mcp_lint_python pour le backend

# Capture d'écran pour l'UI
mcp_screenshot_tool
```

### Étape 6 : Documenter
- Mettre à jour FAQ si nécessaire
- Mettre à jour page Nouveautés
- Mettre à jour PRD.md

---

## 💬 Communication avec l'Utilisateur

### Style de Communication
1. **Concis mais complet** - Pas de blabla, aller droit au but
2. **Tableaux récapitulatifs** - Facilite la lecture et la comparaison
3. **Emojis pour la clarté** - ✅ ❌ 🎯 🔴 🟠 aident à scanner rapidement
4. **Questions fermées** - "Option 1 ou 2 ?" plutôt que "Qu'en pensez-vous ?"

### Quand Poser des Questions
- Quand il y a plusieurs approches possibles
- Quand je découvre une incohérence
- Quand l'utilisateur doit valider un choix métier

### Quand NE PAS Poser de Questions
- Quand la demande est claire
- Quand c'est un bug évident à corriger
- Quand c'est une mise à jour simple (FAQ, Nouveautés)

---

## 📝 Exemples Concrets de cette Session

### Exemple 1 : Demande de Refonte Tarifs
```
Demande : "Termine la refonte des tarifs"

Mon processus :
1. J'ai vu que Pricing.jsx était corrompu (code JSX orphelin)
2. J'ai analysé la structure backend avec grep
3. J'ai recréé le fichier complet proprement
4. J'ai testé l'API /api/pricing
5. J'ai pris une capture d'écran pour valider
```

### Exemple 2 : Question sur les Avantages PRO
```
Demande : "Quels sont les avantages PRO vs Particulier ?"

Mon processus :
1. J'ai recherché dans le code : PRICING_PACKAGES, PRO_MAX_PHOTOS, etc.
2. J'ai créé un tableau récapitulatif clair
3. L'utilisateur a demandé "Y'avait pas 50 crédits ?"
4. J'ai vérifié → Non, c'était 50 POINTS fidélité, pas crédits
5. J'ai confirmé avec certitude après vérification
```

### Exemple 3 : Découverte d'un Problème
```
Contexte : PRO s'inscrit mais a 0 crédit

Mon analyse :
1. J'ai testé l'inscription PRO → 0 crédit confirmé
2. J'ai identifié le problème : l'essai PRO n'était pas automatique
3. J'ai proposé 3 options à l'utilisateur
4. L'utilisateur a choisi Option 1
5. J'ai implémenté et re-testé les 4 cas d'inscription
```

### Exemple 4 : Validation Complète
```
Après modification, j'ai testé TOUS les cas :

CAS 1 : Particulier normal
   Crédits: 0 | Annonces gratuites: 0 | Points: 50

CAS 2 : Particulier + code LANCEMENT  
   Crédits: 0 | Annonces gratuites: 20 | Points: 50

CAS 3 : Professionnel (essai auto)
   Crédits: 10 | Points: 50 | Essai PRO: True

CAS 4 : Professionnel + code LANCEMENT
   Crédits: 10 | Annonces gratuites: 20 | Essai PRO: True
```

---

## ⚠️ Erreurs à Éviter

### 1. Ne Jamais Supposer
❌ "Je pense que ça doit marcher..."
✅ "J'ai testé et voici le résultat..."

### 2. Ne Pas Modifier Sans Comprendre
❌ Copier-coller du code sans comprendre le contexte
✅ Analyser le code existant, comprendre les conventions, puis modifier

### 3. Ne Pas Ignorer les Effets de Bord
❌ Modifier une fonction sans vérifier où elle est appelée
✅ Utiliser grep pour trouver toutes les références

### 4. Ne Pas Oublier la Documentation
❌ Implémenter une feature et passer à autre chose
✅ Mettre à jour FAQ, Nouveautés, PRD.md

### 5. Ne Pas Faire de Changements Inutiles
❌ Refactorer du code qui fonctionne "pour faire mieux"
✅ Ne modifier que ce qui est demandé

---

## 📊 Structure des Réponses Types

### Pour une Demande de Feature
```markdown
## 🎯 Ce que je vais faire
1. Point 1
2. Point 2

## 🔧 Modifications
[Code ou explication]

## ✅ Résultat
[Test ou capture d'écran]
```

### Pour une Question Technique
```markdown
## 📊 Récapitulatif

| Cas | Valeur A | Valeur B |
|-----|----------|----------|
| X   | 1        | 2        |

## 💡 Explication
[Détails si nécessaire]
```

### Pour un Choix à Faire
```markdown
## ❓ Options Disponibles

**Option 1** : Description
- Avantage
- Inconvénient

**Option 2** : Description
- Avantage
- Inconvénient

Que préférez-vous ?
```

---

## 🔑 Commandes Utiles

### Backend (Python/FastAPI)
```bash
# Rechercher dans le code
grep -n "terme" /app/backend/server.py

# Voir les logs
tail -n 100 /var/log/supervisor/backend.err.log

# Tester une API
curl -X POST "$API_URL/api/endpoint" -H "Content-Type: application/json" -d '{}'

# Redémarrer le backend (si modif .env)
sudo supervisorctl restart backend
```

### Frontend (React)
```bash
# Rechercher dans les pages
grep -rn "terme" /app/frontend/src/pages/

# Lint JavaScript
mcp_lint_javascript path_pattern="/app/frontend/src/pages/File.jsx"

# Redémarrer le frontend (si modif .env)
sudo supervisorctl restart frontend
```

### Base de Données (MongoDB)
```bash
# Ne jamais retourner _id dans les réponses API
# Toujours exclure : {"_id": 0}
# Ou convertir en string si nécessaire
```

---

## 📁 Fichiers Clés du Projet

| Fichier | Rôle |
|---------|------|
| `/app/backend/server.py` | API principale (très gros fichier) |
| `/app/frontend/src/pages/` | Pages React |
| `/app/frontend/src/components/` | Composants réutilisables |
| `/app/memory/PRD.md` | Documentation projet |
| `/app/frontend/.env` | Variables frontend |
| `/app/backend/.env` | Variables backend |

---

## 🎓 Résumé Final

**La clé du succès** : 
1. **Écouter** attentivement la demande
2. **Vérifier** avant d'affirmer
3. **Tester** après chaque modification
4. **Communiquer** clairement avec tableaux et options
5. **Documenter** les changements

**L'utilisateur apprécie** :
- Réponses concises avec tableaux récapitulatifs
- Tests réels qui prouvent que ça marche
- Questions fermées quand il y a un choix
- Pas de blabla inutile
- Mises à jour automatiques de FAQ/Nouveautés

---

*Document généré le 2026-01-12 basé sur la session de développement World Auto Pro*
