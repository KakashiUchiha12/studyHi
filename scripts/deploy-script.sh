#!/bin/bash

# StudyHi Deployment Script for DigitalOcean (Ubuntu)

echo "🚀 Starting Deployment Setup..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker not found. Installing..."
    # Add Docker's official GPG key:
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the repository to Apt sources:
    echo \
      "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    echo "✅ Docker installed successfully."
else
    echo "✅ Docker is already installed."
fi

# 3. Start Application
echo "🚀 Starting Application with Docker Compose..."
# We use the prod compose file but call it via the plugin
sudo docker compose -f docker-compose.prod.yml up -d --build

echo "✅ Deployment complete! Your app should be running on port 3000."
echo "   Test it at: http://$(curl -s ifconfig.me):3000"
