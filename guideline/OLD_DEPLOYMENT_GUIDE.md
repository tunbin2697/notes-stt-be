# 🚀 Production Deployment Guide

Complete guide for deploying the Notes STT backend to production using Docker and automated webhooks.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Docker Configuration](#docker-configuration)
4. [Webhook Deployment](#webhook-deployment)
5. [Production Checklist](#production-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Server**: Ubuntu 20.04+ with Docker & Docker Compose
- **Domain**: Configured DNS pointing to your server
- **Nginx**: Web server for reverse proxy
- **Node.js**: v20+ (v22, v24 also supported - only if building frontend on server, backend runs in Docker)
- **GitHub**: Repository with webhook access

---

## Server Setup (First Time)

### 1. Install Required Software

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install docker-compose-plugin -y

# Verify Docker installation
docker --version
docker compose version

# Install Node.js (only needed if building frontend on server)
# If you deploy pre-built frontend files, you can skip this
# Note: Backend doesn't need Node.js on host (runs in Docker container)

# Option 1: Install Node.js 20 LTS (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 2: Install Node.js 22 LTS
# curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
# sudo apt-get install -y nodejs

# Option 3: Use nvm (Node Version Manager) for flexibility
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# source ~/.bashrc
# nvm install 20  # or 22, 24
# nvm use 20

# Verify Node.js installation
node --version
npm --version

# Install Git
sudo apt-get install git -y

# Install other utilities
sudo apt-get install curl wget nano -y
```

### 2. Install and Configure Nginx

#### Install Nginx

```bash
# Install Nginx
sudo apt-get install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx

# Test: Visit http://your-server-ip in browser
# You should see "Welcome to nginx!" page
```

#### Configure Firewall

```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Check firewall status
sudo ufw status
```

#### Create Nginx Configuration

```bash
# Create new site configuration
sudo nano /etc/nginx/sites-available/notes-stt.baokhangdev.click
```

**Add this configuration:**

```nginx
# HTTP Configuration (will be upgraded to HTTPS later)
server {
    listen 80;
    listen [::]:80;
    server_name notes-stt.baokhangdev.click www.notes-stt.baokhangdev.click;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (static files)
    location / {
        root /var/www/notes-stt.baokhangdev.click;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (GraphQL endpoint)
    location /graphql {
        proxy_pass http://localhost:3000/graphql;
        proxy_http_version 1.1;

        # WebSocket support (for subscriptions if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API (REST endpoints if any)
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }

    # Webhook receiver
    location /webhook {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Only allow GitHub IPs (optional, for extra security)
        # allow 192.30.252.0/22;
        # allow 185.199.108.0/22;
        # allow 140.82.112.0/20;
        # deny all;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }

    # Access and error logs
    access_log /var/log/nginx/notes-stt.baokhangdev.click.access.log;
    error_log /var/log/nginx/notes-stt.baokhangdev.click.error.log;
}
```

#### Enable the Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/notes-stt.baokhangdev.click /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

#### Create Frontend Directory

```bash
# Create directory for frontend files
sudo mkdir -p /var/www/notes-stt.baokhangdev.click

# Set ownership to your user (temporary, for deployment)
sudo chown -R $USER:$USER /var/www/notes-stt.baokhangdev.click

# Create a placeholder index.html for testing
echo '<h1>Notes STT - Coming Soon</h1>' | sudo tee /var/www/notes-stt.baokhangdev.click/index.html

# After deployment, set proper ownership
# sudo chown -R www-data:www-data /var/www/notes-stt.baokhangdev.click
```

### 3. Configure DNS

Before proceeding, ensure your domain DNS is configured:

1. **Add A Record** pointing to your server IP:
   - Type: `A`
   - Name: `@` (or `notes-stt.baokhangdev.click`)
   - Value: `your.server.ip.address`
   - TTL: `3600` (or default)

2. **Add A Record** for www subdomain:
   - Type: `A`
   - Name: `www`
   - Value: `your.server.ip.address`
   - TTL: `3600`

3. **Wait for DNS propagation** (can take 5-60 minutes):
   ```bash
   # Check DNS propagation
   nslookup notes-stt.baokhangdev.click
   nslookup www.notes-stt.baokhangdev.click
   ```

### 4. Test Nginx Setup

```bash
# Check if Nginx is serving the site
curl http://notes-stt.baokhangdev.click

# Or visit in browser:
# http://notes-stt.baokhangdev.click
# You should see "Notes STT - Coming Soon"

# Check Nginx access logs
sudo tail -f /var/log/nginx/notes-stt.baokhangdev.click.access.log

# Check Nginx error logs
sudo tail -f /var/log/nginx/notes-stt.baokhangdev.click.error.log
```

### 5. Install SSL Certificate (Let's Encrypt)

After DNS is propagated and Nginx is working:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get SSL certificate (automatic Nginx configuration)
sudo certbot --nginx -d notes-stt.baokhangdev.click -d www.notes-stt.baokhangdev.click

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2, recommended)

# Certbot will automatically:
# 1. Get certificate from Let's Encrypt
# 2. Update Nginx configuration
# 3. Set up auto-renewal

# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates
```

**After SSL installation, your site will:**

- ✅ Be accessible via HTTPS
- ✅ Automatically redirect HTTP to HTTPS
- ✅ Auto-renew certificates before expiration

### 6. Update GitHub Webhook URL

After SSL is configured, update webhook URL to HTTPS:

1. Go to GitHub repository → **Settings** → **Webhooks**
2. Edit your webhook
3. Change **Payload URL** to: `https://notes-stt.baokhangdev.click/webhook/deploy`
4. Save changes

---

## Initial Setup

### 1. Server Directory Structure

```bash
# Create project directory
mkdir -p ~/projects/notes-stt-deploy
cd ~/projects/notes-stt-deploy

# Clone repository
git clone <your-repo-url> backend
git clone <frontend-repo-url> frontend  # If separate repo

# Your structure should look like:
~/projects/notes-stt-deploy/
├── backend/           # NestJS backend
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env
│   └── deploy.sh
└── frontend/          # Frontend app
    └── ...
```

### 2. Choose Your Deployment Strategy

#### **Option A: Build Frontend on Server** (Current setup)

- ✅ Requires Node.js on server
- ✅ Frontend is built during deployment
- ✅ Uses `deploy.sh` script as-is
- ✅ Good for: Automatic builds from source

#### **Option B: Deploy Pre-built Frontend** (Simpler, no Node.js needed)

- ✅ No Node.js required on server
- ✅ Build frontend locally or in CI/CD
- ✅ Upload dist/ files directly to `/var/www/notes-stt.baokhangdev.click`
- ✅ Good for: Faster deployments, less server dependencies

**For Option B, modify `deploy.sh`:**

```bash
# Remove these lines from deploy.sh:
# cd "$FRONTEND_DIR"
# npm ci
# npm run build

# Instead, use rsync to upload pre-built files:
# rsync -av --delete local/dist/ user@server:/var/www/notes-stt.baokhangdev.click/
```

### 3. Environment Variables

Create `.env` in the backend directory:

```bash
cd ~/projects/notes-stt-deploy/backend
nano .env
```

Add these variables:

```env
# Database
POSTGRES_PASSWORD=your_strong_password_here

# JWT (Generate: openssl rand -base64 32)
JWT_SECRET=your_super_secret_jwt_key_here

# CORS
CORS_ORIGIN=https://notes-stt.baokhangdev.click

# Server
NODE_ENV=production
PORT=3000
```

⚠️ **Important**: Never commit `.env` to Git!

---

## Docker Configuration

### Understanding the Setup

- **Dockerfile**: Multi-stage build (builder → production)
  - Final image: ~150MB
  - Non-root user for security
  - Health checks included

- **docker-compose.yml**: Orchestrates two services
  - `postgres`: PostgreSQL 17 on port 5433:5432
  - `backend`: NestJS app on port 3000

### Build and Test Locally

```bash
cd ~/projects/notes-stt-deploy/backend

# Build and start containers
docker-compose up -d --build

# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Test API
curl http://localhost:3000/graphql?query={__typename}
```

### Stop Containers

```bash
docker-compose down
```

---

## Webhook Deployment

### Why Webhooks?

For private repos on free GitHub plans, webhooks provide:

- ✅ Instant deployment on push to `production` branch
- ✅ No GitHub Actions minutes consumed
- ✅ Full control over deployment process
- ✅ Server-side execution with `deploy.sh` script

### Setup Process

#### Step 1: Install Webhook Receiver

**Option A: Using `webhook` (Go binary)**

```bash
sudo apt-get update
sudo apt-get install webhook

# Or download binary
wget https://github.com/adnanh/webhook/releases/download/2.8.0/webhook-linux-amd64.tar.gz
tar -xzf webhook-linux-amd64.tar.gz
sudo mv webhook-linux-amd64/webhook /usr/local/bin/
```

**Option B: Using Node.js Express** (see advanced section below)

#### Step 2: Create Webhook Configuration

```bash
cd ~/projects/notes-stt-deploy
nano hooks.json
```

Add this configuration:

```json
[
  {
    "id": "deploy-notes-stt",
    "execute-command": "/home/youruser/projects/notes-stt-deploy/backend/deploy.sh",
    "command-working-directory": "/home/youruser/projects/notes-stt-deploy/backend",
    "response-message": "Deployment triggered!",
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hash-sha256",
            "secret": "YOUR_WEBHOOK_SECRET_HERE",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature-256"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/production",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
```

**Generate webhook secret:**

```bash
openssl rand -hex 32
```

#### Step 3: Verify Nginx Configuration

Your Nginx configuration should already be set up from the "Server Setup" section above.

**Verify it's working:**

```bash
# Test Nginx configuration
sudo nginx -t

# Check if site is enabled
ls -l /etc/nginx/sites-enabled/notes-stt.baokhangdev.click

# Reload Nginx if you made changes
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

**If you need to edit the configuration:**

```bash
sudo nano /etc/nginx/sites-available/notes-stt.baokhangdev.click
```

See the **"Server Setup > Install and Configure Nginx"** section above for the complete configuration.

#### Step 4: Start Webhook Service

Create systemd service:

```bash
sudo nano /etc/systemd/system/webhook.service
```

Add:

```ini
[Unit]
Description=GitHub Webhook Receiver
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/projects/notes-stt-deploy
ExecStart=/usr/local/bin/webhook -hooks /home/youruser/projects/notes-stt-deploy/hooks.json -verbose -port 9000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable webhook
sudo systemctl start webhook
sudo systemctl status webhook
```

#### Step 5: Configure GitHub Webhook

1. Go to your GitHub repository
2. **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://notes-stt.baokhangdev.click/webhook/deploy`
   - **Content type**: `application/json`
   - **Secret**: Your webhook secret from hooks.json
   - **Events**: Just the push event
   - **Active**: ✅ Checked
4. Click **Add webhook**

#### Step 6: Make deploy.sh Executable

```bash
cd ~/projects/notes-stt-deploy/backend
chmod +x deploy.sh
```

#### Step 7: Test Deployment

**Manual test:**

```bash
cd ~/projects/notes-stt-deploy/backend
bash deploy.sh
```

**Trigger from GitHub:**

```bash
# Push to production branch
git push origin production
```

**Check logs:**

```bash
# Webhook service logs
sudo journalctl -u webhook -f

# Deployment logs
tail -f ~/projects/notes-stt-deploy/deploy.log
```

---

## Production Checklist

### Pre-Deployment

- [ ] ✅ Server has Docker & Docker Compose installed
- [ ] ✅ Domain DNS configured and pointing to server
- [ ] ✅ Nginx installed and configured
- [ ] ✅ `.env` file created with production values
- [ ] ✅ `JWT_SECRET` generated (strong, random)
- [ ] ✅ `POSTGRES_PASSWORD` set (16+ characters)
- [ ] ✅ `CORS_ORIGIN` set to frontend domain
- [ ] ✅ Webhook receiver installed and running
- [ ] ✅ `deploy.sh` executable (`chmod +x`)
- [ ] ✅ GitHub webhook configured

### Security

- [ ] ✅ `.env` added to `.gitignore` (never committed)
- [ ] ✅ Webhook secret is strong (32+ characters)
- [ ] ✅ SSL certificate installed (Let's Encrypt)
- [ ] ✅ Firewall configured (only ports 80, 443, 22 open)
- [ ] ✅ PostgreSQL not exposed publicly (port 5433 internal only)
- [ ] ✅ Docker containers run as non-root user

### Post-Deployment

- [ ] ✅ Backend health check passes: `curl http://localhost:3000/graphql`
- [ ] ✅ Database migrations completed
- [ ] ✅ Frontend accessible at domain
- [ ] ✅ API endpoints responding correctly
- [ ] ✅ Webhook test delivery successful

---

## SSL Certificate Management

SSL certificates are configured during initial server setup (see **"Server Setup > Install SSL Certificate"** section above).

### Check Certificate Status

```bash
# View all certificates
sudo certbot certificates

# Check certificate expiration
sudo certbot renew --dry-run

# Check Nginx SSL configuration
sudo nginx -t

# View certificate details
echo | openssl s_client -servername notes-stt.baokhangdev.click -connect notes-stt.baokhangdev.click:443 2>/dev/null | openssl x509 -noout -dates
```

### Manual Certificate Renewal

Certificates auto-renew, but you can manually renew if needed:

```bash
# Renew all certificates
sudo certbot renew

# Renew specific certificate
sudo certbot renew --cert-name notes-stt.baokhangdev.click

# Force renewal (even if not expiring soon)
sudo certbot renew --force-renewal
```

### Troubleshooting SSL Issues

```bash
# Check Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Test HTTPS
curl -I https://notes-stt.baokhangdev.click

# Verify SSL configuration
sudo nginx -t
sudo systemctl reload nginx
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs postgres

# Check if port is already in use
sudo lsof -i :3000
sudo lsof -i :5433

# Restart from scratch
docker-compose down -v  # ⚠️ This deletes data!
docker-compose up -d --build
```

### Database Connection Failed

```bash
# Check PostgreSQL is healthy
docker-compose exec postgres pg_isready -U postgres

# Check DATABASE_URL in .env
# Should be: postgresql://postgres:PASSWORD@postgres:5432/stt_notes
# Note: Use 'postgres' as hostname (container name), not 'localhost'

# Run migrations manually
docker-compose exec backend npx prisma migrate deploy
```

### Webhook Not Triggering

```bash
# Check webhook service status
sudo systemctl status webhook

# Check webhook logs
sudo journalctl -u webhook -f

# Test webhook receiver manually
curl -X POST http://localhost:9000/hooks/deploy-notes-stt

# Check GitHub webhook delivery (in GitHub repo settings)
# Look for response codes and errors
```

### Deployment Script Fails

```bash
# Check deploy.sh has execute permission
ls -l deploy.sh

# Make executable if needed
chmod +x deploy.sh

# Run manually to see detailed errors
bash -x deploy.sh

# Check deploy logs
tail -f ~/projects/notes-stt-deploy/deploy.log
```

### Frontend Not Updating

```bash
# Check if files are syncing
ls -la /var/www/notes-stt.baokhangdev.click

# Check permissions
sudo chown -R www-data:www-data /var/www/notes-stt.baokhangdev.click
sudo chmod -R 755 /var/www/notes-stt.baokhangdev.click

# Clear browser cache or use incognito mode
# Check Nginx error logs
sudo tail -f /var/nginx/error.log
```

---

## Advanced: Node.js Webhook Receiver

If you prefer Node.js over the Go binary:

### Install Dependencies

```bash
cd ~/projects/notes-stt-deploy
npm init -y
npm install express
```

### Create webhook-server.js

```javascript
const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const PORT = 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-here';
const DEPLOY_SCRIPT =
  '/home/youruser/projects/notes-stt-deploy/backend/deploy.sh';

app.use(express.json());

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest =
    'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

app.post('/hooks/deploy-notes-stt', (req, res) => {
  // Verify signature
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  // Check if push to production branch
  if (req.body.ref !== 'refs/heads/production') {
    return res.status(200).send('Not production branch, skipping');
  }

  console.log('✅ Webhook received, triggering deployment...');

  // Execute deployment script
  exec(`bash ${DEPLOY_SCRIPT}`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Deployment failed:', error);
      return;
    }
    console.log('📝 Deployment output:', stdout);
  });

  res.status(200).send('Deployment triggered!');
});

app.listen(PORT, () => {
  console.log(`🎣 Webhook receiver listening on port ${PORT}`);
});
```

### Run with PM2

```bash
# Install PM2
sudo npm install -g pm2

# Start webhook server
pm2 start webhook-server.js --name notes-stt-webhook

# Save PM2 process list
pm2 save

# Enable PM2 startup
pm2 startup
# Follow the instructions printed

# Check status
pm2 status

# View logs
pm2 logs notes-stt-webhook
```

---

## What deploy.sh Does

The deployment script automates the entire deployment process:

1. **Pull Latest Code** - Fetches from `production` branch
2. **Backend Deployment**:
   - Stops old Docker containers
   - Rebuilds containers with latest code
   - Runs database migrations
   - Performs health check
3. **Frontend Deployment**:
   - Installs dependencies (`npm ci`)
   - Builds production bundle (`npm run build`)
   - Syncs files to `/var/www/notes-stt.baokhangdev.click`
   - Sets correct permissions
4. **Cleanup** - Removes old Docker images and logs

**View the script**: `cat deploy.sh` in the repository root.

---

## Quick Commands Reference

### Nginx Commands

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Start/Stop/Restart
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# Reload configuration (without downtime)
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/notes-stt.baokhangdev.click.access.log
sudo tail -f /var/log/nginx/notes-stt.baokhangdev.click.error.log
sudo tail -f /var/log/nginx/error.log

# Edit site configuration
sudo nano /etc/nginx/sites-available/notes-stt.baokhangdev.click

# Enable/Disable site
sudo ln -s /etc/nginx/sites-available/notes-stt.baokhangdev.click /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/notes-stt.baokhangdev.click
```

### Docker Commands

```bash
# Check deployment status
docker-compose ps

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Restart services
docker-compose restart backend

# Stop and remove
docker-compose down
docker-compose down -v  # ⚠️ Also removes volumes (deletes data)

# Clean up
docker system prune -a  # ⚠️ Removes unused images
```

### Webhook Commands

```bash
# Check webhook status
sudo systemctl status webhook

# View logs
sudo journalctl -u webhook -f
sudo journalctl -u webhook --since "1 hour ago"

# Restart webhook
sudo systemctl restart webhook

# Enable/Disable webhook
sudo systemctl enable webhook
sudo systemctl disable webhook
```

### Deployment Commands

```bash
# Manual deployment
cd ~/projects/notes-stt-deploy/backend
bash deploy.sh

# View deployment logs
tail -f ~/projects/notes-stt-deploy/deploy.log

# Check last deployment
tail -100 ~/projects/notes-stt-deploy/deploy.log
```

### Monitoring Commands

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
top
htop  # If installed

# Check open ports
sudo lsof -i :3000  # Backend
sudo lsof -i :5433  # PostgreSQL
sudo lsof -i :9000  # Webhook
sudo lsof -i :80    # HTTP
sudo lsof -i :443   # HTTPS

# Check Docker resource usage
docker stats
```

---

## Support

- **Docker Issues**: Check `docker-compose logs`
- **Webhook Issues**: Check `sudo journalctl -u webhook`
- **Nginx Issues**: Check `/var/log/nginx/error.log`
- **Deployment Issues**: Check `~/projects/notes-stt-deploy/deploy.log`

---

**✅ Deployment Complete!**

Your Notes STT backend is now deployed with automated webhook-based deployment.

Push to `production` branch → Webhook triggers → `deploy.sh` executes → Site updated! 🚀
