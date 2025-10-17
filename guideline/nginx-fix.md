# 🔧 Fix Nginx 504 Gateway Timeout

## Issue

Backend works locally but Nginx gets 504 timeout when proxying requests.

## Solution

Update your Nginx configuration to increase buffer sizes and improve proxy handling.

### Step 1: Edit Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/notes-stt.baokhangdev.click
```

### Step 2: Update the `/graphql` location block

Replace your current `/graphql` location block with this:

```nginx
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

    # Increased timeouts for slow responses
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Increased buffer sizes
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;

    # Disable buffering for large responses
    proxy_max_temp_file_size 0;
}
```

### Step 3: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If successful, reload Nginx
sudo systemctl reload nginx
```

### Step 4: Test Again

```bash
# Test from server
curl -X POST https://notes-stt.baokhangdev.click/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
```

## Alternative Solution: Check Docker Network

If the above doesn't work, the issue might be that Docker is using a different network interface.

### Check Docker bridge IP:

```bash
docker inspect stt_notes_backend | grep IPAddress
```

You might see something like `172.17.0.3`.

### Update Nginx to use Docker bridge IP:

Instead of `http://localhost:3000`, use the Docker container IP:

```nginx
location /graphql {
    proxy_pass http://172.17.0.3:3000/graphql;  # Use actual IP from docker inspect
    # ... rest of config
}
```

### Or use host network mode (simpler):

Edit `docker-compose.yml`:

```yaml
backend:
  network_mode: 'host' # Add this line
  # Remove ports section as host mode uses host's ports directly
```

Then restart:

```bash
docker-compose down
docker-compose up -d
```

## Debugging Commands

If still having issues:

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/notes-stt.baokhangdev.click.error.log

# Test direct connection from server
curl -v -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'

# Check if anything is blocking port 3000
sudo iptables -L -n | grep 3000

# Check Docker container network
docker inspect stt_notes_backend | grep -A 20 NetworkSettings
```

## Most Likely Fix

The 504 timeout with working localhost connection usually means:

1. **Timeout too short** - Fixed by increasing proxy timeouts to 300s
2. **Docker network isolation** - Fixed by using host network mode or Docker bridge IP
3. **Firewall blocking** - Check iptables or UFW

Try the Nginx config update first (Step 1-3 above), as that's the most common fix!
