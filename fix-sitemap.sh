#!/bin/bash
# ====================================================
# World Auto France - Fix Sitemap XML
# ====================================================
# Utilisation: ./fix-sitemap.sh
# ====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}    World Auto France - Diagnostic Sitemap${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# 1. Test du sitemap via le site public
echo -e "${BLUE}[1]${NC} Test du sitemap public..."
CONTENT_TYPE=$(curl -sI https://worldautofrance.com/sitemap.xml | grep -i "content-type" | head -1)
FIRST_LINE=$(curl -s https://worldautofrance.com/sitemap.xml | head -1)

echo "    Content-Type: $CONTENT_TYPE"
echo "    Première ligne: $FIRST_LINE"

if echo "$FIRST_LINE" | grep -q "<?xml"; then
    echo -e "    ${GREEN}✓ Sitemap OK - Format XML${NC}"
    SITEMAP_OK=true
else
    echo -e "    ${RED}✗ Sitemap KO - Format HTML détecté${NC}"
    SITEMAP_OK=false
fi

# 2. Test direct du backend
echo ""
echo -e "${BLUE}[2]${NC} Test du backend directement..."
BACKEND_FIRST=$(curl -s http://localhost:8001/sitemap.xml | head -1)
echo "    Backend répond: $BACKEND_FIRST"

if echo "$BACKEND_FIRST" | grep -q "<?xml"; then
    echo -e "    ${GREEN}✓ Backend OK${NC}"
else
    echo -e "    ${RED}✗ Backend KO${NC}"
fi

# 3. Vérifier la config nginx
echo ""
echo -e "${BLUE}[3]${NC} Vérification config nginx..."
docker exec worldauto-frontend nginx -t 2>&1

# 4. Vérifier que la route sitemap est bien configurée
echo ""
echo -e "${BLUE}[4]${NC} Vérification route sitemap dans nginx..."
docker exec worldauto-frontend cat /etc/nginx/conf.d/default.conf | grep -A5 "location = /sitemap.xml"

# 5. Si le sitemap est KO, proposer les corrections
if [ "$SITEMAP_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}=====================================================${NC}"
    echo -e "${YELLOW}    CORRECTION AUTOMATIQUE${NC}"
    echo -e "${YELLOW}=====================================================${NC}"
    echo ""
    
    echo -e "${BLUE}[5]${NC} Rechargement de la config nginx..."
    docker exec worldauto-frontend nginx -s reload
    
    sleep 2
    
    # Re-test
    echo ""
    echo -e "${BLUE}[6]${NC} Re-test après correction..."
    NEW_FIRST=$(curl -s https://worldautofrance.com/sitemap.xml | head -1)
    
    if echo "$NEW_FIRST" | grep -q "<?xml"; then
        echo -e "    ${GREEN}✓ CORRIGÉ ! Sitemap maintenant en XML${NC}"
    else
        echo -e "    ${RED}✗ Toujours KO - Redémarrage complet nécessaire${NC}"
        echo ""
        echo -e "${YELLOW}Exécute: docker-compose restart frontend${NC}"
        echo -e "${YELLOW}Ou: wabuild --restart${NC}"
    fi
fi

echo ""
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}    Diagnostic terminé${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""
