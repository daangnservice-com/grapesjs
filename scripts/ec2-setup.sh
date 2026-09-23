#!/bin/bash
# ==============================================================================
# Daangn Service Careers App - Amazon Linux 2023 Deployment Script
# Execute via AWS SSM Session Manager (cd /home/ssm-user)
# ==============================================================================

set -e

echo "🚀 [1/6] Updating system packages & installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs nginx git

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

echo "🚀 [2/6] Installing PM2 process manager globally..."
sudo npm install -g pm2

echo "🚀 [3/6] Setting up project directory and installing dependencies..."
cd /home/ssm-user
if [ -d "careers" ]; then
    cd careers
    git pull origin main
else
    # Assuming code is cloned or present in /home/ssm-user/careers
    mkdir -p careers
    cd careers
fi

npm install --production --legacy-peer-deps

echo "🚀 [4/6] Setting up .env configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️ .env created from .env.example. Please review credentials if needed."
fi

echo "🚀 [5/6] Setting up Nginx Reverse Proxy..."
sudo cp nginx/daangnservice.conf /etc/nginx/conf.d/daangnservice.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "🚀 [6/6] Starting application with PM2..."
pm2 start app/server.js --name careers || pm2 restart careers
pm2 save

echo "=============================================================================="
echo "🎉 Deployment Completed Successfully!"
echo "📌 PM2 Status:"
pm2 status
echo "📌 Health Check locally: curl http://localhost:3000/health"
echo "=============================================================================="
