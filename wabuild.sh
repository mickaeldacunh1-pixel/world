#!/bin/bash
# ====================================================
# World Auto France - Script de déploiement automatique
# ====================================================
# Utilisation: wabuild [options]
# Options:
#   --quick   : Déploiement rapide sans prune (garde le cache)
#   --clean   : Déploiement complet avec nettoyage du cache
#   --logs    : Affiche les logs après le déploiement
# ====================================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoire du projet
PROJECT_DIR="/var/www/worldauto"

# Fonction d'affichage
print_step() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Fonction principale
deploy() {
    local CLEAN_MODE=false
    local SHOW_LOGS=false

    # Parsing des arguments
    for arg in "$@"; do
        case $arg in
            --clean)
                CLEAN_MODE=true
                ;;
            --quick)
                CLEAN_MODE=false
                ;;
            --logs)
                SHOW_LOGS=true
                ;;
            *)
                ;;
        esac
    done

    echo ""
    echo -e "${BLUE}=====================================================${NC}"
    echo -e "${BLUE}    World Auto France - Déploiement automatique${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    echo ""

    # Vérifier que le répertoire existe
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Le répertoire $PROJECT_DIR n'existe pas"
        exit 1
    fi

    cd "$PROJECT_DIR"

    # Étape 1: Pull des dernières modifications
    print_step "Récupération des dernières modifications (git pull)..."
    git pull origin main
    print_success "Code mis à jour"

    # Étape 2: Arrêter les conteneurs
    print_step "Arrêt des conteneurs Docker..."
    docker-compose down --remove-orphans
    print_success "Conteneurs arrêtés"

    # Étape 3: Nettoyage (optionnel)
    if [ "$CLEAN_MODE" = true ]; then
        print_step "Nettoyage complet du cache Docker..."
        docker system prune -af
        print_success "Cache Docker nettoyé"
    fi

    # Étape 4: Build
    print_step "Construction des images Docker..."
    if [ "$CLEAN_MODE" = true ]; then
        docker-compose build --no-cache
    else
        docker-compose build
    fi
    print_success "Images construites"

    # Étape 5: Démarrage
    print_step "Démarrage des conteneurs..."
    docker-compose up -d
    print_success "Conteneurs démarrés"

    # Vérification finale
    echo ""
    print_step "Vérification du statut..."
    sleep 3
    docker-compose ps

    echo ""
    print_success "Déploiement terminé avec succès!"
    echo ""

    # Afficher les logs si demandé
    if [ "$SHOW_LOGS" = true ]; then
        print_step "Affichage des logs (Ctrl+C pour quitter)..."
        docker-compose logs -f --tail=50
    fi
}

# Exécuter
deploy "$@"
