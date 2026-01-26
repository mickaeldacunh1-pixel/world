#!/bin/bash
# ====================================================
# World Auto France - Newsletter Auto Send
# Exécuté par cron chaque lundi à 9h00
# ====================================================

curl -X POST https://worldautofrance.com/api/newsletter/send-auto \
  -H "Content-Type: application/json" \
  -d '{"secret_key":"admin0123456789-9876543210"}'

echo ""
echo "[$(date)] Newsletter envoyée"
