#!/bin/bash
# =============================================================
# Script d'envoi automatique de newsletter - World Auto France
# =============================================================
# 
# Configuration cron (envoi chaque lundi à 9h) :
# crontab -e
# 0 9 * * 1 /var/www/worldauto/send_newsletter.sh >> /var/log/newsletter.log 2>&1
#
# =============================================================

# CONFIGURATION - Remplacez par votre clé secrète
NEWSLETTER_SECRET_KEY="VOTRE_CLE_SECRETE_ICI"

# URL de l'API
API_URL="https://worldautofrance.com/api"

# =============================================================

echo "$(date): Démarrage envoi newsletter automatique..."

# Envoi de la newsletter
RESPONSE=$(curl -s -X POST "$API_URL/newsletter/send-auto" \
  -H "Content-Type: application/json" \
  -d "{\"secret_key\": \"$NEWSLETTER_SECRET_KEY\"}")

# Vérifier le résultat
SENT_COUNT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sent_count', 0))" 2>/dev/null)

if [ "$SENT_COUNT" -gt 0 ]; then
  echo "$(date): ✅ Newsletter envoyée à $SENT_COUNT abonnés"
else
  echo "$(date): ❌ Erreur - $RESPONSE"
fi
