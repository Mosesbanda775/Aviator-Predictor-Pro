# Deployment Guide

Complete deployment guide for the Aviator Predictor Pro Live Signal System.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Options](#deployment-options)
4. [Production Setup](#production-setup)
5. [Monitoring & Logging](#monitoring--logging)
6. [Scaling](#scaling)
7. [Backup & Recovery](#backup--recovery)
8. [Security Hardening](#security-hardening)

---

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

### System Requirements

- [ ] **Node.js**: Version 14.0.0 or higher
- [ ] **npm**: Version 6.0.0 or higher
- [ ] **Memory**: Minimum 512MB RAM (2GB recommended)
- [ ] **CPU**: 1+ cores (2+ recommended for production)
- [ ] **Disk Space**: 500MB minimum
- [ ] **Network**: Open ports 3000 (HTTP) and 8080 (WebSocket)

### Configuration

- [ ] Set `NODE_ENV=production`
- [ ] Configure production CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Review and adjust rate limits
- [ ] Configure authentication (if required)
- [ ] Set appropriate log levels
- [ ] Configure error reporting

### Security

- [ ] Enable firewall rules
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up SSL/TLS for WebSocket (WSS)
- [ ] Review authentication settings
- [ ] Set secure session timeouts
- [ ] Restrict CORS origins to your domain
- [ ] Enable rate limiting

### Monitoring

- [ ] Set up application monitoring
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure alerting
- [ ] Plan backup strategy

---

## Environment Configuration

### Production Environment Variables

Create a `.env` file with production settings:

```bash
# Environment
NODE_ENV=production

# Server Configuration
HTTP_PORT=3000
WEBSOCKET_PORT=8080

# CORS (IMPORTANT: Set to your domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true

# Security
ENABLE_AUTHENTICATION=true
SESSION_TIMEOUT=3600000
MAX_SESSIONS_PER_IP=3

# Connection Limits
MAX_CONNECTIONS=500
WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=5000

# Prediction Algorithm
CONFIDENCE_THRESHOLD=70
ANALYSIS_WINDOW_SIZE=100
MIN_DATA_POINTS=20
PATTERN_RECOGNITION_DEPTH=20

# Signal Broadcasting
SIGNAL_BROADCAST_INTERVAL=5000
MIN_CONFIDENCE_FOR_BROADCAST=60
HISTORY_BUFFER_SIZE=100

# API Configuration
AVIATOR_DATA_SOURCE=https://api.aviator-game.com/v1/results
API_REQUEST_TIMEOUT=5000
API_RETRY_ATTEMPTS=3

# Logging
LOG_LEVEL=warn
ENABLE_FILE_LOGGING=true
LOG_DIRECTORY=/var/log/aviator-predictor
MAX_LOG_FILES=14

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=60
RATE_LIMIT_WINDOW_MS=60000
```

### Configuration File

Review and update `config.json` for production:

```json
{
  "server": {
    "websocketPort": 8080,
    "httpPort": 3000,
    "environment": "production"
  },
  "prediction": {
    "confidenceThreshold": 70,
    "analysisWindowSize": 100,
    "minDataPoints": 20
  },
  "security": {
    "enableAuthentication": true,
    "sessionTimeout": 3600000,
    "maxSessionsPerIP": 3,
    "cors": {
      "origins": ["https://yourdomain.com"],
      "credentials": true
    }
  }
}
```

---

## Deployment Options

### Option 1: Traditional VPS/Dedicated Server

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 2: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/dnbyukusenge/Aviator-Predictor-Pro.git
cd Aviator-Predictor-Pro

# Install dependencies
npm install --production

# Configure environment
sudo cp .env.example .env
sudo nano .env  # Edit with production values
```

#### Step 3: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server.js --name aviator-predictor

# Configure auto-restart on reboot
pm2 startup systemd
pm2 save

# View logs
pm2 logs aviator-predictor

# Monitor application
pm2 monit
```

#### Step 4: Configure Nginx Reverse Proxy

```bash
# Install nginx
sudo apt install -y nginx

# Create nginx configuration
sudo nano /etc/nginx/sites-available/aviator-predictor
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HTTP Server (API and static files)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Server
    location /socket.io/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # WebSocket timeout settings
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Logging
    access_log /var/log/nginx/aviator-predictor-access.log;
    error_log /var/log/nginx/aviator-predictor-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/aviator-predictor /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### Step 5: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

#### Step 6: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

---

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application files
COPY . .

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["npm", "start"]
```

#### Step 2: Create .dockerignore

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
docs/
logs/
*.log
```

#### Step 3: Create docker-compose.yml

```yaml
version: '3.8'

services:
  aviator-predictor:
    build: .
    container_name: aviator-predictor
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - HTTP_PORT=3000
      - WEBSOCKET_PORT=8080
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    networks:
      - aviator-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  aviator-network:
    driver: bridge
```

#### Step 4: Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

---

### Option 3: Cloud Platform Deployment

#### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create aviator-predictor-pro

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set HTTP_PORT=3000
heroku config:set WEBSOCKET_PORT=8080

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Scale
heroku ps:scale web=1
```

Create `Procfile`:
```
web: npm start
```

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings:
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
3. Set environment variables in dashboard
4. Enable WebSocket support in settings
5. Deploy

#### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 aviator-predictor

# Create environment
eb create aviator-predictor-prod

# Deploy
eb deploy

# View logs
eb logs
```

---

## Production Setup

### Process Manager (PM2)

#### Basic Commands

```bash
# Start
pm2 start server.js --name aviator-predictor

# Stop
pm2 stop aviator-predictor

# Restart
pm2 restart aviator-predictor

# Delete
pm2 delete aviator-predictor

# View logs
pm2 logs aviator-predictor

# Monitor
pm2 monit
```

#### Advanced Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'aviator-predictor',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      HTTP_PORT: 3000,
      WEBSOCKET_PORT: 8080
    },
    error_file: '/var/log/aviator-predictor/error.log',
    out_file: '/var/log/aviator-predictor/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start with configuration:
```bash
pm2 start ecosystem.config.js
```

---

## Monitoring & Logging

### Application Monitoring

#### PM2 Plus

```bash
# Link to PM2 Plus
pm2 plus

# Monitor performance
pm2 monitor
```

#### Health Checks

Set up external monitoring:
- **Uptime Robot**: https://uptimerobot.com
- **Pingdom**: https://pingdom.com
- **StatusCake**: https://statuscake.com

Monitor endpoint:
```
https://yourdomain.com/api/health
```

### Log Management

#### Log Rotation

Install logrotate:
```bash
sudo nano /etc/logrotate.d/aviator-predictor
```

Add configuration:
```
/var/log/aviator-predictor/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### Centralized Logging

**Option 1: Papertrail**
```bash
npm install winston-papertrail
```

**Option 2: Loggly**
```bash
npm install winston-loggly-bulk
```

**Option 3: ELK Stack**
- Elasticsearch: Store logs
- Logstash: Process logs
- Kibana: Visualize logs

---

## Scaling

### Horizontal Scaling

#### Load Balancing

**Nginx Configuration:**
```nginx
upstream aviator_backend {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

upstream aviator_websocket {
    ip_hash;
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
}

server {
    location / {
        proxy_pass http://aviator_backend;
    }

    location /socket.io/ {
        proxy_pass http://aviator_websocket;
    }
}
```

#### WebSocket Clustering

Install Redis adapter:
```bash
npm install @socket.io/redis-adapter redis
```

Update `websocket-server.js`:
```javascript
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});
```

### Vertical Scaling

Increase Node.js memory:
```bash
node --max-old-space-size=4096 server.js
```

PM2 configuration:
```javascript
{
  node_args: '--max-old-space-size=4096'
}
```

---

## Backup & Recovery

### Backup Strategy

#### Configuration Backup

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/backup/aviator-predictor"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  .env \
  config.json \
  ecosystem.config.js

# Backup logs (optional)
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz logs/

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

#### Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### Recovery Procedure

```bash
# Stop application
pm2 stop aviator-predictor

# Restore configuration
cd /var/www/Aviator-Predictor-Pro
tar -xzf /backup/aviator-predictor/config_YYYYMMDD_HHMMSS.tar.gz

# Start application
pm2 start aviator-predictor

# Verify
curl http://localhost:3000/api/health
```

---

## Security Hardening

### Application Security

1. **Enable HTTPS/WSS only**
2. **Configure strong CORS policies**
3. **Enable authentication**
4. **Implement rate limiting**
5. **Set secure HTTP headers**
6. **Validate all input**
7. **Keep dependencies updated**

### Server Security

```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Configure fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Disable root SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### Regular Security Audits

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
pm2 logs aviator-predictor --lines 100
```

**Verify configuration:**
```bash
node -c server.js
```

**Check ports:**
```bash
sudo netstat -tlnp | grep -E '3000|8080'
```

### High Memory Usage

**Monitor:**
```bash
pm2 monit
```

**Investigate:**
```bash
node --inspect server.js
```

**Fix:**
- Increase memory limit
- Review prediction algorithm efficiency
- Check for memory leaks

### WebSocket Connection Issues

**Check nginx config:**
```bash
sudo nginx -t
```

**Verify WebSocket upgrade:**
```bash
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:8080/socket.io/
```

**Review logs:**
```bash
tail -f /var/log/nginx/aviator-predictor-error.log
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check application health
- Review connection statistics

**Weekly:**
- Review performance metrics
- Check disk space
- Analyze traffic patterns

**Monthly:**
- Update dependencies
- Review security advisories
- Optimize database/cache
- Test backup restoration

### Updates

```bash
# Pull latest changes
cd /var/www/Aviator-Predictor-Pro
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 restart aviator-predictor

# Verify
curl http://localhost:3000/api/health
```

---

## Support

For deployment assistance:
- Documentation: See README.md and other docs
- GitHub Issues: https://github.com/dnbyukusenge/Aviator-Predictor-Pro/issues

---

**Last Updated:** December 2, 2025
