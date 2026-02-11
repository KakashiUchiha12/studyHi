#!/bin/bash

# Script to fix missing database tables on production
echo "🔧 Fixing StudyHi Database Schema..."

# Find the app container name
APP_CONTAINER=$(docker ps --filter "name=studyhi-app" --format "{{.Names}}" | head -n 1)

if [ -z "$APP_CONTAINER" ]; then
    echo "❌ Could not find studyhi-app container. Is the application running?"
    exit 1
fi

echo "📦 Syncing schema in container: $APP_CONTAINER"

# Run prisma db push inside the container
# This will create missing tables based on the schema.prisma
docker exec -it "$APP_CONTAINER" npx prisma db push

echo ""
echo "🔄 Restarting application container to refresh Prisma client..."
docker restart "$APP_CONTAINER"

echo "✅ Database schema sync complete!"
echo "Please check https://studyhi.me/projects now."
