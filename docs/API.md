# API Documentation

Complete API reference for the Aviator Predictor Pro Live Signal System.

## Base URL

```
http://localhost:3000/api
```

For production deployments, replace `localhost:3000` with your domain.

---

## Authentication

Currently, the API supports optional session-based authentication. When `ENABLE_AUTHENTICATION=true` in your environment:

- Session tokens are required for all requests
- Include the session token in the `Authorization` header
- Sessions expire after the configured timeout (default: 1 hour)

**Example:**
```http
Authorization: Bearer <session-token>
```

---

## REST API Endpoints

### 1. Health Check

Check server health and status.

**Endpoint:** `GET /api/health`

**Authentication:** Not required

**Query Parameters:** None

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

**Status Codes:**
- `200 OK`: Server is healthy
- `503 Service Unavailable`: Server is experiencing issues

**Example:**
```bash
curl http://localhost:3000/api/health
```

---

### 2. Server Statistics

Get detailed server and prediction statistics.

**Endpoint:** `GET /api/stats`

**Authentication:** Optional

**Query Parameters:** None

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
    "highConfidencePredictions": 890,
    "signalTypeDistribution": {
      "BET": 450,
      "WAIT": 550,
      "CASH_OUT": 250
    }
  },
  "connections": {
    "active": 45,
    "total": 1234,
    "peak": 128,
    "rejected": 12
  },
  "performance": {
    "averageLatency": 15,
    "successRate": 99.5
  }
}
```

**Status Codes:**
- `200 OK`: Statistics retrieved successfully
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:3000/api/stats
```

---

### 3. Signal History

Retrieve historical prediction signals.

**Endpoint:** `GET /api/history`

**Authentication:** Optional

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 10 | Number of signals to return (max: 100) |
| `offset` | integer | No | 0 | Number of signals to skip |
| `type` | string | No | - | Filter by signal type (BET, WAIT, CASH_OUT) |
| `minConfidence` | integer | No | 0 | Minimum confidence level (0-100) |
| `startTime` | ISO 8601 | No | - | Start of time range |
| `endTime` | ISO 8601 | No | - | End of time range |

**Response:**

```json
{
  "signals": [
    {
      "id": "sig_123456789",
      "type": "BET",
      "confidence": 85,
      "timestamp": "2025-12-02T10:30:40.000Z",
      "metadata": {
        "multiplier": 2.45,
        "trend": "upward",
        "riskLevel": "medium",
        "analysisWindow": 50
      }
    },
    {
      "id": "sig_123456788",
      "type": "WAIT",
      "confidence": 62,
      "timestamp": "2025-12-02T10:30:35.000Z",
      "metadata": {
        "multiplier": 1.85,
        "trend": "neutral",
        "riskLevel": "low",
        "analysisWindow": 50
      }
    }
  ],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

**Status Codes:**
- `200 OK`: History retrieved successfully
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error

**Examples:**

Get last 10 signals:
```bash
curl http://localhost:3000/api/history?limit=10
```

Get BET signals with confidence > 75:
```bash
curl "http://localhost:3000/api/history?type=BET&minConfidence=75&limit=20"
```

Get signals in time range:
```bash
curl "http://localhost:3000/api/history?startTime=2025-12-02T00:00:00Z&endTime=2025-12-02T12:00:00Z"
```

---

## WebSocket API

The WebSocket API provides real-time bidirectional communication for live signal delivery.

### Connection

**URL:** `ws://localhost:8080` (or `wss://` for secure connections)

**Library:** Socket.io (compatible with Socket.io client v4.x)

**Transports:** WebSocket (primary), Long-polling (fallback)

