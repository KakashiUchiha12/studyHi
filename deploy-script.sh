#!/bin/bash

# StudyHi Deployment Script
# This script automates the deployment process on the DigitalOcean server.

set -e # Exit on any error

echo "🚀 Starting deployment..."

# 0. Check for Swap (OOM prevention)
SWAP_SIZE=$(free -m | grep -i swap | awk '{print $2}')
if [ "$SWAP_SIZE" -lt 1024 ]; then
    echo "⚠️ Warning: Swap space is less than 1GB ($SWAP_SIZE MB)."
    echo "This may cause the build to crash on a 2GB droplet."
    echo "Please consider adding swap with: fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile"
fi

# 1. Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# 2. Check for .env.production
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create it based on the deployment guide."
    exit 1
fi

# 3. Create Docker volumes if they don't exist
echo "📦 Ensuring Docker volumes exist..."
docker volume create studyhiapp27thjanuary_mysql_data || true
docker volume create studyhiapp27thjanuary_redis_data || true
docker volume create studyhiapp27thjanuary_uploads_data || true

# 4. Build and start containers
echo "🏗️ Building and starting Docker containers..."
# Use --build-arg if needed, but we pinned versions now
docker-compose build --no-cache
docker-compose up -d

# 5. Run database migrations
echo "🗄️ Running database migrations..."
# Wait a few seconds for MySQL to be ready
sleep 15
docker-compose exec -T app npx prisma migrate deploy

# 6. Check status
echo "🔍 Checking container status..."
docker-compose ps

echo "✅ Deployment complete!"
echo "Your application should be live at: https://139.59.93.248 (or your domain)"
echo "If this is a new setup, don't forget to run SSL setup if not already done."
