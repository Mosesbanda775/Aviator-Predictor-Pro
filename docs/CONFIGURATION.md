# Configuration Guide

Complete configuration reference for the Aviator Predictor Pro Live Signal System.

## Table of Contents

1. [Configuration Overview](#configuration-overview)
2. [Environment Variables](#environment-variables)
3. [Configuration File](#configuration-file)
4. [Prediction Algorithm Tuning](#prediction-algorithm-tuning)
5. [Performance Optimization](#performance-optimization)
6. [Security Configuration](#security-configuration)
7. [Configuration Examples](#configuration-examples)

---

## Configuration Overview

The system can be configured through two methods:

1. **Environment Variables** (`.env` file) - Highest priority
2. **Configuration File** (`config.json`) - Fallback values

Environment variables override config.json settings when both are present.

### Quick Start

```bash
# Copy example environment file
cp .env.example .env

# Edit with your preferred settings
nano .env

# Restart server to apply changes
pm2 restart aviator-predictor
```

---

## Environment Variables

### Server Configuration

#### HTTP_PORT

**Type:** Integer
**Default:** 3000
**Description:** Port for HTTP server (API and static files)

```bash
HTTP_PORT=3000
```

**Considerations:**
- Use ports > 1024 to avoid requiring root privileges
- Common alternatives: 8000, 8080, 5000
- Must not conflict with WEBSOCKET_PORT

---

#### WEBSOCKET_PORT

**Type:** Integer
**Default:** 8080
**Description:** Port for WebSocket server (real-time connections)

```bash
WEBSOCKET_PORT=8080
```

**Considerations:**
- Must be different from HTTP_PORT
- Ensure firewall allows this port
- Common alternatives: 8081, 9000

---

#### NODE_ENV

**Type:** String
**Default:** development
**Options:** development | production | test

```bash
NODE_ENV=production
```

**Effects:**
- **development**: Verbose logging, auto-reload, CORS permissive
- **production**: Minimal logging, optimized performance, strict CORS
- **test**: Test-specific settings

---

### WebSocket Configuration

#### WS_PING_INTERVAL

**Type:** Integer (milliseconds)
**Default:** 25000
**Description:** Interval between heartbeat pings

```bash
WS_PING_INTERVAL=25000
```

**Tuning:**
- **Lower** (15000-20000): More responsive to disconnections, higher bandwidth
- **Higher** (30000-60000): Less bandwidth, slower disconnect detection
- Recommended: 20000-30000

---

#### WS_PING_TIMEOUT

**Type:** Integer (milliseconds)
**Default:** 5000
**Description:** Time to wait for pong response before considering connection dead

```bash
WS_PING_TIMEOUT=5000
```

**Tuning:**
- **Lower** (3000): Fast failure detection, may cause false disconnects
- **Higher** (10000): More tolerant of network lag
- Recommended: 5000-7000

---

#### MAX_CONNECTIONS

**Type:** Integer
**Default:** 1000
**Description:** Maximum concurrent WebSocket connections

```bash
MAX_CONNECTIONS=1000
```

**Tuning by Server Resources:**
- **512MB RAM**: 50-100 connections
- **1GB RAM**: 200-300 connections
- **2GB RAM**: 500-1000 connections
- **4GB+ RAM**: 1000+ connections

**Formula:** ~1-2MB RAM per connection

---

#### RECONNECTION_ATTEMPTS

**Type:** Integer
**Default:** 5
**Description:** Client reconnection retry attempts

```bash
RECONNECTION_ATTEMPTS=5
```

**Considerations:**
- Too low: Users give up quickly
- Too high: Wastes resources on dead connections
- Recommended: 5-10

---

#### RECONNECTION_DELAY

**Type:** Integer (milliseconds)
**Default:** 1000
**Description:** Initial delay between reconnection attempts

```bash
RECONNECTION_DELAY=1000
```

**Behavior:** Uses exponential backoff
- Attempt 1: 1000ms
- Attempt 2: 2000ms
- Attempt 3: 4000ms
- etc.

---

### Prediction Algorithm Parameters

#### CONFIDENCE_THRESHOLD

**Type:** Integer (0-100)
**Default:** 65
**Description:** Minimum confidence level for making predictions

```bash
CONFIDENCE_THRESHOLD=65
```

**Impact:**
- **Lower** (50-60): More signals, potentially less accurate
- **Medium** (65-75): Balanced quantity and quality
- **Higher** (80-90): Fewer signals, higher accuracy

**Recommendation by Use Case:**
- **High Volume Trading**: 60-70
- **Conservative Trading**: 75-85
- **Testing/Demo**: 50-60

---

#### ANALYSIS_WINDOW_SIZE

**Type:** Integer
**Default:** 50
**Description:** Number of historical data points to analyze

```bash
ANALYSIS_WINDOW_SIZE=50
```

**Impact:**
- **Smaller** (20-40): Faster, more responsive to recent trends, less stable
- **Medium** (50-70): Balanced
- **Larger** (80-150): More stable predictions, slower to adapt

**Tuning:**
- **Volatile Markets**: 30-50
- **Stable Markets**: 70-100
- **Long-term Analysis**: 100-200

**Performance Impact:** Linear increase in CPU usage

---

#### MIN_DATA_POINTS

**Type:** Integer
**Default:** 10
**Description:** Minimum data points required before making predictions

```bash
MIN_DATA_POINTS=10
```

**Recommendations:**
- **Development/Testing**: 5
- **Production**: 10-20
- **High Accuracy**: 20-30

**Note:** Lower values mean predictions start faster after server restart

---

#### PATTERN_RECOGNITION_DEPTH

**Type:** Integer
**Default:** 20
**Description:** Depth of pattern matching analysis

```bash
PATTERN_RECOGNITION_DEPTH=20
```

**Impact:**
- **Shallow** (10-15): Fast, basic pattern recognition
- **Medium** (20-25): Balanced
- **Deep** (30-40): Detailed patterns, higher CPU usage

**Performance Impact:** Exponential increase in CPU usage

---

### Signal Broadcasting

#### SIGNAL_BROADCAST_INTERVAL

**Type:** Integer (milliseconds)
**Default:** 3000
**Description:** Interval between signal broadcasts

```bash
SIGNAL_BROADCAST_INTERVAL=3000
```

**Tuning:**
- **High Frequency** (1000-2000): Real-time, higher server load
- **Medium** (3000-5000): Balanced
- **Low Frequency** (7000-10000): Reduced load, less timely

**Bandwidth Impact:**
- 1000ms: ~60 signals/min
- 3000ms: ~20 signals/min
- 5000ms: ~12 signals/min

---

#### MIN_CONFIDENCE_FOR_BROADCAST

**Type:** Integer (0-100)
**Default:** 50
**Description:** Minimum confidence to broadcast a signal

```bash
MIN_CONFIDENCE_FOR_BROADCAST=50
```

**Relationship with CONFIDENCE_THRESHOLD:**
- Should be ≤ CONFIDENCE_THRESHOLD
- Filters which predictions are broadcasted

**Examples:**
- CONFIDENCE_THRESHOLD=70, MIN_CONFIDENCE_FOR_BROADCAST=60: Broadcast medium+ confidence
- CONFIDENCE_THRESHOLD=80, MIN_CONFIDENCE_FOR_BROADCAST=75: Only high confidence

---

#### HISTORY_BUFFER_SIZE

**Type:** Integer
**Default:** 100
**Description:** Number of signals to store in server memory

```bash
HISTORY_BUFFER_SIZE=100
```

**Memory Impact:** ~1KB per signal
- 50 signals: ~50KB
- 100 signals: ~100KB
- 500 signals: ~500KB

**Recommendations:**
- **Low Memory**: 50
- **Standard**: 100
- **High History**: 200-500

---

### API Configuration

#### AVIATOR_DATA_SOURCE

**Type:** URL
**Default:** https://api.aviator-game.com/v1/results
**Description:** Primary data source URL

```bash
AVIATOR_DATA_SOURCE=https://api.aviator-game.com/v1/results
```

---

#### FALLBACK_DATA_SOURCE

**Type:** URL
**Default:** https://backup-api.aviator-game.com/v1/results
**Description:** Fallback data source if primary fails

```bash
FALLBACK_DATA_SOURCE=https://backup-api.aviator-game.com/v1/results
```

---

#### API_REQUEST_TIMEOUT

**Type:** Integer (milliseconds)
**Default:** 5000
**Description:** Timeout for API requests

```bash
API_REQUEST_TIMEOUT=5000
```

**Tuning:**
- **Fast Networks**: 3000-5000
- **Slow Networks**: 7000-10000
- **Very Slow**: 15000

---

#### API_RETRY_ATTEMPTS

**Type:** Integer
**Default:** 3
**Description:** Number of retry attempts for failed API requests

```bash
API_RETRY_ATTEMPTS=3
```

---

### Security Settings

#### ENABLE_AUTHENTICATION

**Type:** Boolean
**Default:** false
**Description:** Enable session-based authentication

```bash
ENABLE_AUTHENTICATION=true
```

**When to Enable:**
- Production deployments
- Public-facing servers
- When limiting access is required

**When to Disable:**
- Development
- Internal/private networks
- Testing

---

#### SESSION_TIMEOUT

**Type:** Integer (milliseconds)
**Default:** 3600000 (1 hour)
**Description:** Session timeout duration

```bash
SESSION_TIMEOUT=3600000
```

**Common Values:**
- 15 minutes: 900000
- 30 minutes: 1800000
- 1 hour: 3600000
- 24 hours: 86400000

---

#### MAX_SESSIONS_PER_IP

**Type:** Integer
**Default:** 5
**Description:** Maximum sessions per IP address

```bash
MAX_SESSIONS_PER_IP=5
```

**Tuning:**
- **Restrictive**: 1-3
- **Standard**: 5
- **Permissive**: 10-20

---

### CORS Configuration

#### CORS_ORIGINS

**Type:** Comma-separated URLs
**Default:** http://localhost:3000
**Description:** Allowed CORS origins

```bash
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com,https://www.yourdomain.com
```

**Important:**
- **Production**: Set to your exact domain(s)
- **Development**: Include localhost with various ports
- **Never use `*` in production**

**Examples:**
```bash
# Development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000

# Production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Staging + Production
CORS_ORIGINS=https://staging.yourdomain.com,https://yourdomain.com
```

---

#### CORS_CREDENTIALS

**Type:** Boolean
**Default:** true
**Description:** Allow credentials in CORS requests

```bash
CORS_CREDENTIALS=true
```

**Set to true when:**
- Using cookies
- Using authentication
- Sending credentials

---

### Logging Configuration

#### LOG_LEVEL

**Type:** String
**Default:** info
**Options:** error | warn | info | debug

```bash
LOG_LEVEL=info
```

**Levels:**
- **error**: Only errors
- **warn**: Errors + warnings
- **info**: Errors + warnings + info (recommended for production)
- **debug**: All messages (verbose, for development)

---

#### ENABLE_FILE_LOGGING

**Type:** Boolean
**Default:** true
**Description:** Enable logging to files

```bash
ENABLE_FILE_LOGGING=true
```

---

#### LOG_DIRECTORY

**Type:** Path
**Default:** ./logs
**Description:** Directory for log files

```bash
LOG_DIRECTORY=/var/log/aviator-predictor
```

**Ensure:**
- Directory exists
- Write permissions
- Sufficient disk space

---

#### MAX_LOG_FILES

**Type:** Integer
**Default:** 7
**Description:** Number of log files to retain

```bash
MAX_LOG_FILES=7
```

**Storage Impact:**
- 1 day: ~1-10MB per day
- 7 days: ~7-70MB
- 30 days: ~30-300MB

---

### Rate Limiting

#### RATE_LIMIT_MAX_REQUESTS

**Type:** Integer
**Default:** 60
**Description:** Maximum requests per window

```bash
RATE_LIMIT_MAX_REQUESTS=60
```

---

#### RATE_LIMIT_WINDOW_MS

**Type:** Integer (milliseconds)
**Default:** 60000 (1 minute)
**Description:** Rate limit window duration

```bash
RATE_LIMIT_WINDOW_MS=60000
```

**Effective Rate:**
- 60 requests / 60000ms = 1 request/second
- 120 requests / 60000ms = 2 requests/second

---

## Configuration File

### config.json Structure

```json
{
  "server": {
    "websocketPort": 8080,
    "httpPort": 3000,
    "environment": "production"
  },
  "websocket": {
    "pingInterval": 25000,
    "pingTimeout": 5000,
    "maxConnections": 1000,
    "reconnectionAttempts": 5,
    "reconnectionDelay": 1000
  },
  "prediction": {
    "confidenceThreshold": 65,
    "analysisWindowSize": 50,
    "minDataPoints": 10,
    "patternRecognitionDepth": 20,
    "signalBroadcastInterval": 5000,
    "riskLevels": {
      "low": { "min": 0, "max": 30 },
      "medium": { "min": 31, "max": 60 },
      "high": { "min": 61, "max": 100 }
    }
  },
  "signals": {
    "broadcastInterval": 3000,
    "historyBufferSize": 100,
    "minConfidenceForBroadcast": 50,
    "signalTypes": ["BET", "WAIT", "CASH_OUT"],
    "rateLimitPerClient": {
      "maxRequests": 60,
      "windowMs": 60000
    }
  },
  "security": {
    "enableAuthentication": false,
    "sessionTimeout": 3600000,
    "maxSessionsPerIP": 5,
    "cors": {
      "origins": ["http://localhost:3000"],
      "credentials": true
    }
  },
  "logging": {
    "level": "info",
    "enableFileLogging": true,
    "logDirectory": "./logs",
    "maxLogFiles": 7
  }
}
```

---

## Prediction Algorithm Tuning

### Use Case: High-Volume Trading

**Goal:** Maximum signal frequency

```bash
CONFIDENCE_THRESHOLD=60
ANALYSIS_WINDOW_SIZE=40
MIN_CONFIDENCE_FOR_BROADCAST=55
SIGNAL_BROADCAST_INTERVAL=2000
```

### Use Case: Conservative Trading

**Goal:** High-accuracy signals only

```bash
CONFIDENCE_THRESHOLD=80
ANALYSIS_WINDOW_SIZE=100
MIN_CONFIDENCE_FOR_BROADCAST=75
SIGNAL_BROADCAST_INTERVAL=5000
PATTERN_RECOGNITION_DEPTH=30
```

### Use Case: Balanced Approach

**Goal:** Balance between frequency and accuracy

```bash
CONFIDENCE_THRESHOLD=70
ANALYSIS_WINDOW_SIZE=60
MIN_CONFIDENCE_FOR_BROADCAST=65
SIGNAL_BROADCAST_INTERVAL=3000
PATTERN_RECOGNITION_DEPTH=20
```

### Use Case: Real-Time Trading

**Goal:** Fastest possible signals

```bash
CONFIDENCE_THRESHOLD=65
ANALYSIS_WINDOW_SIZE=30
MIN_DATA_POINTS=10
SIGNAL_BROADCAST_INTERVAL=1000
```

---

## Performance Optimization

### Low-Resource Server (512MB RAM, 1 CPU)

```bash
MAX_CONNECTIONS=50
ANALYSIS_WINDOW_SIZE=30
PATTERN_RECOGNITION_DEPTH=10
HISTORY_BUFFER_SIZE=50
SIGNAL_BROADCAST_INTERVAL=5000
```

### Medium Server (2GB RAM, 2 CPU)

```bash
MAX_CONNECTIONS=300
ANALYSIS_WINDOW_SIZE=60
PATTERN_RECOGNITION_DEPTH=20
HISTORY_BUFFER_SIZE=100
SIGNAL_BROADCAST_INTERVAL=3000
```

### High-Performance Server (4GB+ RAM, 4+ CPU)

```bash
MAX_CONNECTIONS=1000
ANALYSIS_WINDOW_SIZE=100
PATTERN_RECOGNITION_DEPTH=30
HISTORY_BUFFER_SIZE=200
SIGNAL_BROADCAST_INTERVAL=2000
```

---

## Security Configuration

### Development Environment

```bash
NODE_ENV=development
ENABLE_AUTHENTICATION=false
CORS_ORIGINS=*
LOG_LEVEL=debug
```

### Staging Environment

```bash
NODE_ENV=production
ENABLE_AUTHENTICATION=true
CORS_ORIGINS=https://staging.yourdomain.com
LOG_LEVEL=info
SESSION_TIMEOUT=1800000
MAX_SESSIONS_PER_IP=10
```

### Production Environment

```bash
NODE_ENV=production
ENABLE_AUTHENTICATION=true
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=warn
SESSION_TIMEOUT=3600000
MAX_SESSIONS_PER_IP=3
RATE_LIMIT_MAX_REQUESTS=60
```

---

## Configuration Examples

### Complete Development Configuration

`.env`:
```bash
NODE_ENV=development
HTTP_PORT=3000
WEBSOCKET_PORT=8080

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_CREDENTIALS=true

ENABLE_AUTHENTICATION=false

CONFIDENCE_THRESHOLD=60
ANALYSIS_WINDOW_SIZE=40
MIN_DATA_POINTS=5
PATTERN_RECOGNITION_DEPTH=15

SIGNAL_BROADCAST_INTERVAL=3000
MIN_CONFIDENCE_FOR_BROADCAST=50
HISTORY_BUFFER_SIZE=100

WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=5000
MAX_CONNECTIONS=100

LOG_LEVEL=debug
ENABLE_FILE_LOGGING=true
LOG_DIRECTORY=./logs
MAX_LOG_FILES=3
```

### Complete Production Configuration

`.env`:
```bash
NODE_ENV=production
HTTP_PORT=3000
WEBSOCKET_PORT=8080

CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true

ENABLE_AUTHENTICATION=true
SESSION_TIMEOUT=3600000
MAX_SESSIONS_PER_IP=3

CONFIDENCE_THRESHOLD=70
ANALYSIS_WINDOW_SIZE=80
MIN_DATA_POINTS=20
PATTERN_RECOGNITION_DEPTH=25

SIGNAL_BROADCAST_INTERVAL=5000
MIN_CONFIDENCE_FOR_BROADCAST=65
HISTORY_BUFFER_SIZE=100

WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=5000
MAX_CONNECTIONS=500
RECONNECTION_ATTEMPTS=5
RECONNECTION_DELAY=1000

AVIATOR_DATA_SOURCE=https://api.aviator-game.com/v1/results
FALLBACK_DATA_SOURCE=https://backup-api.aviator-game.com/v1/results
API_REQUEST_TIMEOUT=5000
API_RETRY_ATTEMPTS=3

LOG_LEVEL=warn
ENABLE_FILE_LOGGING=true
LOG_DIRECTORY=/var/log/aviator-predictor
MAX_LOG_FILES=14

RATE_LIMIT_MAX_REQUESTS=60
RATE_LIMIT_WINDOW_MS=60000
```

---

## Validation

Validate your configuration before deploying:

```bash
# Check .env syntax
cat .env | grep -v '^#' | grep '='

# Validate config.json
node -e "console.log(JSON.stringify(require('./config.json'), null, 2))"

# Test configuration
npm start
curl http://localhost:3000/api/health
```

---

## Best Practices

1. **Always use .env for secrets and environment-specific settings**
2. **Use config.json for default values and structure**
3. **Never commit .env to version control**
4. **Document custom configurations**
5. **Test configuration changes in staging first**
6. **Monitor performance after tuning**
7. **Keep backups of working configurations**

---

**Last Updated:** December 2, 2025