### Client Connection

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:8080', {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});
```

### Events Reference

#### Client → Server Events

##### 1. Connection

Automatically fired when client connects.

**Event:** `connection`

**Payload:** None

**Server Response:** `connected` event

---

##### 2. Disconnect

Fired when client disconnects.

**Event:** `disconnect`

**Payload:** None

**Server Response:** None

---

##### 3. Subscribe

Subscribe to specific signal channels.

**Event:** `subscribe`

**Payload:**
```json
{
  "channel": "signals:high-confidence"
}
```

**Available Channels:**
- `signals:all` - All signals
- `signals:high-confidence` - Signals with confidence ≥ 80
- `signals:BET` - Only BET signals
- `signals:WAIT` - Only WAIT signals
- `signals:CASH_OUT` - Only CASH_OUT signals

**Server Response:**
```json
{
  "status": "subscribed",
  "channel": "signals:high-confidence"
}
```

---

##### 4. Unsubscribe

Unsubscribe from a channel.

**Event:** `unsubscribe`

**Payload:**
```json
{
  "channel": "signals:high-confidence"
}
```

**Server Response:**
```json
{
  "status": "unsubscribed",
  "channel": "signals:high-confidence"
}
```

---

##### 5. Ping

Measure connection latency.

**Event:** `ping`

**Payload:**
```json
{
  "timestamp": 1638446445123
}
```

**Server Response:** `pong` event

---

#### Server → Client Events

##### 1. Connected

Fired when connection is established.

**Event:** `connected`

**Payload:**
```json
{
  "sessionId": "sess_abc123def456",
  "timestamp": "2025-12-02T10:30:45.123Z",
  "serverVersion": "1.0.0",
  "config": {
    "signalBroadcastInterval": 3000,
    "availableChannels": ["signals:all", "signals:high-confidence"]
  }
}
```

---

##### 2. Signal

New prediction signal broadcast.

**Event:** `signal`

**Payload:**
```json
{
  "id": "sig_123456789",
  "type": "BET",
  "confidence": 85,
  "timestamp": "2025-12-02T10:30:45.123Z",
  "metadata": {
    "multiplier": 2.45,
    "trend": "upward",
    "riskLevel": "medium",
    "analysisWindow": 50,
    "patternMatch": "ascending_triangle",
    "volatility": 0.32
  },
  "recommendations": {
    "action": "PLACE_BET",
    "suggestedMultiplier": 2.5,
    "riskAssessment": "Medium risk, high confidence"
  }
}
```

**Signal Types:**
- `BET`: Place a bet now
- `WAIT`: Hold, wait for better opportunity
- `CASH_OUT`: Cash out current bet

---

##### 3. Signal History

Historical signals sent on initial connection.

**Event:** `signal:history`

**Payload:**
```json
{
  "signals": [
    {
      "id": "sig_123456789",
      "type": "BET",
      "confidence": 85,
      "timestamp": "2025-12-02T10:30:45.123Z",
      "metadata": { ... }
    }
  ],
  "count": 10,
  "timestamp": "2025-12-02T10:30:45.123Z"
}
```

---

##### 4. Statistics Update

Periodic server statistics updates.

**Event:** `stats:update`

**Payload:**
```json
{
  "timestamp": "2025-12-02T10:30:45.123Z",
  "activeConnections": 45,
  "totalPredictions": 1250,
  "averageConfidence": 72.5,
  "recentAccuracy": 85.3
}
```

**Frequency:** Every 10 seconds (configurable)

---

##### 5. Error

Error notifications.

**Event:** `error`

**Payload:**
```json
{
  "code": "MAX_CONNECTIONS_REACHED",
  "message": "Server has reached maximum connection limit",
  "timestamp": "2025-12-02T10:30:45.123Z",
  "severity": "error"
}
```

**Error Codes:**
- `MAX_CONNECTIONS_REACHED`: Connection limit exceeded
- `AUTHENTICATION_FAILED`: Invalid or expired session
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_CHANNEL`: Subscription to invalid channel
- `INTERNAL_ERROR`: Server error

---

##### 6. Pong

Response to ping (latency measurement).

**Event:** `pong`

**Payload:**
```json
{
  "timestamp": 1638446445123,
  "serverTimestamp": 1638446445125,
  "latency": 2
}
```

