# Docker Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- Git for cloning the repository

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MauLom/laboratorioCelular-POS.git
   cd laboratorioCelular-POS
   ```

2. **Start development environment:**
   ```bash
   ./deploy.sh development
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

## Available Commands

```bash
# Deploy in development mode
./deploy.sh dev

# Deploy in production mode  
./deploy.sh prod

# Stop all services
./deploy.sh stop

# View logs
./deploy.sh logs

# View service status
./deploy.sh status

# Remove all services and data
./deploy.sh down
```

## Development vs Production

### Development Mode
- Hot reload for backend (nodemon)
- Development build for frontend
- MongoDB with default credentials
- All ports exposed for debugging

### Production Mode
- Optimized builds
- Nginx reverse proxy
- SSL/HTTPS support
- Security headers and rate limiting
- Health checks for all services

## Environment Configuration

### Development
Uses `.env.docker` files with default development settings.

### Production
1. Copy environment template:
   ```bash
   cp .env.prod.example .env.prod
   ```

2. Update the values in `.env.prod`:
   - Set strong MongoDB password
   - Set secure JWT secret
   - Configure your domain name

3. Deploy:
   ```bash
   source .env.prod
   ./deploy.sh production
   ```

## Troubleshooting

### Port Conflicts
If you get port conflicts, stop other services:
```bash
# Stop other MongoDB instances
sudo systemctl stop mongod

# Stop other Node.js processes
killall node

# Stop nginx if running
sudo systemctl stop nginx
```

### Container Issues
```bash
# Rebuild containers
docker compose down
docker compose up --build

# View container logs
docker compose logs backend
docker compose logs frontend
docker compose logs mongo

# Execute commands in containers
docker compose exec backend npm run create-admin
docker compose exec mongo mongosh
```

### Database Issues
```bash
# Reset MongoDB data
./deploy.sh down  # This removes all volumes
./deploy.sh dev   # Fresh start

# Create admin user
docker compose exec backend npm run create-admin
```

## File Structure

```
├── docker-compose.yml           # Development configuration
├── docker-compose.prod.yml      # Production configuration  
├── docker-compose.override.yml  # Development overrides
├── deploy.sh                    # Deployment script
├── mongo-init.js                # MongoDB initialization
├── nginx/                       # Nginx configuration for production
├── backend/
│   ├── Dockerfile               # Backend container
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile               # Frontend container
│   ├── nginx.conf               # Nginx config for frontend
│   └── .dockerignore
└── .env.prod.example            # Production environment template
```

## Production Deployment

For production deployment on a VPS, see [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions including:
- DigitalOcean VPS setup
- SSL certificate configuration
- Cloudflare integration
- Security best practices