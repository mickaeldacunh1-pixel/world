# 🤖 CODE AGENT - Ton assistant de développement personnel

Un clone de l'agent Emergent que tu peux installer sur ton PC.
Il fait tout ce que je fais : lire/écrire des fichiers, exécuter des commandes, débugger du code, et plus encore.

## 📦 Installation

### Prérequis
- Python 3.10+ installé
- pip (gestionnaire de packages Python)

### Installation rapide

```bash
# 1. Extraire le dossier code-agent où tu veux

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Configurer ta clé API (optionnel - tu peux le faire dans l'interface)
# Édite le fichier .env ou configure dans l'app

# 4. Lancer l'agent
python agent.py

# 5. Ouvre ton navigateur à http://localhost:8888
```

## 🚀 Utilisation

### Démarrage
```bash
python agent.py
```
L'interface s'ouvre automatiquement dans ton navigateur.

### Commandes disponibles dans le chat

L'agent comprend le langage naturel. Exemples :

- "Montre-moi le contenu de server.py"
- "Crée un fichier test.py avec une fonction hello world"
- "Exécute pip list"
- "Trouve tous les fichiers .jsx dans src/"
- "Corrige le bug dans ce code : [ton code]"
- "Explique-moi ce que fait cette fonction"
- "Déploie sur mon VPS"

### Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| 📁 Lecture de fichiers | Lit n'importe quel fichier de ton projet |
| ✏️ Écriture de fichiers | Crée et modifie des fichiers |
| 🖥️ Exécution de commandes | Lance des commandes bash/shell |
| 🔍 Recherche dans le code | Trouve du texte dans tes fichiers |
| 🐛 Débogage | Analyse et corrige les erreurs |
| 💬 Chat intelligent | Répond à tes questions de dev |
| 📊 Analyse de projet | Comprend la structure de ton projet |
| ✏️ Édition ciblée | Modifie une portion précise d'un fichier (edit_file) |
| 🔧 Git intégré | status, diff, commit, push, pull depuis le chat |
| 🌊 Streaming | Réponses affichées en temps réel, token par token |
| 🔁 Boucle agentique | Enchaîne plusieurs outils en lisant leurs résultats |
| 🔄 Multi-LLM | GPT-5.4, Claude Sonnet 4.6, Gemini 3.1 Pro selon tes besoins |

## ⚙️ Configuration

### Clés API
Tu peux utiliser :
- **Emergent Key** (universelle) - fournie par défaut
- **Ta propre clé OpenAI**
- **Ta propre clé Anthropic**

Configure dans `.env` ou directement dans l'interface.

### Projet par défaut
Au premier lancement, l'agent te demandera le chemin de ton projet.
Il gardera ce contexte pour toutes tes conversations.

## 🔐 Sécurité

- L'agent tourne **en local uniquement** (localhost)
- Aucune donnée envoyée sauf aux APIs LLM
- Tu contrôles tout ce qu'il fait

## 📝 Licence

Usage personnel - Créé par Emergent pour World Auto France

---

**Besoin d'aide ?** Pose ta question directement à l'agent, il saura te guider ! 😊
