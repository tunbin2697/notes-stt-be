#!/bin/bash

###############################################################################
# 🚀 Production Deployment Script
# 
# Purpose: Automated deployment triggered by GitHub webhook
# Location: ~/projects/notes-stt-deploy/deploy.sh
# Trigger: GitHub webhook on 'production' branch push
#
# What it does:
# 1. Pull latest code from production branch
# 2. Rebuild backend Docker containers
# 3. Run database migrations
# 4. Build frontend and sync to /var/www/notes-stt.baokhangdev.click
###############################################################################

set -e  # Exit on any error

# Configuration
PROJECT_NAME="notes-stt"
BACKEND_DIR="$HOME/projects/notes-stt-deploy/backend"
FRONTEND_DIR="$HOME/projects/notes-stt-deploy/frontend"
FRONTEND_SERVE_DIR="/var/www/notes-stt.baokhangdev.click"
BRANCH="production"
LOG_FILE="$HOME/projects/notes-stt-deploy/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Start deployment
log "========================================="
log "🚀 Starting deployment for $PROJECT_NAME"
log "========================================="

###############################################################################
# 1. Pull latest code
###############################################################################
log "📥 Pulling latest code from $BRANCH branch..."

cd "$BACKEND_DIR" || { error "Backend directory not found: $BACKEND_DIR"; exit 1; }

# Stash any local changes (like .env files)
git stash --include-untracked || true

# Pull latest code
if git pull origin "$BRANCH"; then
    log "✅ Code pulled successfully"
else
    error "Failed to pull code from $BRANCH"
    git stash pop || true
    exit 1
fi

# Restore stashed files (including .env)
git stash pop || log "No stashed changes to restore"

###############################################################################
# 2. Backend: Rebuild Docker containers
###############################################################################
log "🐳 Rebuilding backend Docker containers..."

cd "$BACKEND_DIR" || exit 1

# Check if .env exists
if [ ! -f .env ]; then
    error ".env file not found in $BACKEND_DIR"
    error "Please create .env file before deploying"
    exit 1
fi

# Stop and remove old containers
log "🛑 Stopping old containers..."
docker-compose down || warn "No containers to stop"

# Build and start new containers
log "🔨 Building new containers..."
if docker-compose up -d --build; then
    log "✅ Containers built and started successfully"
else
    error "Failed to build/start containers"
    exit 1
fi

# Wait for containers to be healthy
log "⏳ Waiting for containers to be healthy..."
sleep 10

# Check container status
if docker-compose ps | grep -q "Up"; then
    log "✅ Containers are running"
else
    error "Containers failed to start"
    docker-compose logs --tail=50
    exit 1
fi

###############################################################################
# 3. Backend: Run database migrations
###############################################################################
log "🗄️  Running database migrations..."

if docker-compose exec -T backend npx prisma migrate deploy; then
    log "✅ Database migrations completed"
else
    warn "Database migrations failed or no migrations to run"
fi

###############################################################################
# 4. Backend: Health check
###############################################################################
log "🏥 Checking backend health..."

# Wait a bit for the app to fully start
sleep 5

# Check if backend is responding
if curl -f -s http://localhost:3000/graphql?query={__typename} > /dev/null; then
    log "✅ Backend health check passed"
else
    error "Backend health check failed"
    docker-compose logs --tail=100 backend
    exit 1
fi

###############################################################################
# 5. Frontend: Build and deploy
###############################################################################
log "🎨 Building and deploying frontend..."

cd "$FRONTEND_DIR" || { error "Frontend directory not found: $FRONTEND_DIR"; exit 1; }

# Install dependencies
log "📦 Installing frontend dependencies..."
if npm ci; then
    log "✅ Dependencies installed"
else
    error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend
log "🔨 Building frontend..."
if npm run build; then
    log "✅ Frontend built successfully"
else
    error "Frontend build failed"
    exit 1
fi

# Sync built files to web server directory
log "📤 Syncing files to $FRONTEND_SERVE_DIR..."

# Create directory if it doesn't exist
sudo mkdir -p "$FRONTEND_SERVE_DIR"

# Sync files (replace 'dist' with your build output directory)
if sudo rsync -av --delete dist/ "$FRONTEND_SERVE_DIR/"; then
    log "✅ Frontend files synced successfully"
else
    error "Failed to sync frontend files"
    exit 1
fi

# Set proper permissions
log "🔒 Setting file permissions..."
sudo chown -R www-data:www-data "$FRONTEND_SERVE_DIR"
sudo chmod -R 755 "$FRONTEND_SERVE_DIR"

###############################################################################
# 6. Cleanup
###############################################################################
log "🧹 Cleaning up..."

# Remove old Docker images
docker image prune -f || true

# Clean up logs older than 30 days
find "$HOME/projects/notes-stt-deploy" -name "*.log" -type f -mtime +30 -delete || true

###############################################################################
# 7. Deployment complete
###############################################################################
log "========================================="
log "✅ Deployment completed successfully!"
log "========================================="
log ""
log "Backend:  http://localhost:3000/graphql"
log "Frontend: http://notes-stt.baokhangdev.click"
log ""
log "📊 Container status:"
cd "$BACKEND_DIR" && docker-compose ps

exit 0
