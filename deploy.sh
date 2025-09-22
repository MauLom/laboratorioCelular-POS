#!/bin/bash

# Laboratorio Celular POS Deployment Script
# Usage: ./deploy.sh [development|production|stop|down]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Development deployment
deploy_development() {
    print_status "Starting development deployment..."
    
    # Setup environment files
    ./setup-env.sh docker
    
    # Build and start services
    docker compose down --remove-orphans
    docker compose up --build -d
    
    print_success "Development deployment completed!"
    print_status "Services available at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:5000"
    echo "  MongoDB: localhost:27017"
}

# Production deployment
deploy_production() {
    print_status "Starting production deployment..."
    
    # Check for required environment variables
    if [ -z "$JWT_SECRET" ]; then
        print_warning "JWT_SECRET not set. Using default (not recommended for production)"
    fi
    
    if [ -z "$MONGO_ROOT_PASSWORD" ]; then
        print_warning "MONGO_ROOT_PASSWORD not set. Using default (not recommended for production)"
    fi
    
    # Setup environment files
    ./setup-env.sh production
    
    # Build and start services
    docker compose -f docker-compose.prod.yml down --remove-orphans
    docker compose -f docker-compose.prod.yml up --build -d
    
    print_success "Production deployment completed!"
    print_status "Services are running in production mode"
    print_warning "Remember to:"
    echo "  1. Update SSL certificates in ./ssl/ directory"
    echo "  2. Update domain names in nginx configuration"
    echo "  3. Set strong passwords for JWT_SECRET and MONGO_ROOT_PASSWORD"
}

# Stop services
stop_services() {
    print_status "Stopping all services..."
    docker compose down
    docker compose -f docker-compose.prod.yml down
    print_success "All services stopped"
}

# Remove services and volumes
down_services() {
    print_status "Removing all services and volumes..."
    print_warning "This will delete all data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose down --volumes --remove-orphans
        docker compose -f docker-compose.prod.yml down --volumes --remove-orphans
        print_success "All services and data removed"
    else
        print_status "Operation cancelled"
    fi
}

# Show logs
show_logs() {
    print_status "Showing logs for all services..."
    docker compose logs -f
}

# Show status
show_status() {
    print_status "Service status:"
    docker compose ps
    echo
    print_status "Production service status:"
    docker compose -f docker-compose.prod.yml ps
}

# Main script logic
case "${1:-development}" in
    "development"|"dev")
        check_docker
        deploy_development
        ;;
    "production"|"prod")
        check_docker
        deploy_production
        ;;
    "stop")
        stop_services
        ;;
    "down")
        down_services
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "build")
        check_docker
        print_status "Building all Docker images..."
        docker compose build
        print_success "All images built successfully"
        ;;
    "pull")
        check_docker
        print_status "Pulling latest base images..."
        docker compose pull
        print_success "Base images updated"
        ;;
    "restart")
        print_status "Restarting all services..."
        docker compose restart
        print_success "All services restarted"
        ;;
    "clean")
        print_status "Cleaning up unused Docker resources..."
        docker system prune -f
        print_success "Docker cleanup completed"
        ;;
    "help"|"-h"|"--help")
        echo "Laboratorio Celular POS Deployment Script"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  development, dev    Deploy in development mode (default)"
        echo "  production, prod    Deploy in production mode"
        echo "  stop                Stop all services"
        echo "  down                Remove all services and volumes"
        echo "  logs                Show logs for all services"
        echo "  status              Show status of all services"
        echo "  build               Build all Docker images"
        echo "  pull                Pull latest base images"
        echo "  restart             Restart all services"
        echo "  clean               Clean up unused Docker resources"
        echo "  help                Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        print_status "Use '$0 help' for available commands"
        exit 1
        ;;
esac