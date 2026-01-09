#!/bin/bash
echo ""
echo "========================================"
echo "  CODE AGENT - Assistant de Dev"
echo "========================================"
echo ""
echo "Installation des dépendances..."
pip3 install -r requirements.txt -q
echo ""
echo "Lancement de l'agent..."
python3 agent.py
