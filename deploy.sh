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
SCRIPT_PATH="${REPO_DIR}/deploy.sh"
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
git fetch --all --prune 2>&1 | tee -a "$LOG_FILE"
log "Fetch completed"

# Checkout and align with remote branch (clean reset for a deterministic deploy)
if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    log "Checking out existing branch: $BRANCH"
    git checkout "$BRANCH" 2>&1 | tee -a "$LOG_FILE"
else
    log "Creating new local branch: $BRANCH from origin/$BRANCH"
    git checkout -b "$BRANCH" "origin/$BRANCH" 2>&1 | tee -a "$LOG_FILE"
fi

log "Resetting to origin/$BRANCH"
git fetch origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"
git reset --hard "origin/$BRANCH" 2>&1 | tee -a "$LOG_FILE"
log "Cleaning untracked files"
git clean -fdx 2>&1 | tee -a "$LOG_FILE"

# CRITICAL: Restore execute permission immediately after git reset
# git reset --hard replaces deploy.sh with the version from git, which may not have +x
log "Restoring execute permission on deploy.sh after git reset..."
chmod +x "$SCRIPT_PATH" 2>&1 | tee -a "$LOG_FILE"
log "✓ Execute permission restored for next webhook run"

CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_COMMIT_MSG=$(git log -1 --pretty=%B | head -n 1)
log "Repository updated to commit: $CURRENT_COMMIT"
log "Commit message: $CURRENT_COMMIT_MSG"

# Create/update .env file if it doesn't exist
log "Checking for .env file"
if [ ! -f .env ]; then
    log ".env file not found, creating from template"
    if [ -f /etc/notes-stt/.env ]; then
        cp /etc/notes-stt/.env .env
        log "✓ .env file created from /etc/notes-stt/.env"
        log "  Environment variables loaded: $(grep -c '^[^#]' .env) variables"
    else
        error ".env file not found. Please create /etc/notes-stt/.env or add .env to repo root"
        exit 1
    fi
else
    log "✓ .env file already exists ($(grep -c '^[^#]' .env) variables loaded)"
fi

log "Stopping and removing only this application's containers"
docker-compose down 2>&1 | tee -a "$LOG_FILE" || log "docker-compose down returned non-zero"
log "Containers stopped and removed"

log "Building Docker images (this may take a while)..."
log "Build output:"
log "----------------------------------------"
# Build first with output visible in logs
docker-compose build 2>&1 | tee -a "$LOG_FILE"
BUILD_EXIT_CODE=${PIPESTATUS[0]}
log "----------------------------------------"
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    log "Docker build completed successfully"
else
    error "Docker build failed with exit code $BUILD_EXIT_CODE"
    exit 1
fi

log "Starting containers in detached mode"
docker-compose up -d 2>&1 | tee -a "$LOG_FILE"
log "Containers started"

log "Waiting for services to initialize (10 seconds)..."
sleep 10
log "Initial wait completed, starting health checks"

# Health check loop
log "Starting health check loop"
MAX_ATTEMPTS=12
SLEEP_SECONDS=5
attempt=1
until [ $attempt -gt $MAX_ATTEMPTS ]
do
    log "Health check attempt $attempt/$MAX_ATTEMPTS..."
    if curl -sf -X POST http://localhost:3000/graphql \
        -H "Content-Type: application/json" \
        -d '{"query":"{ health }"}' | grep -q '"health"'; then
        log "✓ Backend health check PASSED (attempt $attempt)"
        log "✓ Backend is healthy and responding"
        break
    else
        log "✗ Backend not healthy yet (attempt $attempt/$MAX_ATTEMPTS)"
        if [ $attempt -lt $MAX_ATTEMPTS ]; then
            log "  Waiting ${SLEEP_SECONDS}s before next attempt..."
            sleep $SLEEP_SECONDS
        fi
    fi
    attempt=$((attempt+1))
done

if [ $attempt -gt $MAX_ATTEMPTS ]; then
    error "Backend FAILED health checks after $MAX_ATTEMPTS attempts"
    error "Dumping last 200 lines of backend logs:"
    log "========================================="
    docker-compose logs --tail=200 backend 2>&1 | tee -a "$LOG_FILE" || true
    log "========================================="
    exit 1
fi

log "Cleaning up dangling images for this application only"
PRUNED=$(docker image prune -f --filter "dangling=true" 2>&1)
if echo "$PRUNED" | grep -q "Total reclaimed space"; then
    RECLAIMED=$(echo "$PRUNED" | grep "Total reclaimed space" | awk '{print $NF}')
    log "✓ Cleanup completed: reclaimed $RECLAIMED"
else
    log "✓ No dangling images to clean up"
fi

log "========================================="
log "🎉 DEPLOYMENT FINISHED SUCCESSFULLY"
log "========================================="
log "Container status:"
docker-compose ps 2>&1 | tee -a "$LOG_FILE"

log ""
log "Deployment summary:"
log "  Branch: $BRANCH"
log "  Commit: $CURRENT_COMMIT - $CURRENT_COMMIT_MSG"
log "  Backend API: http://localhost:3000/graphql"
log "  Health check: PASSED"
log ""
log "Full logs available at: $LOG_FILE"
log "========================================="

exit 0
