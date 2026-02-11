#!/bin/bash

# Verification script for StudyHi deployment

echo "🔍 Verifying StudyHi Deployment..."
echo ""

# Check if containers are running
echo "1. Checking Docker containers..."
docker compose ps

echo ""
echo "2. Checking application logs..."
docker compose logs app --tail=20

echo ""
echo "3. Checking if SSL certificates exist..."
if [ -f "/etc/letsencrypt/live/studyhi.me/fullchain.pem" ]; then
    echo "✅ SSL certificate found for studyhi.me"
    openssl x509 -in /etc/letsencrypt/live/studyhi.me/fullchain.pem -noout -dates
else
    echo "❌ SSL certificate NOT found. You need to run:"
    echo "   certbot certonly --standalone -d studyhi.me -d www.studyhi.me"
fi

echo ""
echo "4. Testing application health..."
curl -I http://localhost:3000 2>/dev/null | head -n 1

echo ""
echo "5. Checking nginx configuration..."
docker compose exec nginx nginx -t

echo ""
echo "✅ Verification complete!"
echo ""
echo "🌐 Your application should be accessible at:"
echo "   - http://139.59.93.248:3000 (direct)"
echo "   - https://studyhi.me (via nginx with SSL)"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure your domain DNS points to 139.59.93.248"
echo "   2. If SSL cert doesn't exist, stop nginx and run certbot"
echo "   3. Test your application at https://studyhi.me"
