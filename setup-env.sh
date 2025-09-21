#!/bin/bash

# Environment setup script for Laboratorio Celular POS
# Usage: ./setup-env.sh [development|docker|production]

ENV_TYPE="${1:-development}"

echo "🔧 Setting up environment for: $ENV_TYPE"

case $ENV_TYPE in
  "development")
    echo "📄 Copying development environment files..."
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ;;
  "docker")
    echo "🐳 Copying Docker environment files..."
    cp backend/.env.docker backend/.env
    cp frontend/.env.docker frontend/.env
    ;;
  "production")
    echo "🚀 Copying production environment files..."
    cp backend/.env.production backend/.env
    cp frontend/.env.production frontend/.env
    echo "⚠️  Don't forget to update the URLs and credentials in the .env files!"
    ;;
  *)
    echo "❌ Invalid environment type. Use: development, docker, or production"
    exit 1
    ;;
esac

echo "✅ Environment setup complete for $ENV_TYPE"
echo ""
echo "Next steps:"
echo "1. Review and update the .env files as needed"
echo "2. Install dependencies:"
echo "   cd backend && npm install"
echo "   cd frontend && npm install"
echo "3. Start the applications:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm start"