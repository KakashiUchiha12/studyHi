#!/bin/bash

# 🚀 StudyHi Unified Deployment Script
# This script handles both backend synchronization and frontend deployment
# for the new Engagement Metrics (View Tracking) system.

set -e # Exit on error

echo "------------------------------------------------"
echo "🚀 Starting Production Deployment"
echo "------------------------------------------------"

# 1. Pull Latest Changes
echo "📥 Pulling latest changes from main..."
git pull origin main

# 2. Install Dependencies
echo "📦 Installing/Updating dependencies..."
npm install

# 3. Prisma Synchronization
echo "🗄️  Synchronizing Database Schema..."
# This ensures viewCount fields are added to the production DB
npx prisma db push --accept-data-loss
npx prisma generate

# 4. Build Application
echo "🏗️  Building application..."
npm run build

# 5. Restart Application
echo "♻️  Restarting production services..."
if command -v pm2 &> /dev/null
then
    pm2 restart all || pm2 start npm --name "studyhi" -- start
else
    # Fallback to docker compose if present
    if [ -f "docker-compose.yml" ]; then
        sudo docker compose up -d --build
    else
        echo "⚠️  No process manager (PM2/Docker) found. Please restart manually."
    fi
fi

echo "------------------------------------------------"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "------------------------------------------------"
