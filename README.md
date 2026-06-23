# Aviator Predictor Pro - Live Signal System

<div align="center">
  <img src="https://github.com/dnbyukusenge/Aviator-Predictor-Pro/blob/main/aviatorPredictorPro.png" width="200" />
</div>

## Overview

The **Aviator Predictor Pro** is a real-time prediction signal system that provides live betting signals for the Aviator game. Built with WebSocket technology and AI-powered analysis, the system delivers instant predictions to help users make informed betting decisions.

This implementation features:
- **Real-time WebSocket Communication**: Instant signal delivery with sub-second latency
- **AI-Powered Predictions**: Advanced algorithms analyzing historical patterns and trends
- **Web-Based Dashboard**: Responsive interface accessible from any modern browser
- **RESTful API**: Comprehensive endpoints for statistics and signal history
- **Scalable Architecture**: Support for up to 1000 concurrent connections

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [API Documentation](#api-documentation)
5. [WebSocket Protocol](#websocket-protocol)
6. [Browser Compatibility](#browser-compatibility)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)

---

## Installation

### Prerequisites

Before installing, ensure you have the following installed on your system:

- **Node.js**: Version 14.0.0 or higher
- **npm**: Version 6.0.0 or higher

Check your versions:
```bash
node --version
npm --version
```

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dnbyukusenge/Aviator-Predictor-Pro.git
   cd Aviator-Predictor-Pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` to customize your configuration (see [Configuration](#configuration) section below).

4. **Verify installation**
   ```bash
   npm start
   ```

   The server should start successfully and display:
   ```
   HTTP Server running on port 3000
   WebSocket Server running on port 8080
   ```

---

## Quick Start

### Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

### Accessing the Dashboard

Once the server is running, open your web browser and navigate to:

```
http://localhost:3000
```

The dashboard will automatically connect to the WebSocket server and begin receiving live signals.

### Testing the Connection

1. Open the dashboard in your browser
2. Look for the connection status indicator (top-right corner)
3. When connected, you'll see a green pulsing indicator
4. Live signals will appear in the main signal card area
5. Signal history displays the last 10 predictions

---

## Configuration

The system can be configured through environment variables (`.env` file) or the `config.json` file.

### Core Settings

#### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `HTTP_PORT` | 3000 | HTTP server port for serving the web application |
| `WEBSOCKET_PORT` | 8080 | WebSocket server port for real-time connections |
| `NODE_ENV` | development | Environment mode (development/production) |

#### Prediction Algorithm Parameters

| Variable | Default | Description |
|----------|---------|-------------|
| `CONFIDENCE_THRESHOLD` | 65 | Minimum confidence level (0-100) for signals |
| `ANALYSIS_WINDOW_SIZE` | 50 | Number of historical data points to analyze |
| `MIN_DATA_POINTS` | 10 | Minimum data points required before predictions |
| `PATTERN_RECOGNITION_DEPTH` | 20 | Depth of pattern matching analysis |

#### Signal Broadcasting

| Variable | Default | Description |
|----------|---------|-------------|
| `SIGNAL_BROADCAST_INTERVAL` | 3000 | Interval between signals (milliseconds) |
| `MIN_CONFIDENCE_FOR_BROADCAST` | 50 | Minimum confidence to broadcast a signal |
| `HISTORY_BUFFER_SIZE` | 100 | Number of signals to store in history |

#### WebSocket Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WS_PING_INTERVAL` | 25000 | Heartbeat ping interval (milliseconds) |
| `WS_PING_TIMEOUT` | 5000 | Ping timeout threshold (milliseconds) |
| `MAX_CONNECTIONS` | 1000 | Maximum concurrent WebSocket connections |
| `RECONNECTION_ATTEMPTS` | 5 | Client reconnection retry attempts |
| `RECONNECTION_DELAY` | 1000 | Delay between reconnection attempts (ms) |

#### Security Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_AUTHENTICATION` | false | Enable session-based authentication |
| `SESSION_TIMEOUT` | 3600000 | Session timeout duration (milliseconds) |
| `MAX_SESSIONS_PER_IP` | 5 | Maximum sessions allowed per IP address |

#### CORS Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | http://localhost:3000 | Allowed CORS origins (comma-separated) |
| `CORS_CREDENTIALS` | true | Allow credentials in CORS requests |

### Example Configuration

Here's a production-ready configuration example:

```bash
# .env
NODE_ENV=production
HTTP_PORT=3000
WEBSOCKET_PORT=8080

# Prediction tuning for higher accuracy
CONFIDENCE_THRESHOLD=70
ANALYSIS_WINDOW_SIZE=100
MIN_DATA_POINTS=20

# Broadcasting every 5 seconds
SIGNAL_BROADCAST_INTERVAL=5000
MIN_CONFIDENCE_FOR_BROADCAST=60

# Security enabled for production
ENABLE_AUTHENTICATION=true
MAX_CONNECTIONS=500
MAX_SESSIONS_PER_IP=3
```

---

## API Documentation

The system provides RESTful API endpoints for accessing statistics, history, and health information.

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### 1. Health Check

Check server status and uptime.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T10:30:45.123Z",
  "uptime": 3600,
  "service": "aviator-predictor-pro",
  "version": "1.0.0",
  "websocket": {
    "port": 8080,
    "status": "running"
  }
}
```

#### 2. Statistics

Get prediction statistics and server metrics.

**Request:**
```http
GET /api/stats
```

**Response:**
```json
{
  "uptime": 3600,
  "currentTime": "2025-12-02T10:30:45.123Z",
  "config": {
    "confidenceThreshold": 65,
    "signalBroadcastInterval": 3000,
    "minConfidenceForBroadcast": 50
  },
  "predictions": {
    "totalPredictions": 1250,
    "averageConfidence": 72.5,
    "highConfidencePredictions": 890
  },
  "connections": {
    "active": 45,
    "total": 1234,
    "peak": 128
  }
}
```

#### 3. Signal History

Retrieve recent signal history.

**Request:**
```http
GET /api/history?limit=10
```

**Query Parameters:**
- `limit` (optional): Number of historical signals to return (default: 10, max: 100)

**Response:**
```json
{
  "signals": [
    {
      "type": "BET",
      "confidence": 85,
      "timestamp": "2025-12-02T10:30:40.000Z",
      "metadata": {
        "multiplier": 2.45,
        "trend": "upward"
      }
    },
    {
      "type": "WAIT",
      "confidence": 62,
      "timestamp": "2025-12-02T10:30:35.000Z",
      "metadata": {
        "multiplier": 1.85,
        "trend": "neutral"
      }
    }
  ],
  "total": 100
}
```

---

## WebSocket Protocol

The system uses Socket.io for WebSocket communication with automatic fallback to long-polling.

### Connection

**Client Connection URL:**
```javascript
const socket = io('http://localhost:8080', {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Event Types

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connection` | - | Fired when client connects to server |
| `disconnect` | - | Fired when client disconnects |
| `subscribe` | `{ channel: string }` | Subscribe to specific signal channel |
| `unsubscribe` | `{ channel: string }` | Unsubscribe from signal channel |
| `ping` | `{ timestamp: number }` | Latency measurement ping |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ sessionId: string, timestamp: string }` | Connection established |
| `signal` | Signal Object (see below) | New prediction signal |
| `signal:history` | `{ signals: Array }` | Historical signals (on connect) |
| `stats:update` | Statistics Object | Updated server statistics |
| `error` | `{ code: string, message: string }` | Error notification |
| `pong` | `{ timestamp: number, latency: number }` | Ping response with latency |

### Signal Object Structure

```typescript
{
  type: 'BET' | 'WAIT' | 'CASH_OUT',
  confidence: number,        // 0-100
  timestamp: string,         // ISO 8601 format
  metadata: {
    multiplier: number,
    trend: string,
    riskLevel: 'low' | 'medium' | 'high',
    analysisWindow: number
  }
}
```

### Signal Types

- **BET**: Recommended time to place a bet (high confidence)
- **WAIT**: Suggested to wait for better opportunity (medium confidence)
- **CASH_OUT**: Recommended time to cash out current bet (high confidence)

### Example Implementation

```javascript
const socket = io('http://localhost:8080');

// Connection established
socket.on('connected', (data) => {
  console.log('Connected with session:', data.sessionId);
});

// Receive live signals
socket.on('signal', (signal) => {
  console.log('New signal:', signal.type);
  console.log('Confidence:', signal.confidence + '%');
  console.log('Timestamp:', signal.timestamp);

  if (signal.type === 'BET' && signal.confidence >= 80) {
    // High confidence bet signal
    alert('Strong BET signal detected!');
  }
});

// Handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### Connection States

The WebSocket connection can be in one of the following states:

1. **Connecting**: Initial connection attempt
2. **Connected**: Successfully connected and receiving signals
3. **Reconnecting**: Connection lost, attempting to reconnect
4. **Disconnected**: Connection closed (manual or server shutdown)
5. **Error**: Connection failed (check network/server status)

---

## Browser Compatibility

The Aviator Predictor Pro web application is compatible with modern web browsers.

### Supported Browsers

| Browser | Minimum Version | WebSocket Support | Notes |
|---------|----------------|-------------------|-------|
| Chrome | 90+ | ✅ Full | Recommended for best performance |
| Firefox | 88+ | ✅ Full | Excellent performance |
| Safari | 14+ | ✅ Full | iOS Safari 14+ supported |
| Edge | 90+ | ✅ Full | Chromium-based Edge |
| Opera | 76+ | ✅ Full | Full support |

### Mobile Browser Support

- **iOS Safari**: iOS 14.0 or higher
- **Chrome Mobile**: Android 5.0 or higher
- **Samsung Internet**: Version 14.0 or higher
- **Firefox Mobile**: Latest version recommended

### Required Browser Features

The application requires the following browser features:

- ✅ WebSocket API
- ✅ ES6 JavaScript support
- ✅ Local Storage API
- ✅ CSS Grid and Flexbox
- ✅ Audio API (for notifications)

### Testing Your Browser

Visit the dashboard at `http://localhost:3000` and check the connection status:
- **Green pulsing indicator**: Fully compatible
- **Red indicator**: WebSocket connection issues (check browser compatibility)
- **Yellow indicator**: Degraded mode (using polling fallback)

### Known Limitations

- **Internet Explorer**: Not supported (no WebSocket support)
- **Safari < 14**: Limited WebSocket support
- **Opera Mini**: Reduced functionality (proxy-based browsing)

---

## Deployment

### Production Deployment Checklist

Before deploying to production, ensure you:

1. ✅ Set `NODE_ENV=production` in your environment
2. ✅ Configure appropriate `CORS_ORIGINS` for your domain
3. ✅ Enable authentication if required (`ENABLE_AUTHENTICATION=true`)
4. ✅ Adjust `MAX_CONNECTIONS` based on server capacity
5. ✅ Set up SSL/TLS certificates for HTTPS
6. ✅ Configure reverse proxy (nginx/Apache) if needed
7. ✅ Set up monitoring and logging
8. ✅ Configure firewall rules for ports 3000 and 8080

### Deployment Options

#### Option 1: Traditional VPS/Dedicated Server

1. **Install dependencies:**
   ```bash
   npm install --production
   ```

2. **Use a process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name aviator-predictor
   pm2 save
   pm2 startup
   ```

3. **Configure nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /socket.io/ {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

#### Option 2: Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000 8080
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t aviator-predictor .
docker run -p 3000:3000 -p 8080:8080 aviator-predictor
```

#### Option 3: Cloud Platforms

**Heroku:**
```bash
heroku create aviator-predictor-pro
heroku config:set NODE_ENV=production
git push heroku main
```

**DigitalOcean App Platform:**
- Deploy directly from GitHub repository
- Configure environment variables in dashboard
- Enable WebSocket support in settings

### Environment Variables for Production

```bash
NODE_ENV=production
HTTP_PORT=3000
WEBSOCKET_PORT=8080
CORS_ORIGINS=https://yourdomain.com
ENABLE_AUTHENTICATION=true
MAX_CONNECTIONS=500
LOG_LEVEL=warn
```

### SSL/TLS Configuration

For secure WebSocket connections (WSS), configure SSL certificates:

```javascript
// In production, use HTTPS server
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.crt')
};

const server = https.createServer(options, app);
```

---

## Troubleshooting

### Common Connection Issues

#### Issue 1: WebSocket Connection Failed

**Symptoms:**
- Red connection indicator in dashboard
- "Connection failed" error in browser console
- No signals appearing

**Solutions:**

1. **Check server is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Expected: `{"status":"ok",...}`

2. **Verify WebSocket port is accessible:**
   ```bash
   telnet localhost 8080
   ```

3. **Check firewall rules:**
   ```bash
   # Linux
   sudo ufw allow 8080/tcp

   # Windows
   netsh advfirewall firewall add rule name="WebSocket" dir=in action=allow protocol=TCP localport=8080
   ```

4. **Inspect browser console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Look for CORS or network errors

#### Issue 2: CORS Errors

**Symptoms:**
- "CORS policy blocked" error in console
- HTTP requests fail from browser

**Solutions:**

1. **Add your domain to CORS origins:**
   ```bash
   # .env
   CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
   ```

2. **Verify CORS configuration in config.json:**
   ```json
   {
     "security": {
       "cors": {
         "origins": ["http://localhost:3000"],
         "credentials": true
       }
     }
   }
   ```

3. **Restart server after changes:**
   ```bash
   npm start
   ```

#### Issue 3: Signals Not Appearing

**Symptoms:**
- Connected successfully but no signals
- Empty signal history

**Solutions:**

1. **Check prediction engine is running:**
   ```bash
   curl http://localhost:3000/api/stats
   ```

2. **Lower confidence threshold:**
   ```bash
   # .env
   MIN_CONFIDENCE_FOR_BROADCAST=40
   ```

3. **Verify broadcast interval:**
   ```bash
   # .env
   SIGNAL_BROADCAST_INTERVAL=3000
   ```

4. **Check server logs:**
   ```bash
   # If using PM2
   pm2 logs aviator-predictor
   ```

#### Issue 4: High Latency / Slow Performance

**Symptoms:**
- Delayed signal delivery
- Slow page load times
- Timeouts

**Solutions:**

1. **Reduce analysis window size:**
   ```bash
   ANALYSIS_WINDOW_SIZE=30
   PATTERN_RECOGNITION_DEPTH=10
   ```

2. **Increase broadcast interval:**
   ```bash
   SIGNAL_BROADCAST_INTERVAL=5000
   ```

3. **Limit concurrent connections:**
   ```bash
   MAX_CONNECTIONS=100
   ```

4. **Check server resources:**
   ```bash
   # Linux
   htop

   # Check Node.js memory
   node --max-old-space-size=4096 server.js
   ```

#### Issue 5: Authentication Failures

**Symptoms:**
- "Authentication failed" error
- Unable to establish connection

**Solutions:**

1. **Disable authentication for testing:**
   ```bash
   ENABLE_AUTHENTICATION=false
   ```

2. **Clear browser storage:**
   - Open DevTools (F12)
   - Application → Local Storage → Clear

3. **Check session timeout:**
   ```bash
   SESSION_TIMEOUT=3600000  # 1 hour
   ```

### Browser-Specific Issues

#### Chrome/Edge

**Issue:** WebSocket connection drops frequently

**Solution:**
```javascript
// Increase ping interval
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=10000
```

#### Safari

**Issue:** Audio notifications don't work

**Solution:**
- User interaction required before audio
- Add a "Start" button to initialize audio context

#### Firefox

**Issue:** Local Storage quota exceeded

**Solution:**
- Reduce `HISTORY_BUFFER_SIZE` in config
- Clear browser data periodically

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# .env
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=true
LOG_DIRECTORY=./logs
```

Check logs:
```bash
tail -f logs/app.log
```

### Getting Help

If you continue experiencing issues:

1. **Check GitHub Issues**: [Issues Page](https://github.com/dnbyukusenge/Aviator-Predictor-Pro/issues)
2. **Review Configuration**: Double-check all environment variables
3. **Test API Endpoints**: Use `curl` or Postman to test endpoints
4. **Browser Console**: Always check for JavaScript errors
5. **Network Tab**: Inspect WebSocket frames in DevTools

---

## Contributing

We welcome contributions to the Aviator Predictor Pro project.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/your-username/Aviator-Predictor-Pro.git
cd Aviator-Predictor-Pro
npm install
npm run dev
```

---

## License

This project is licensed under the ISC License.

---

## Contact

For questions, support, or feedback:

- **Instagram**: [@aviatorpredictpro](https://instagram.com/aviatorpredictpro)
- **GitHub**: [Issues](https://github.com/dnbyukusenge/Aviator-Predictor-Pro/issues)

---

## Acknowledgments

Thank you to all contributors and users of Aviator Predictor Pro. Your feedback helps us improve the system continuously.

**Happy Betting! 🎲**
