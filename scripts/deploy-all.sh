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

# 2. Rebuild and Restart Containers
echo "🐳 Rebuilding and restarting Docker containers..."
# This will:
# - Reinstall dependencies inside the container
# - Regenerate Prisma Client
# - Build the Next.js app
# - Run 'prisma db push' on startup
sudo docker compose up -d --build

echo "------------------------------------------------"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "------------------------------------------------"
