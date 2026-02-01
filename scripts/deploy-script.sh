#!/bin/bash

# 🚀 StudyHi Deployment Script for DigitalOcean (Ubuntu)
# run with: ./scripts/deploy-script.sh

set -e # Exit on error

echo "🔹 Starting Deployment Setup..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt-get update -y

# 2. Install Docker (if not present)
if ! command -v docker &> /dev/null
then
    echo "🐳 Installing Docker..."
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "✅ Docker is already installed."
fi

# 3. Setup Swap Space (Prevents crashes on 1GB/2GB Droplets)
if [ ! -f /swapfile ]; then
    echo "💾 Setting up 2GB Swap Space..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created."
else
    echo "✅ Swap already exists."
fi

# 4. Environment Check
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "Creating one from env.example..."
    cp env.example .env
fi

# 5. Build and Launch
echo "🚀 Building and Starting Containers..."
# Stop old containers if running
sudo docker compose down || true

# Build new ones
sudo docker compose up -d --build

echo " "
echo "🎉 DEPLOYMENT COMPLETE!"
echo "------------------------------------------------"
echo "🌐 Your app should be live at: http://$(curl -s ifconfig.me):3000"
echo "------------------------------------------------"
