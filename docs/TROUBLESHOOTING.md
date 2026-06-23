# Troubleshooting Guide

Comprehensive troubleshooting guide for the Aviator Predictor Pro Live Signal System.

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Signal Issues](#signal-issues)
3. [Performance Issues](#performance-issues)
4. [Browser Issues](#browser-issues)
5. [Server Issues](#server-issues)
6. [Deployment Issues](#deployment-issues)
7. [Common Error Messages](#common-error-messages)
8. [Diagnostic Tools](#diagnostic-tools)

---

## Connection Issues

### Issue: WebSocket Connection Failed

**Symptoms:**
- Red connection indicator in dashboard
- "Connection failed" error in browser console
- No signals appearing
- `ERR_CONNECTION_REFUSED` error

**Diagnostic Steps:**

1. **Check if server is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Expected response:
   ```json
   {"status":"ok","uptime":123,...}
   ```

2. **Verify WebSocket port is accessible:**
   ```bash
   telnet localhost 8080
   ```
   or
   ```bash
   nc -zv localhost 8080
   ```

3. **Check server logs:**
   ```bash
   # If using PM2
   pm2 logs aviator-predictor

   # If running directly
   tail -f logs/app.log
   ```

4. **Inspect browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for WebSocket errors

**Solutions:**

**Solution 1: Server not running**
```bash
# Start the server
npm start
# or with PM2
pm2 start aviator-predictor
```

**Solution 2: Port blocked by firewall**
```bash
# Linux/UFW
sudo ufw allow 8080/tcp

# Windows
netsh advfirewall firewall add rule name="WebSocket" dir=in action=allow protocol=TCP localport=8080

# Check if port is in use
sudo lsof -i :8080
```

**Solution 3: Wrong WebSocket URL**
Check client connection string:
```javascript
// Correct
const socket = io('http://localhost:8080');

// Wrong
const socket = io('http://localhost:3000'); // This is the HTTP server
```

**Solution 4: CORS blocking connection**
Update `.env`:
```bash
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Restart server after changes.

---

### Issue: Connection Drops Frequently

**Symptoms:**
- Connection established then immediately drops
- Constant reconnection attempts
- "Transport close" errors in console

**Diagnostic Steps:**

1. **Check ping/pong heartbeat:**
   ```javascript
   socket.on('pong', (data) => {
     console.log('Latency:', data.latency);
   });
   ```

2. **Monitor network stability:**
   ```bash
   ping -c 10 yourdomain.com
   ```

3. **Check server load:**
   ```bash
   htop
   # or
   pm2 monit
   ```

**Solutions:**

**Solution 1: Increase ping intervals**
Update `.env`:
```bash
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=10000
```

**Solution 2: Network proxy/firewall interference**
Try WebSocket-only transport:
```javascript
const socket = io('http://localhost:8080', {
  transports: ['websocket']  // Skip polling
});
```

**Solution 3: Server overloaded**
Reduce concurrent connections:
```bash
MAX_CONNECTIONS=100
```

**Solution 4: Client-side timeout too aggressive**
Increase client timeout:
```javascript
const socket = io('http://localhost:8080', {
  timeout: 20000
});
```

---

### Issue: CORS Errors

**Symptoms:**
- "CORS policy blocked" error in console
- "No 'Access-Control-Allow-Origin' header" error
- HTTP requests fail from browser

**Diagnostic Steps:**

1. **Check browser console for exact error**
2. **Verify request origin:**
   ```javascript
   console.log(window.location.origin);
   ```

3. **Check server CORS configuration:**
   ```bash
   cat .env | grep CORS
   ```

**Solutions:**

**Solution 1: Add origin to allowed list**
Update `.env`:
```bash
# Multiple origins separated by comma
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com,http://127.0.0.1:3000
```

**Solution 2: Update config.json**
```json
{
  "security": {
    "cors": {
      "origins": [
        "http://localhost:3000",
        "https://yourdomain.com"
      ],
      "credentials": true
    }
  }
}
```

**Solution 3: Wildcard for development only**
For development (NOT production):
```bash
CORS_ORIGINS=*
```

**Important:** Restart server after CORS changes:
```bash
pm2 restart aviator-predictor
```

---

## Signal Issues

### Issue: No Signals Appearing

**Symptoms:**
- Connected successfully
- Green connection indicator
- But no signals in dashboard
- Empty signal history

**Diagnostic Steps:**

1. **Check API endpoint:**
   ```bash
   curl http://localhost:3000/api/history?limit=10
   ```

2. **Check signal stats:**
   ```bash
   curl http://localhost:3000/api/stats
   ```

3. **Monitor WebSocket events:**
   ```javascript
   socket.on('signal', (signal) => {
     console.log('Signal received:', signal);
   });
   ```

**Solutions:**

**Solution 1: Confidence threshold too high**
Lower the threshold in `.env`:
```bash
MIN_CONFIDENCE_FOR_BROADCAST=40
CONFIDENCE_THRESHOLD=50
```

**Solution 2: Broadcast interval too long**
Increase frequency:
```bash
SIGNAL_BROADCAST_INTERVAL=3000  # 3 seconds
```

**Solution 3: Not enough data for predictions**
Check minimum data points:
```bash
MIN_DATA_POINTS=5  # Reduce from default 10
```

**Solution 4: Prediction engine not initialized**
Check server logs:
```bash
pm2 logs aviator-predictor | grep -i prediction
```

**Solution 5: Subscribe to correct channel**
Ensure subscription:
```javascript
socket.on('connected', () => {
  socket.emit('subscribe', { channel: 'signals:all' });
});
```

---

### Issue: Low Signal Accuracy

**Symptoms:**
- Receiving signals but poor prediction quality
- Low confidence scores
- Inconsistent results

**Solutions:**

**Solution 1: Increase analysis window**
```bash
ANALYSIS_WINDOW_SIZE=100
PATTERN_RECOGNITION_DEPTH=30
```

**Solution 2: Require more data before predictions**
```bash
MIN_DATA_POINTS=20
```

**Solution 3: Filter low-confidence signals**
Client-side filtering:
```javascript
socket.on('signal', (signal) => {
  if (signal.confidence >= 75) {
    displaySignal(signal);  // Only show high-confidence
  }
});
```

**Solution 4: Tune confidence threshold**
```bash
CONFIDENCE_THRESHOLD=75  # Increase for better quality
```

---

## Performance Issues

### Issue: High Latency / Slow Signal Delivery

**Symptoms:**
- Delayed signal delivery
- High ping/pong latency (>500ms)
- Slow page load times
- UI lag

**Diagnostic Steps:**

1. **Measure latency:**
   ```javascript
   setInterval(() => {
     const start = Date.now();
     socket.emit('ping', { timestamp: start });
   }, 10000);

   socket.on('pong', (data) => {
     console.log('Latency:', data.latency, 'ms');
   });
   ```

2. **Check server resources:**
   ```bash
   # CPU and memory usage
   pm2 monit

   # Detailed system info
   htop

   # Network stats
   netstat -s
   ```

3. **Profile prediction algorithm:**
   ```bash
   node --prof server.js
   ```

**Solutions:**

**Solution 1: Reduce analysis complexity**
```bash
ANALYSIS_WINDOW_SIZE=30
PATTERN_RECOGNITION_DEPTH=10
```

**Solution 2: Increase broadcast interval**
```bash
SIGNAL_BROADCAST_INTERVAL=5000  # Less frequent updates
```

**Solution 3: Limit concurrent connections**
```bash
MAX_CONNECTIONS=100
```

**Solution 4: Increase Node.js memory**
```bash
# With PM2
pm2 start server.js --node-args="--max-old-space-size=2048"

# Direct execution
node --max-old-space-size=2048 server.js
```

**Solution 5: Enable clustering**
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'aviator-predictor',
    script: 'server.js',
    instances: 2,  // Use multiple CPU cores
    exec_mode: 'cluster'
  }]
};
```

**Solution 6: Use WebSocket-only transport**
```javascript
const socket = io('http://localhost:8080', {
  transports: ['websocket']  // Faster than polling
});
```

---

### Issue: High Memory Usage

**Symptoms:**
- Server memory consumption increases over time
- "Out of memory" errors
- Process crashes
- Slow performance

**Diagnostic Steps:**

1. **Monitor memory:**
   ```bash
   pm2 monit
   ```

2. **Check heap snapshot:**
   ```bash
   node --inspect server.js
   ```
   Open `chrome://inspect` in Chrome

3. **Review logs for memory warnings:**
   ```bash
   pm2 logs | grep -i memory
   ```

**Solutions:**

**Solution 1: Reduce history buffer size**
```bash
HISTORY_BUFFER_SIZE=50  # Reduce from 100
```

**Solution 2: Limit connection storage**
```bash
MAX_CONNECTIONS=200
```

**Solution 3: Enable auto-restart on memory limit**
```javascript
// ecosystem.config.js
{
  max_memory_restart: '500M'
}
```

**Solution 4: Clear old sessions periodically**
Check for session cleanup in `websocket-server.js`

---

## Browser Issues

### Chrome/Edge: Connection Drops After Inactivity

**Problem:** WebSocket disconnects when tab is inactive

**Solution:**
Reduce ping interval:
```bash
WS_PING_INTERVAL=20000
```

Browser-side keepalive:
```javascript
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping', { timestamp: Date.now() });
  }
}, 25000);
```

---

### Safari: Audio Notifications Don't Work

**Problem:** Audio notifications fail on iOS Safari

**Solution:**
Require user interaction before playing audio:

```javascript
let audioEnabled = false;

document.getElementById('enable-audio-btn').addEventListener('click', () => {
  audioEnabled = true;
  const audio = new Audio('/notification.mp3');
  audio.play().catch(() => {});
});

socket.on('signal', (signal) => {
  if (audioEnabled && signal.confidence >= 80) {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(console.error);
  }
});
```

---

### Firefox: LocalStorage Quota Exceeded

**Problem:** "QuotaExceededError: The quota has been exceeded"

**Solution:**

Reduce stored history:
```javascript
// Limit local storage
const MAX_LOCAL_HISTORY = 50;

function saveToLocalStorage(signal) {
  let history = JSON.parse(localStorage.getItem('signalHistory') || '[]');
  history.unshift(signal);

  if (history.length > MAX_LOCAL_HISTORY) {
    history = history.slice(0, MAX_LOCAL_HISTORY);
  }

  localStorage.setItem('signalHistory', JSON.stringify(history));
}
```

---

## Server Issues

### Issue: Server Won't Start

**Symptoms:**
- `npm start` fails
- Error messages on startup
- Port already in use

**Diagnostic Steps:**

1. **Check error message:**
   ```bash
   npm start
   ```

2. **Verify port availability:**
   ```bash
   # Check if ports are in use
   sudo lsof -i :3000
   sudo lsof -i :8080
   ```

3. **Check Node.js version:**
   ```bash
   node --version
   ```
   Must be 14.0.0 or higher

**Solutions:**

**Solution 1: Port already in use**
```bash
# Find and kill process using port 3000
sudo lsof -i :3000
sudo kill -9 <PID>

# Or change port
HTTP_PORT=3001
WEBSOCKET_PORT=8081
```

**Solution 2: Missing dependencies**
```bash
npm install
```

**Solution 3: Invalid configuration**
```bash
# Validate JSON
node -e "require('./config.json')"

# Check .env syntax
cat .env
```

**Solution 4: Permission issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/Aviator-Predictor-Pro
chmod -R 755 /path/to/Aviator-Predictor-Pro
```

---

### Issue: API Endpoints Return 500 Errors

**Symptoms:**
- `/api/health` returns 500
- `/api/stats` fails
- Internal server errors

**Diagnostic Steps:**

1. **Check server logs:**
   ```bash
   pm2 logs aviator-predictor --err --lines 50
   ```

2. **Test endpoint directly:**
   ```bash
   curl -v http://localhost:3000/api/health
   ```

3. **Enable debug logging:**
   ```bash
   LOG_LEVEL=debug
   ```

**Solutions:**

**Solution 1: Check for uncaught exceptions**
Review server logs for stack traces

**Solution 2: Verify all services are initialized**
Check that WebSocket server and prediction engine started correctly

**Solution 3: Database/API connectivity**
If using external data sources, verify connectivity:
```bash
curl -v https://api.aviator-game.com/v1/results
```

---

## Deployment Issues

### Issue: nginx "502 Bad Gateway"

**Symptoms:**
- nginx returns 502 error
- Backend unavailable

**Diagnostic Steps:**

1. **Check if backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Test nginx configuration:**
   ```bash
   sudo nginx -t
   ```

**Solutions:**

**Solution 1: Backend not running**
```bash
pm2 start aviator-predictor
```

**Solution 2: Wrong proxy_pass URL**
Check nginx config:
```nginx
location / {
    proxy_pass http://localhost:3000;  # Verify port
}
```

**Solution 3: SELinux blocking connections**
```bash
# On CentOS/RHEL
sudo setsebool -P httpd_can_network_connect 1
```

---

### Issue: SSL/TLS Certificate Issues

**Symptoms:**
- "Your connection is not private" warning
- `ERR_CERT_AUTHORITY_INVALID`
- WebSocket fails with `wss://`

**Solutions:**

**Solution 1: Generate Let's Encrypt certificate**
```bash
sudo certbot --nginx -d yourdomain.com
```

**Solution 2: Verify certificate paths**
```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

**Solution 3: Test certificate**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Solution 4: Check certificate expiration**
```bash
sudo certbot certificates
```

---

## Common Error Messages

### "Error: listen EADDRINUSE"

**Meaning:** Port is already in use

**Fix:**
```bash
# Find process
sudo lsof -i :8080

# Kill process
sudo kill -9 <PID>

# Or use different port
WEBSOCKET_PORT=8081
```

---

### "ERR_CONNECTION_REFUSED"

**Meaning:** Server not running or firewall blocking

**Fix:**
1. Start server: `npm start`
2. Check firewall: `sudo ufw allow 8080/tcp`
3. Verify port: `telnet localhost 8080`

---

### "CORS policy blocked"

**Meaning:** Origin not allowed

**Fix:**
```bash
# Add origin to .env
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

### "WebSocket connection failed"

**Meaning:** Cannot establish WebSocket connection

**Fix:**
1. Check server is running
2. Verify WebSocket port (8080)
3. Check firewall rules
4. Try polling fallback: `transports: ['polling']`

---

### "Authentication failed"

**Meaning:** Invalid or expired session

**Fix:**
```javascript
// Disable authentication for testing
ENABLE_AUTHENTICATION=false

// Or refresh session
socket.auth.token = newToken;
socket.connect();
```

---

## Diagnostic Tools

### Server Health Check

```bash
#!/bin/bash
# health-check.sh

echo "=== Server Health Check ==="

# Check if server is running
echo "1. Checking HTTP server..."
curl -s http://localhost:3000/api/health | jq .

# Check WebSocket server
echo "2. Checking WebSocket server..."
nc -zv localhost 8080

# Check process
echo "3. Checking process..."
pm2 list

# Check logs for errors
echo "4. Recent errors..."
pm2 logs aviator-predictor --err --lines 5

# Check system resources
echo "5. System resources..."
free -h
df -h
```

### Network Diagnostics

```bash
# Check port accessibility
nc -zv localhost 3000
nc -zv localhost 8080

# Check firewall
sudo ufw status

# Check listening ports
sudo netstat -tlnp | grep node

# Test WebSocket upgrade
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:8080/socket.io/
```

### Browser Console Debugging

```javascript
// Enable Socket.io debug logs
localStorage.debug = '*';

// Reload page and check console
location.reload();
```

---

## Getting Help

If issues persist after trying these solutions:

1. **Review full documentation**
   - README.md
   - API.md
   - WEBSOCKET.md
   - DEPLOYMENT.md

2. **Check GitHub Issues**
   https://github.com/dnbyukusenge/Aviator-Predictor-Pro/issues

3. **Gather diagnostic information:**
   - Server logs
   - Browser console errors
   - Network tab (WebSocket frames)
   - Configuration files
   - Node.js version
   - Operating system

4. **Create detailed bug report** with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages
   - System information
   - Configuration (redact sensitive data)

---

**Last Updated:** December 2, 2025
