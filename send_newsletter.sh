#!/bin/bash
# Script d'envoi automatique de newsletter hebdomadaire
# À configurer avec cron sur le VPS : 0 9 * * 1 /var/www/worldauto/send_newsletter.sh
#
# Ce script envoie une newsletter automatique avec les dernières actualités du site.
# Il nécessite un compte admin pour fonctionner.

# Configuration
API_URL="https://worldautofrance.com/api"
ADMIN_EMAIL="contact@worldautofrance.com"
ADMIN_PASSWORD="VOTRE_MOT_DE_PASSE_ADMIN"  # À remplacer

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "$(date): Démarrage de l'envoi de newsletter hebdomadaire..."

# 1. Authentification
echo "Authentification..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Erreur: Authentification échouée${NC}"
  exit 1
fi

echo -e "${GREEN}Authentification réussie${NC}"

# 2. Récupérer les dernières actualités pour le contenu
echo "Récupération des actualités..."
UPDATES=$(curl -s "$API_URL/updates" | python3 -c "
import sys, json
updates = json.load(sys.stdin)
if updates:
    latest = updates[0]
    items = latest.get('items', [])[:5]
    content = f\"Dernière mise à jour: {latest.get('title', '')} (v{latest.get('version', '')})\\n\\n\"
    for item in items:
        emoji = '🚀' if item['type'] == 'new' else '✨' if item['type'] == 'improvement' else '🔧' if item['type'] == 'fix' else '🛠️'
        content += f\"{emoji} {item['text']}\\n\"
    print(content)
else:
    print('Découvrez les dernières annonces et fonctionnalités de World Auto France.')
" 2>/dev/null)

# 3. Générer le contenu de la newsletter
WEEK_NUM=$(date +%V)
YEAR=$(date +%Y)
SUBJECT="World Auto France - Newsletter Semaine $WEEK_NUM"
TITLE="Les actualités de la semaine"
CONTENT="Bonjour,

Voici les dernières nouvelles de World Auto France !

$UPDATES

À bientôt sur World Auto France !"

# 4. Envoyer la newsletter
echo "Envoi de la newsletter..."
RESPONSE=$(curl -s -X POST "$API_URL/newsletter/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"subject\": \"$SUBJECT\",
    \"title\": \"$TITLE\",
    \"content\": \"$CONTENT\",
    \"cta_text\": \"Voir les annonces\",
    \"cta_link\": \"https://worldautofrance.com/annonces\"
  }")

# 5. Vérifier le résultat
SENT_COUNT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sent_count', 0))" 2>/dev/null)

if [ "$SENT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}Succès: Newsletter envoyée à $SENT_COUNT abonnés${NC}"
  echo "$(date): Newsletter envoyée avec succès à $SENT_COUNT abonnés" >> /var/log/newsletter.log
else
  echo -e "${RED}Erreur: $RESPONSE${NC}"
  echo "$(date): Erreur d'envoi - $RESPONSE" >> /var/log/newsletter.log
  exit 1
fi
