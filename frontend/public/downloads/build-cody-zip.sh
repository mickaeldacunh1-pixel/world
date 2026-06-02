#!/bin/bash
# Génère code-agent.zip pour l'auto-update de l'Agent Cody.
# À lancer après chaque modification de code-agent/, AVANT le déploiement.
#   cd /var/www/worldauto/frontend/public/downloads && bash build-cody-zip.sh
set -e
cd "$(dirname "$0")"

# Nettoyer les artefacts locaux avant de zipper
rm -rf code-agent/__pycache__
rm -f code-agent/.cody_memory.json code-agent/.cody_knowledge.json
rm -f code-agent.zip

# Zipper le dossier (l'auto-update s'attend à un sous-dossier "code-agent/")
zip -r code-agent.zip code-agent \
  -x "code-agent/.env" \
  -x "code-agent/__pycache__/*" \
  -x "code-agent/.cody_memory.json" \
  -x "code-agent/.cody_knowledge.json" \
  -x "code-agent/screenshots/*"

echo "✅ code-agent.zip généré ($(du -h code-agent.zip | cut -f1))"