---

### Example Client Implementation

#### Basic Connection

```javascript
const socket = io('http://localhost:8080');

// Handle connection
socket.on('connected', (data) => {
  console.log('Connected:', data.sessionId);
  console.log('Server version:', data.serverVersion);
});

// Receive signals
socket.on('signal', (signal) => {
  console.log(`Signal: ${signal.type} (${signal.confidence}%)`);

  if (signal.type === 'BET' && signal.confidence >= 80) {
    console.log('High confidence BET signal!');
  }
});

// Handle errors
socket.on('error', (error) => {
  console.error('Error:', error.message);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

#### Advanced Usage with Subscriptions

```javascript
const socket = io('http://localhost:8080');

socket.on('connected', (data) => {
  // Subscribe to high-confidence signals only
  socket.emit('subscribe', {
    channel: 'signals:high-confidence'
  });
});

socket.on('signal', (signal) => {
  // Process high-confidence signals
  if (signal.confidence >= 80) {
    displaySignal(signal);
    playNotificationSound();
  }
});

// Measure latency
setInterval(() => {
  socket.emit('ping', { timestamp: Date.now() });
}, 30000);

socket.on('pong', (data) => {
  console.log('Latency:', data.latency, 'ms');
});
```

#### Reconnection Handling

```javascript
const socket = io('http://localhost:8080', {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}`);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect after maximum attempts');
  // Show error UI to user
});
```

---

## Data Models

### Signal Object

```typescript
interface Signal {
  id: string;                    // Unique signal identifier
  type: 'BET' | 'WAIT' | 'CASH_OUT';
  confidence: number;            // 0-100
  timestamp: string;             // ISO 8601 format
  metadata: {
    multiplier: number;          // Current game multiplier
    trend: string;               // upward, downward, neutral
    riskLevel: 'low' | 'medium' | 'high';
    analysisWindow: number;      // Number of data points analyzed
    patternMatch?: string;       // Detected pattern (optional)
    volatility?: number;         // Market volatility (0-1)
  };
  recommendations?: {
    action: string;
    suggestedMultiplier?: number;
    riskAssessment?: string;
  };
}
```

### Statistics Object

```typescript
interface Statistics {
  uptime: number;                // Server uptime in seconds
  currentTime: string;           // ISO 8601 timestamp
  config: {
    confidenceThreshold: number;
    signalBroadcastInterval: number;
    minConfidenceForBroadcast: number;
  };
  predictions: {
    totalPredictions: number;
    averageConfidence: number;
    highConfidencePredictions: number;
    signalTypeDistribution?: {
      BET: number;
      WAIT: number;
      CASH_OUT: number;
    };
  };
  connections: {
    active: number;
    total: number;
    peak: number;
    rejected?: number;
  };
  performance?: {
    averageLatency: number;
    successRate: number;
  };
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse.

**Default Limits:**
- REST API: 60 requests per minute per IP
- WebSocket: 100 messages per minute per connection

**Response Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1638446500
```

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30
}
```

---

## Error Handling

### HTTP Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Endpoint doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Server overloaded |

### Error Response Format

```json
{
  "error": true,
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "timestamp": "2025-12-02T10:30:45.123Z",
  "details": {
    "field": "Additional context"
  }
}
```

---

## Best Practices

1. **Use WebSocket for real-time data**: Don't poll REST endpoints for signals
2. **Handle reconnections gracefully**: Implement exponential backoff
3. **Validate signal data**: Always check confidence levels before acting
4. **Monitor latency**: Use ping/pong to track connection quality
5. **Respect rate limits**: Cache responses when possible
6. **Handle errors**: Always implement error handlers
7. **Subscribe selectively**: Only subscribe to channels you need
8. **Clean up connections**: Disconnect when not in use

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/dnbyukusenge/Aviator-Predictor-Pro/issues
- Documentation: See README.md

---

**Last Updated:** December 2, 2025
**API Version:** 1.0.0
