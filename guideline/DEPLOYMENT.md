# 🚀 Backend Production Deployment Guide

Complete guide for deploying the Notes STT backend to production using Docker and automated webhooks.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup (First Time)](#server-setup-first-time)
3. [Backend Deployment Setup](#backend-deployment-setup)
4. [Webhook Deployment](#webhook-deployment)
5. [Production Checklist](#production-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Server**: Ubuntu 20.04+ with Docker & Docker Compose
- **Domain**: Configured DNS pointing to your server
- **Nginx**: Web server for reverse proxy
- **GitHub**: Repository with webhook access
- **Note**: Backend runs entirely in Docker (no Node.js needed on host)

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

# Install Git
sudo apt-get install git -y

# Install other utilities
sudo apt-get install curl wget nano jq -y
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
# Backend + Frontend Configuration
server {
    listen 80;
    listen [::]:80;

    server_name notes-stt.baokhangdev.click www.notes-stt.baokhangdev.click;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ============================================
    # BACKEND API (GraphQL)
    # ============================================
    location /graphql {
        proxy_pass http://localhost:3000/graphql;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # ============================================
    # WEBHOOK ENDPOINT
    # ============================================
    location /webhook/ {
        proxy_pass http://localhost:9000/hooks/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Webhook timeout
        proxy_read_timeout 300s;
    }

    # ============================================
    # FRONTEND (To be configured later)
    # ============================================
    # Uncomment and configure when frontend is ready
    # location / {
    #     root /var/www/notes-stt.baokhangdev.click;
    #     index index.html;
    #     try_files $uri $uri/ /index.html;
    # }

    # Temporary placeholder for root
    location / {
        return 200 'Backend API available at /graphql';
        add_header Content-Type text/plain;
    }

    # Logging
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

### 3. Configure DNS

Before proceeding, ensure your domain DNS is configured:

1. **Add A Record** pointing to your server IP:
   - Type: `A`
   - Name: `notes-stt.baokhangdev.click` (or `@` for root domain)
   - Value: `YOUR_SERVER_IP`
   - TTL: `3600` (or default)

2. **Add A Record** for www subdomain (optional):
   - Type: `A`
   - Name: `www`
   - Value: `YOUR_SERVER_IP`
   - TTL: `3600`

3. **Wait for DNS propagation** (can take 5-60 minutes):
   ```bash
   # Check DNS propagation
   nslookup notes-stt.baokhangdev.click
   dig notes-stt.baokhangdev.click
   ```

#### Step 3: Create Webhook Systemd Service

```bash
# Check if Nginx is serving the site
curl http://notes-stt.baokhangdev.click

# Should return: "Backend API available at /graphql"

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

# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates
```

---

## Backend Deployment Setup

### 1. Server Directory Structure

```bash
# Create project directory
mkdir -p ~/projects/notes-stt
cd ~/projects/notes-stt

# Clone backend repository
git clone https://github.com/tunbin2697/notes-stt-be.git

# Your structure should look like:
~/projects/notes-stt/
└── notes-stt-be/          # ← Repository creates its own folder
    ├── Dockerfile
    ├── docker-compose.yml
    ├── deploy.sh
    ├── prisma/
    ├── src/
    └── package.json
```

### 2. Environment Variables

**Important**: The `.env` file contains secrets and should NOT be committed to Git. We'll store it in a protected location outside the repository.

**Create protected environment directory:**

```bash
# Create a secure directory for environment files
sudo mkdir -p /etc/notes-stt
sudo chown $USER:$USER /etc/notes-stt
chmod 700 /etc/notes-stt

# Create .env file in the protected location
nano /etc/notes-stt/.env
```

**Add these variables:**

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

**Generate secure secrets:**

```bash
# Generate strong PostgreSQL password
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 32
```

**Save and set permissions:**

```bash
# Protect the .env file
chmod 600 /etc/notes-stt/.env

# Verify it's readable only by you
ls -l /etc/notes-stt/.env
# Should show: -rw------- 1 youruser youruser
```

**How it works:**

- ✅ `.env` stored in `/etc/notes-stt/` (outside repo, protected)
- ✅ `deploy.sh` automatically copies it to repo on first run
- ✅ Git will ignore `.env` (already in `.gitignore`)
- ✅ Survives `git clean` and repository resets
- ✅ Backup this file securely!

⚠️ **Important**:

- Never commit `.env` to Git!
- Store a backup of `/etc/notes-stt/.env` in a secure password manager
- If the file is deleted, deployment will fail with clear error message

---

### Alternative Environment Management Options

The current setup (protected directory `/etc/notes-stt/.env`) is **recommended for webhook-based deployments**, but here are alternatives:

<details>
<summary><strong>📌 Click to view alternative .env management methods</strong></summary>

#### Option A: Current Setup (Recommended) ✅

**Advantages:**

- ✅ Simple and secure
- ✅ No GitHub Actions needed
- ✅ Works with free private repos
- ✅ Secrets never leave your server
- ✅ One-time setup

#### Option B: GitHub Secrets (Requires GitHub Actions)

**Note**: Requires GitHub Actions (2,000 minutes/month limit on free private repos). Your current webhook setup doesn't use GitHub Actions.

**Setup:**

1. Store secrets in GitHub (Settings → Secrets and variables → Actions)
2. Create `.env` in GitHub Actions workflow:
   ```yaml
   - name: Create .env file
     run: |
       cat > .env << EOF
       POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
       JWT_SECRET=${{ secrets.JWT_SECRET }}
       CORS_ORIGIN=${{ secrets.CORS_ORIGIN }}
       NODE_ENV=production
       PORT=3000
       EOF
   ```
3. Deploy via SSH using `appleboy/scp-action`

**Disadvantages:**

- ❌ Requires GitHub Actions (limited minutes)
- ❌ More complex than current setup
- ❌ Doesn't work with webhook-only deployment

#### Option C: Encrypted Secrets in Repo

Store encrypted `.env` in repository and decrypt on server.

**Setup:**

```bash
# Install age encryption tool
sudo apt-get install age

# Generate key (save securely!)
age-keygen -o ~/secrets.key

# Encrypt .env
age -e -r age1abc...xyz .env > .env.enc
git add .env.enc
git commit -m "Add encrypted env"

# On server, decrypt in deploy.sh
age -d -i ~/.secrets.key .env.enc > .env
```

**Advantages:**

- ✅ Secrets backed up in Git (encrypted)
- ✅ Works with webhook deployment
- ✅ Easy to rotate secrets

**Disadvantages:**

- ⚠️ Requires age encryption tool
- ⚠️ Must manage decryption key on server
- ⚠️ Key loss = can't decrypt secrets

#### Comparison Table

| Method            | Complexity  | Security    | GitHub Actions | Works with Webhooks |
| ----------------- | ----------- | ----------- | -------------- | ------------------- |
| **Protected dir** | ⭐ Low      | ⭐⭐⭐ High | ❌ No          | ✅ Yes              |
| GitHub Secrets    | ⭐⭐ Medium | ⭐⭐⭐ High | ✅ Required    | ❌ No               |
| Encrypted in repo | ⭐⭐⭐ High | ⭐⭐ Medium | ❌ No          | ✅ Yes              |

#### Backup Strategy

Recommended backup for `/etc/notes-stt/.env`:

```bash
# Create encrypted backup
tar -czf notes-stt-env-backup.tar.gz /etc/notes-stt/.env
age -e -r your-public-key notes-stt-env-backup.tar.gz > backup.tar.gz.enc

# Download to local machine
scp user@server:~/backup.tar.gz.enc ~/secure-backups/

# Or copy .env content to password manager
```

#### Option D: Webhook Environment Variables (Future Enhancement)

Pass environment variables directly through webhook configuration - no manual server setup needed!

**How it works:**
The webhook tool can pass environment variables to `deploy.sh` when triggered, eliminating the need for manual `.env` file creation.

**Setup:**

1. Add `pass-environment-to-command` to `/opt/hooks/hooks.json`:

   ```json
   {
     "id": "deploy-backend",
     "execute-command": "/home/youruser/projects/notes-stt/notes-stt-be/deploy.sh",
     "command-working-directory": "/home/youruser/projects/notes-stt/notes-stt-be",
     "pass-environment-to-command": [
       {
         "source": "string",
         "name": "POSTGRES_PASSWORD",
         "value": "your_postgres_password_here"
       },
       {
         "source": "string",
         "name": "JWT_SECRET",
         "value": "your_jwt_secret_here"
       },
       {
         "source": "string",
         "name": "CORS_ORIGIN",
         "value": "https://notes-stt.baokhangdev.click"
       }
     ],
     "trigger-rule": { ... }
   }
   ```

2. Update `deploy.sh` to use environment variables:

   ```bash
   # Create .env from environment variables
   if [ -n "${POSTGRES_PASSWORD:-}" ]; then
       cat > .env << EOF
   POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
   JWT_SECRET=${JWT_SECRET}
   CORS_ORIGIN=${CORS_ORIGIN}
   NODE_ENV=production
   PORT=3000
   EOF
   fi
   ```

3. Protect hooks.json:
   ```bash
   sudo chmod 600 /opt/hooks/hooks.json
   ```

**Advantages:**

- ✅ Zero manual server setup
- ✅ All secrets in one file
- ✅ Easy to update
- ✅ No separate .env management

**Disadvantages:**

- ⚠️ Requires modifying both hooks.json and deploy.sh
- ⚠️ Secrets visible in hooks.json (must protect file permissions)

</details>

---

### 3. Make deploy.sh Executable

```bash
cd ~/projects/notes-stt/notes-stt-be
chmod +x deploy.sh
```

### 4. Test Docker Build

```bash
cd ~/projects/notes-stt/notes-stt-be

# Build and start containers
docker-compose up -d --build

# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend

# Test backend API (GraphQL POST request)
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'

# Should return: {"data":{"health":"ok"}}

# Test via Nginx proxy
curl -X POST http://notes-stt.baokhangdev.click/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
```

### 5. Stop Test Containers

```bash
cd ~/projects/notes-stt/notes-stt-be
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

```bash
# Download and install webhook binary
wget https://github.com/adnanh/webhook/releases/download/2.8.0/webhook-linux-amd64.tar.gz
tar -xzf webhook-linux-amd64.tar.gz
sudo mv webhook-linux-amd64/webhook /usr/local/bin/webhook
sudo chmod +x /usr/local/bin/webhook

# Verify installation
webhook --version
```

#### Step 2: Create Webhook Configuration

**Generate webhook secret first:**

```bash
# Generate a secure webhook secret
openssl rand -hex 32
# Save this secret - you'll need it for:
# 1. hooks.json configuration (below)
# 2. GitHub webhook configuration (later)

# Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Create hooks directory and configuration:**

```bash
# Create hooks directory
sudo mkdir -p /opt/hooks

# Create hooks.json
sudo nano /opt/hooks/hooks.json
```

**Add this configuration (copy-paste entire block):**

```json
[
  {
    "id": "deploy-backend",
    "execute-command": "/bin/bash",
    "pass-arguments-to-command": [
      {
        "source": "string",
        "name": "/home/youruser/projects/notes-stt/notes-stt-be/deploy.sh"
      }
    ],
    "command-working-directory": "/home/youruser/projects/notes-stt/notes-stt-be",
    "response-message": "Backend deployment triggered!",
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hmac-sha256",
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

> **💡 Note**: Using `/bin/bash` with `pass-arguments-to-command` means the script doesn't need execute permission. This prevents "permission denied" errors after git updates.

**Important customization steps:**

1. **Replace `/home/youruser`** with your actual home directory:

   ```bash
   # Find your home directory
   echo $HOME
   # Example output: /home/ubuntu

   # Update the paths in hooks.json to use your actual home
   # Change: /home/youruser/projects/notes-stt/notes-stt-be/deploy.sh
   # To:     /home/ubuntu/projects/notes-stt/notes-stt-be/deploy.sh
   ```

2. **Replace `YOUR_WEBHOOK_SECRET_HERE`** with the secret you generated above

3. **Save and exit** (Ctrl+X, then Y, then Enter)

**What the trigger rules do:**

- ✅ HMAC SHA-256 signature validation (ensures request is from GitHub)
- ✅ Only `production` branch triggers deployment
- ✅ No separate handler script needed!

**Note**: Space is reserved for frontend webhook - you can add another object to the array later.

```bash
sudo nano /etc/systemd/system/webhook.service
```

**Add this configuration (copy-paste entire block):**

```ini
[Unit]
Description=GitHub Webhook Receiver
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
Group=YOUR_USERNAME
WorkingDirectory=/opt/hooks
ExecStart=/usr/local/bin/webhook -hooks /opt/hooks/hooks.json -verbose -port 9000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Important customization:**

Replace `YOUR_USERNAME` with your actual username:

```bash
# Find your username
whoami
# Example output: ubuntu

# Edit the service file and replace both instances of YOUR_USERNAME
# User=YOUR_USERNAME    →    User=ubuntu
# Group=YOUR_USERNAME   →    Group=ubuntu
```

**Save and exit** (Ctrl+X, then Y, then Enter)

#### Step 4: Start Webhook Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable webhook

# Start service
sudo systemctl start webhook

# Check status
sudo systemctl status webhook

# View logs
sudo journalctl -u webhook -f
```

#### Step 5: Configure GitHub Webhook

1. Go to your GitHub repository
2. **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://notes-stt.baokhangdev.click/webhook/deploy-backend`
   - **Content type**: `application/json`
   - **Secret**: Paste the secret you generated earlier
   - **Which events**: Select `Just the push event`
   - **Active**: ✅ Checked
4. Click **Add webhook**

#### Step 6: Test Deployment

**Method 1: Manual test (from server)**

```bash
cd ~/projects/notes-stt/notes-stt-be
./deploy.sh
```

**Method 2: Trigger from GitHub**

```bash
# On your local machine, push to production branch
git checkout production
git push origin production

# Then on server, monitor logs
sudo journalctl -u webhook -f
# In another terminal:
tail -f ~/projects/notes-stt/notes-stt-be/deploy.log
```

**Method 3: Test webhook from GitHub**

1. Go to your repository → Settings → Webhooks
2. Click on your webhook
3. Scroll down to "Recent Deliveries"
4. Click "Redeliver" on any delivery
5. Monitor server logs

**Verify deployment:**

```bash
# Check containers are running
docker ps

# Test backend API (GraphQL POST request)
curl -X POST https://notes-stt.baokhangdev.click/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'

# Should return: {"data":{"health":"ok"}}

# Check deployment logs
tail -50 ~/projects/notes-stt/notes-stt-be/deploy.log
```

---

## Production Checklist

### Before Going Live

- [ ] DNS configured and propagated
- [ ] SSL certificate installed
- [ ] `.env` file created with secure values
- [ ] Docker containers build successfully
- [ ] Backend API responds on `/graphql`
- [ ] Webhook service running
- [ ] GitHub webhook configured
- [ ] Test deployment successful

### Security Checklist

- [ ] Strong passwords in `.env`
- [ ] Firewall configured (UFW)
- [ ] SSL/TLS enabled
- [ ] Webhook secret configured
- [ ] Non-root user for Docker
- [ ] Regular security updates scheduled

### Monitoring

```bash
# Check backend container logs
docker logs -f stt_notes_backend

# Check database container logs
docker logs -f stt_notes_db

# Check webhook logs
sudo journalctl -u webhook -f

# Check deployment logs
tail -f ~/projects/notes-stt/notes-stt-be/deploy.log

# Check Nginx logs
sudo tail -f /var/log/nginx/notes-stt.baokhangdev.click.access.log
sudo tail -f /var/log/nginx/notes-stt.baokhangdev.click.error.log
```

### Database Access & Management

#### Monitor Database Queries & Mutations in Production

For production monitoring on your Ubuntu server, use these methods to track all database operations:

---

**🎯 Quick Start: Enable Query Logging (Recommended for Production)**

Run these commands on your Ubuntu server to see all SQL queries in real-time:

```bash
# Step 1: Enable PostgreSQL query logging
docker exec -it stt_notes_db psql -U postgres -c "ALTER SYSTEM SET log_statement = 'all';"
docker exec -it stt_notes_db psql -U postgres -c "ALTER SYSTEM SET log_duration = on;"
docker exec -it stt_notes_db psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 100;"
docker exec -it stt_notes_db psql -U postgres -c "SELECT pg_reload_conf();"

# Step 2: Watch queries in real-time
docker logs -f stt_notes_db 2>&1 | grep -E '(INSERT|UPDATE|DELETE|SELECT)'

# Filter by specific operations
docker logs -f stt_notes_db 2>&1 | grep 'INSERT INTO "Note"'
docker logs -f stt_notes_db 2>&1 | grep 'UPDATE "Account"'
docker logs -f stt_notes_db 2>&1 | grep 'DELETE FROM'
```

**To disable logging later (save disk space):**

```bash
docker exec -it stt_notes_db psql -U postgres -c "ALTER SYSTEM SET log_statement = 'none';"
docker exec -it stt_notes_db psql -U postgres -c "SELECT pg_reload_conf();"
```

---

**📊 Method 1: Table Statistics (Lightweight)**

See cumulative INSERT/UPDATE/DELETE counts per table:

```bash
docker exec -it stt_notes_db psql -U postgres -d stt_notes -c "
SELECT
  relname as table,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
"
```

**With continuous monitoring:**

```bash
watch -n 2 "docker exec stt_notes_db psql -U postgres -d stt_notes -t -c \"
SELECT
  relname as table,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
\""
```

---

**🔍 Method 2: Active Query Monitoring**

See currently running queries:

```bash
# One-time snapshot
docker exec -it stt_notes_db psql -U postgres -d stt_notes -c "
SELECT
  pid,
  state,
  SUBSTRING(query, 1, 100) as query_preview,
  NOW() - query_start AS duration
FROM pg_stat_activity
WHERE state != 'idle'
  AND datname = 'stt_notes'
ORDER BY query_start DESC;
"

# Continuous monitoring (Ubuntu)
watch -n 2 "docker exec stt_notes_db psql -U postgres -d stt_notes -t -c \"
SELECT
  pid,
  state,
  SUBSTRING(query, 1, 80) as query
FROM pg_stat_activity
WHERE state != 'idle'
  AND datname = 'stt_notes'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start DESC;
\""
```

---

**📝 Method 3: Monitoring Dashboard Script**

Create a comprehensive monitoring dashboard for your Ubuntu server:

```bash
# Create monitoring script
nano ~/monitor-db.sh
```

Paste this content:

```bash
#!/bin/bash

echo "🔍 PostgreSQL Database Monitor - Press Ctrl+C to stop"
echo "=================================================="

while true; do
  clear
  echo "📊 Database Activity Monitor - $(date)"
  echo "=================================================="

  # Table operations
  echo -e "\n📝 Table Operations (Cumulative):"
  docker exec stt_notes_db psql -U postgres -d stt_notes -t -c "
    SELECT
      relname as table,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as rows
    FROM pg_stat_user_tables
    WHERE n_tup_ins + n_tup_upd + n_tup_del > 0
    ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
  "

  # Active queries
  echo -e "\n⚡ Active Queries RIGHT NOW:"
  docker exec stt_notes_db psql -U postgres -d stt_notes -t -c "
    SELECT
      SUBSTRING(query, 1, 100) as query,
      state
    FROM pg_stat_activity
    WHERE state != 'idle'
      AND datname = 'stt_notes'
      AND query NOT LIKE '%pg_stat_activity%'
    ORDER BY query_start DESC
    LIMIT 5;
  "

  # Connections
  echo -e "\n� Active Connections:"
  docker exec stt_notes_db psql -U postgres -d stt_notes -t -c "
    SELECT COUNT(*) as connections, state
    FROM pg_stat_activity
    WHERE datname = 'stt_notes'
    GROUP BY state;
  "

  sleep 3
done
```

```bash
# Make executable and run
chmod +x ~/monitor-db.sh
~/monitor-db.sh
```

---

**🎨 Method 4: Monitor GraphQL Operations (Application Level)**

Since you're using GraphQL, monitor at the backend level:

```bash
# Watch all GraphQL operations
docker logs -f stt_notes_backend | grep -E '(Query|Mutation)'

# Watch specific mutations
docker logs -f stt_notes_backend | grep 'createNote'
docker logs -f stt_notes_backend | grep 'updateNote'
docker logs -f stt_notes_backend | grep 'deleteNote'

# Watch authentication events
docker logs -f stt_notes_backend | grep -E '(login|logout|register)'
```

---

**📌 Quick Reference Commands**

```bash
# Show active queries RIGHT NOW
docker exec stt_notes_db psql -U postgres -d stt_notes -c "SELECT pid, state, query FROM pg_stat_activity WHERE state != 'idle';"

# Count operations per table
docker exec stt_notes_db psql -U postgres -d stt_notes -c "SELECT relname, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables;"

# Watch database logs
docker logs -f stt_notes_db

# Watch backend logs
docker logs -f stt_notes_backend

# Check database size
docker exec stt_notes_db psql -U postgres -d stt_notes -c "SELECT pg_size_pretty(pg_database_size('stt_notes'));"

# Monitor connection count
watch -n 2 'docker exec stt_notes_db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"'
```

#### Connect to PostgreSQL Database

**Method 1: Using Docker exec (Recommended)**

```bash
# Connect to PostgreSQL container
docker exec -it stt_notes_db psql -U postgres -d stt_notes

# You'll see the psql prompt:
# stt_notes=#
```

**Method 2: One-line queries**

```bash
# Run a single query without entering interactive mode
docker exec -it stt_notes_db psql -U postgres -d stt_notes -c "SELECT * FROM \"Account\" LIMIT 5;"
```

**Method 3: Connect from host machine (if PostgreSQL client installed)**

```bash
# Install PostgreSQL client on host (if needed)
sudo apt-get install postgresql-client -y

# Connect to database (port 5433 is mapped to host)
psql -h localhost -p 5433 -U postgres -d stt_notes
# Password: (from your .env POSTGRES_PASSWORD)
```

#### Common PostgreSQL Commands

**Once connected to psql prompt:**

```sql
-- List all databases
\l

-- Connect to a database
\c stt_notes_db

-- List all tables
\dt

-- Describe table structure
\d "Account"
\d "Profile"
\d "Note"
\d "RefreshToken"
\d "PasswordReset"

-- Show table with indexes and constraints
\d+ "Account"

-- List all schemas
\dn

-- List all users/roles
\du

-- Show current database and user
\conninfo

-- Get help
\?

-- Quit psql
\q
```

#### Useful Database Queries

**View Users/Accounts:**

```sql
-- List all accounts
SELECT id, email, role, "createdAt"
FROM "Account"
ORDER BY "createdAt" DESC;

-- Count total accounts
SELECT COUNT(*) FROM "Account";

-- Find account by email
SELECT * FROM "Account" WHERE email = 'user@example.com';
```

**View Profiles:**

```sql
-- List all profiles with account emails
SELECT
  p.id,
  p."fullName",
  a.email,
  p."createdAt"
FROM "Profile" p
JOIN "Account" a ON p."accountId" = a.id
ORDER BY p."createdAt" DESC;
```

**View Notes:**

```sql
-- List recent notes
SELECT
  id,
  title,
  type,
  status,
  priority,
  "isPinned",
  "createdAt"
FROM "Note"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Count notes by type
SELECT type, COUNT(*) as count
FROM "Note"
GROUP BY type;

-- Count notes by status
SELECT status, COUNT(*) as count
FROM "Note"
GROUP BY status;

-- Find notes by user
SELECT n.id, n.title, n.type, a.email
FROM "Note" n
JOIN "Profile" p ON n."profileId" = p.id
JOIN "Account" a ON p."accountId" = a.id
WHERE a.email = 'user@example.com';
```

**View Active Sessions:**

```sql
-- List active refresh tokens
SELECT
  rt.id,
  a.email,
  rt."expiresAt",
  rt.revoked,
  rt."createdAt"
FROM "RefreshToken" rt
JOIN "Account" a ON rt."accountId" = a.id
WHERE rt.revoked = false
  AND rt."expiresAt" > NOW()
ORDER BY rt."createdAt" DESC;

-- Count active sessions per user
SELECT
  a.email,
  COUNT(*) as active_sessions
FROM "RefreshToken" rt
JOIN "Account" a ON rt."accountId" = a.id
WHERE rt.revoked = false
  AND rt."expiresAt" > NOW()
GROUP BY a.email;
```

**View OTP Tokens:**

```sql
-- List recent OTP tokens (for password reset/logout all)
SELECT
  pr.id,
  a.email,
  pr.token as otp,
  pr."expiresAt",
  pr.used,
  pr."createdAt"
FROM "PasswordReset" pr
JOIN "Account" a ON pr."accountId" = a.id
ORDER BY pr."createdAt" DESC
LIMIT 10;

-- Count unused OTPs
SELECT
  a.email,
  COUNT(*) as unused_otps
FROM "PasswordReset" pr
JOIN "Account" a ON pr."accountId" = a.id
WHERE pr.used = false
  AND pr."expiresAt" > NOW()
GROUP BY a.email;
```

#### Database Maintenance

**Check database size:**

```sql
-- Database size
SELECT
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'stt_notes_db';

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Vacuum and analyze:**

```sql
-- Vacuum database (reclaim storage)
VACUUM FULL;

-- Analyze tables (update statistics)
ANALYZE;

-- Vacuum specific table
VACUUM FULL "Note";
```

**Check database connections:**

```sql
-- Current connections
SELECT
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'stt_notes_db';

-- Kill a specific connection (if needed)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = 12345;
```

#### Backup and Restore

**Create backup:**

```bash
# Backup entire database
docker exec stt_notes_db pg_dump -U postgres stt_notes_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
docker exec stt_notes_db pg_dump -U postgres -t "Account" -t "Profile" stt_notes_db > backup_users.sql

# Backup with custom format (smaller, faster)
docker exec stt_notes_db pg_dump -U postgres -Fc stt_notes > backup.dump
```

**Restore from backup:**

```bash
# Restore from SQL file
cat backup_20251017_143000.sql | docker exec -i stt_notes_db psql -U postgres -d stt_notes

# Restore from custom format
docker exec -i stt_notes_db pg_restore -U postgres -d stt_notes -c < backup.dump

# Create new database and restore
docker exec -it stt_notes_db psql -U postgres -c "CREATE DATABASE stt_notes_restore;"
cat backup.sql | docker exec -i stt_notes_db psql -U postgres -d stt_notes_restore
```

**Automated backup script:**

```bash
# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR=~/backups/postgres
mkdir -p $BACKUP_DIR

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec stt_notes_db pg_dump -U postgres -Fc stt_notes > $BACKUP_DIR/backup_$TIMESTAMP.dump

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.dump" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.dump"
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Test backup
~/backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add this line:
# 0 2 * * * /home/youruser/backup-db.sh >> /home/youruser/backup.log 2>&1
```

#### Prisma Migrations

**Check migration status:**

```bash
# Enter backend container
docker exec -it stt_notes_backend sh

# Check Prisma migration status
npx prisma migrate status

# Exit container
exit
```

**Apply pending migrations:**

```bash
# Run migrations (this is done automatically in deploy.sh)
docker exec -it stt_notes_backend npx prisma migrate deploy
```

**Reset database (⚠️ DANGEROUS - deletes all data!):**

```bash
# Only use in development!
docker exec -it stt_notes_backend npx prisma migrate reset
```

#### Troubleshooting Database Issues

**Problem: Can't connect to database**

```bash
# Check if database container is running
docker ps | grep stt_notes_db

# Check database logs
docker logs stt_notes_db

# Check if PostgreSQL is accepting connections
docker exec stt_notes_db pg_isready -U postgres

# Restart database container
docker restart stt_notes_db
```

**Problem: Database is locked or slow**

```sql
-- Check for long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;

-- Kill long-running query (if needed)
SELECT pg_terminate_backend(12345);
```

**Problem: Database is full**

```bash
# Check disk space
docker exec stt_notes_db df -h

# Check database size (from psql)
SELECT pg_size_pretty(pg_database_size('stt_notes_db'));

# Clean up old data (from psql)
-- Delete old expired OTPs
DELETE FROM "PasswordReset" WHERE "expiresAt" < NOW() - INTERVAL '30 days';

-- Delete old revoked tokens
DELETE FROM "RefreshToken" WHERE revoked = true AND "createdAt" < NOW() - INTERVAL '30 days';
```

---

## Troubleshooting

### Deployment Issues

**Problem**: Containers fail to start

```bash
# Check logs
docker-compose logs

# Check if ports are available
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5433

# Restart containers
cd ~/projects/notes-stt/notes-stt-be
docker-compose down
docker-compose up -d --build
```

**Problem**: Database connection fails

```bash
# Check database container
docker logs stt_notes_db

# Check if database is healthy
docker exec stt_notes_db pg_isready -U postgres

# Verify DATABASE_URL in .env
cat ~/projects/notes-stt/notes-stt-be/.env | grep DATABASE_URL
```

**Problem**: Webhook not triggering

```bash
# Check webhook service status
sudo systemctl status webhook

# Check webhook logs
sudo journalctl -u webhook -f

# Test webhook manually
curl -X POST http://localhost:9000/hooks/deploy-backend \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/production"}'

# Check Nginx proxy
sudo tail -f /var/log/nginx/notes-stt.baokhangdev.click.access.log
```

**Problem**: "Permission denied" when webhook tries to run deploy.sh

This happens when git updates remove execute permission from deploy.sh.

**Solution 1 (Recommended)**: Use bash explicitly in hooks.json (already configured):

```json
{
  "execute-command": "/bin/bash",
  "pass-arguments-to-command": [
    {
      "source": "string",
      "name": "/home/youruser/projects/notes-stt/notes-stt-be/deploy.sh"
    }
  ]
}
```

Then restart webhook: `sudo systemctl restart webhook`

**Solution 2**: Manually restore execute permission:

```bash
chmod +x ~/projects/notes-stt/notes-stt-be/deploy.sh
```

**Solution 3**: The deploy.sh script now has self-healing code that automatically fixes its own permissions at startup (if called with bash).

**Problem**: API not accessible via domain

```bash
# Test locally first (GraphQL POST request)
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'

# Test Nginx proxy
curl -X POST http://notes-stt.baokhangdev.click/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'

# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Common Commands

```bash
# Restart all services
cd ~/projects/notes-stt/notes-stt-be
docker-compose restart

# View container status
docker-compose ps

# Rebuild containers
docker-compose down
docker-compose up -d --build

# Clean Docker system
docker system prune -a

# Restart webhook service
sudo systemctl restart webhook

# Reload Nginx
sudo systemctl reload nginx
```

---

## Future: Frontend Deployment

When you're ready to deploy frontend, you'll need to:

1. **Uncomment frontend section in Nginx config**:

   ```nginx
   location / {
       root /var/www/notes-stt.baokhangdev.click;
       index index.html;
       try_files $uri $uri/ /index.html;
   }
   ```

2. **Add frontend webhook handler** to `/opt/hooks/hooks.json`

3. **Create frontend deployment script**

4. **Configure frontend GitHub webhook**

The infrastructure is ready - just add the frontend-specific parts when needed!

---

## Summary

Your backend is now deployed with:

- ✅ Docker containerized backend (NestJS + PostgreSQL)
- ✅ Nginx reverse proxy for `/graphql` endpoint
- ✅ SSL/TLS via Let's Encrypt
- ✅ Automated webhook deployment on push to `production`
- ✅ Health checks and logging
- ✅ Ready for frontend integration

**Backend API Endpoint**: `https://notes-stt.baokhangdev.click/graphql`

**Webhook URL**: `https://notes-stt.baokhangdev.click/webhook/deploy-backend`
