#!/bin/bash
# ====================================================
# World Auto France - Script de déploiement automatique
# ====================================================
# Utilisation: wabuild [options]
# Options:
#   --quick   : Déploiement rapide sans prune (garde le cache)
#   --clean   : Déploiement complet avec nettoyage du cache
#   --logs    : Affiche les logs après le déploiement
#   --status  : Affiche uniquement le statut des conteneurs
#   --restart : Redémarre les conteneurs sans rebuild
# ====================================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_info() {
    echo -e "${CYAN}[i]${NC} $1"
}

# Fonction pour vérifier la santé des services
wait_for_healthy() {
    local service=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    print_step "Attente que $service soit prêt..."
    
    while [ $attempt -le $max_attempts ]; do
        health=$(docker inspect --format='{{.State.Health.Status}}' "worldauto-$service" 2>/dev/null || echo "unknown")
        
        if [ "$health" = "healthy" ]; then
            print_success "$service est prêt !"
            return 0
        elif [ "$health" = "unhealthy" ]; then
            print_error "$service est en erreur !"
            docker logs --tail=20 "worldauto-$service"
            return 1
        fi
        
        echo -ne "\r${YELLOW}[!]${NC} Tentative $attempt/$max_attempts - Status: $health    "
        sleep 2
        ((attempt++))
    done
    
    echo ""
    print_warning "$service n'est pas encore prêt après $max_attempts tentatives"
    return 1
}

# Fonction pour afficher le statut
show_status() {
    echo ""
    echo -e "${BLUE}=====================================================${NC}"
    echo -e "${BLUE}    World Auto France - Statut des services${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    echo ""
    
    docker-compose ps
    
    echo ""
    print_info "Santé des services:"
    for service in mongodb backend frontend; do
        container="worldauto-$service"
        if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
            health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no healthcheck")
            status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
            
            if [ "$health" = "healthy" ] || [ "$health" = "no healthcheck" -a "$status" = "running" ]; then
                echo -e "  ${GREEN}●${NC} $service: $status ($health)"
            else
                echo -e "  ${RED}●${NC} $service: $status ($health)"
            fi
        else
            echo -e "  ${RED}○${NC} $service: arrêté"
        fi
    done
    echo ""
}

# Fonction pour redémarrer sans rebuild
restart_services() {
    echo ""
    echo -e "${BLUE}=====================================================${NC}"
    echo -e "${BLUE}    World Auto France - Redémarrage des services${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    echo ""
    
    cd "$PROJECT_DIR"
    
    print_step "Redémarrage des conteneurs..."
    docker-compose restart
    
    sleep 5
    show_status
}

# Fonction principale
deploy() {
    local CLEAN_MODE=false
    local SHOW_LOGS=false
    local ONLY_STATUS=false
    local ONLY_RESTART=false

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
            --status)
                ONLY_STATUS=true
                ;;
            --restart)
                ONLY_RESTART=true
                ;;
            --help|-h)
                echo "Usage: wabuild [options]"
                echo ""
                echo "Options:"
                echo "  --quick   : Déploiement rapide (garde le cache Docker)"
                echo "  --clean   : Déploiement complet avec nettoyage du cache"
                echo "  --logs    : Affiche les logs après le déploiement"
                echo "  --status  : Affiche uniquement le statut des conteneurs"
                echo "  --restart : Redémarre les conteneurs sans rebuild"
                echo "  --help    : Affiche cette aide"
                exit 0
                ;;
            *)
                ;;
        esac
    done

    # Actions spéciales
    if [ "$ONLY_STATUS" = true ]; then
        cd "$PROJECT_DIR"
        show_status
        exit 0
    fi

    if [ "$ONLY_RESTART" = true ]; then
        restart_services
        exit 0
    fi

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
    if git pull origin main; then
        print_success "Code mis à jour"
    else
        print_warning "Pas de nouvelles modifications ou erreur git"
    fi

    # Étape 2: Arrêter les conteneurs
    print_step "Arrêt des conteneurs Docker..."
    docker-compose down --remove-orphans 2>/dev/null || true
    print_success "Conteneurs arrêtés"

    # Étape 3: Nettoyage (optionnel)
    if [ "$CLEAN_MODE" = true ]; then
        print_step "Nettoyage complet du cache Docker..."
        docker system prune -af --volumes 2>/dev/null || true
        print_success "Cache Docker nettoyé"
    fi

    # Étape 4: Build
    print_step "Construction des images Docker..."
    if [ "$CLEAN_MODE" = true ]; then
        if ! docker-compose build --no-cache; then
            print_error "Erreur lors du build"
            exit 1
        fi
    else
        if ! docker-compose build; then
            print_error "Erreur lors du build"
            exit 1
        fi
    fi
    print_success "Images construites"

    # Étape 5: Démarrage
    print_step "Démarrage des conteneurs..."
    docker-compose up -d
    print_success "Conteneurs démarrés"

    # Étape 6: Attendre que les services soient prêts
    echo ""
    print_info "Vérification de la santé des services..."
    
    # Attendre MongoDB
    if ! wait_for_healthy "mongodb" 30; then
        print_error "MongoDB n'a pas démarré correctement"
        print_warning "Affichage des logs MongoDB:"
        docker logs --tail=30 worldauto-mongodb
        exit 1
    fi
    
    # Attendre Backend
    if ! wait_for_healthy "backend" 60; then
        print_error "Le backend n'a pas démarré correctement"
        print_warning "Affichage des logs Backend:"
        docker logs --tail=50 worldauto-backend
        exit 1
    fi

    # Vérification finale
    echo ""
    show_status

    # Test rapide de l'API
    print_step "Test de l'API..."
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        print_success "API accessible et fonctionnelle !"
    else
        print_warning "L'API ne répond pas encore, attendez quelques secondes..."
    fi

    echo ""
    echo -e "${GREEN}=====================================================${NC}"
    echo -e "${GREEN}    ✓ Déploiement terminé avec succès !${NC}"
    echo -e "${GREEN}=====================================================${NC}"
    echo ""
    print_info "Site accessible sur: https://worldautofrance.com"
    echo ""

    # Afficher les logs si demandé
    if [ "$SHOW_LOGS" = true ]; then
        print_step "Affichage des logs (Ctrl+C pour quitter)..."
        docker-compose logs -f --tail=50
    fi
}

# Exécuter
deploy "$@"
