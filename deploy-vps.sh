#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/marketing-dashboard"
APP_NAME="marketing-dashboard"
PORT="3000"

apt update
apt install -y curl nginx

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

mkdir -p "$APP_DIR"
tar -xzf /tmp/marketing-dashboard.tar.gz -C "$APP_DIR"
cd "$APP_DIR"

npm ci
npm run build

pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
pm2 start npm --name "$APP_NAME" -- start -- -p "$PORT"
pm2 save

cat >/etc/nginx/sites-available/marketing-dashboard <<NGINX
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/marketing-dashboard /etc/nginx/sites-enabled/marketing-dashboard
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "Dashboard publicado em http://82.29.58.39"
