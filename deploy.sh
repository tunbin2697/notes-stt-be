#!/bin/bash

# Minimal webhook-friendly deployment script for backend
# Assumptions:
# - This script is located in the repo root on the deployment host
# - The repo has a `production` branch that contains the code to deploy
# - `docker` and `docker-compose` are installed and available to the SSH user
# - Environment variables (such as .env) are present on the server and not overwritten by git

set -euo pipefail

BRANCH="production"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${REPO_DIR}/deploy.log"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"; }

log "========================================="
log "Starting webhook deployment: branch=$BRANCH, repo=$REPO_DIR"
log "========================================="

cd "$REPO_DIR"

# Ensure we have the repository and origin
if [ ! -d .git ]; then
    error "No .git directory found in $REPO_DIR"
    exit 1
fi

log "Fetching latest from origin/$BRANCH"
git fetch --all --prune

# Checkout and align with remote branch (clean reset for a deterministic deploy)
if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    git checkout "$BRANCH"
else
    git checkout -b "$BRANCH" "origin/$BRANCH"
fi
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fdx

log "Repository updated to $(git rev-parse --short HEAD)"

# Create/update .env file if it doesn't exist
if [ ! -f .env ]; then
    log "Creating .env file from template"
    if [ -f /etc/notes-stt/.env ]; then
        cp /etc/notes-stt/.env .env
        log ".env file created from /etc/notes-stt/.env"
    else
        error ".env file not found. Please create /etc/notes-stt/.env or add .env to repo root"
        exit 1
    fi
else
    log ".env file already exists, skipping creation"
fi

log "Bringing down existing containers (if any)"
docker-compose down || log "docker-compose down returned non-zero"

log "Building and starting containers (clean rebuild)"
# Use --build and --force-recreate for a clean restart
docker-compose up -d --build --force-recreate --remove-orphans

log "Waiting for services to initialize..."
sleep 5

# Optional: run Prisma migrations explicitly (container command may already run them)
log "Running database migrations inside backend container (if applicable)"
if docker-compose ps --services | grep -q '^backend$'; then
    if docker-compose exec -T backend npx prisma migrate deploy; then
        log "Database migrations completed"
    else
        log "No migrations run or migrations failed (continuing)"
    fi
else
    log "Backend service not found in docker-compose; skipping explicit migrations"
fi

# Health check loop
HEALTH_URL="http://localhost:3000/graphql?query={__typename}"
MAX_ATTEMPTS=12
SLEEP_SECONDS=5
attempt=1
until [ $attempt -gt $MAX_ATTEMPTS ]
do
    if curl -sf "$HEALTH_URL" >/dev/null; then
        log "Backend health check passed (attempt $attempt)"
        break
    else
        log "Backend not healthy yet (attempt $attempt/$MAX_ATTEMPTS), sleeping $SLEEP_SECONDSs"
        sleep $SLEEP_SECONDS
    fi
    attempt=$((attempt+1))
done

if [ $attempt -gt $MAX_ATTEMPTS ]; then
    error "Backend failed health checks after $MAX_ATTEMPTS attempts"
    docker-compose logs --tail=200 backend || true
    exit 1
fi

log "Cleaning up unused Docker images"
docker image prune -f || true

log "Deployment finished successfully"
log "Container status:"
docker-compose ps | tee -a "$LOG_FILE"

exit 0
