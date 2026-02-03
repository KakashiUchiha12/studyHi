#!/bin/bash
set -e

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Stop existing containers to ensure clean state (optional but safer for port changes)
docker compose down

# Rebuild and start containers
docker compose up -d --build

# Run database migrations
echo "Running database migrations..."
docker compose exec -T app sh -c "export HOME=/tmp && npx prisma migrate deploy"

# Prune unused images to save space
docker image prune -f

echo "Deployment complete! Application should be running at http://139.59.93.248.nip.io"
