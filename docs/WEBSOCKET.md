# WebSocket Protocol Specification

Complete WebSocket protocol documentation for the Aviator Predictor Pro Live Signal System.

## Overview

The WebSocket API provides real-time, bidirectional communication between clients and the server for instant signal delivery. Built on Socket.io, it offers automatic reconnection, fallback transports, and robust error handling.

---

## Connection

### Endpoint

**Development:**
```
ws://localhost:8080
```

**Production (with SSL):**
```
wss://yourdomain.com
```

### Supported Transports

1. **WebSocket** (Primary) - Low latency, full-duplex communication
2. **Long-polling** (Fallback) - HTTP-based fallback for restricted networks

### Client Libraries

**JavaScript (Browser/Node.js):**
```bash
npm install socket.io-client
```

**Python:**
```bash
pip install python-socketio
```

**Java:**
```bash
implementation 'io.socket:socket.io-client:2.0.1'
```

---

## Connection Lifecycle

### 1. Initial Connection

```javascript
const socket = io('http://localhost:8080', {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});
```

**Connection Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transports` | array | `['polling', 'websocket']` | Transport methods to use |
| `reconnectionAttempts` | number | 5 | Maximum reconnection attempts |
| `reconnectionDelay` | number | 1000 | Initial delay between reconnections (ms) |
| `reconnectionDelayMax` | number | 5000 | Maximum delay between reconnections (ms) |
| `timeout` | number | 20000 | Connection timeout (ms) |
| `autoConnect` | boolean | true | Automatically connect on creation |
| `auth` | object | - | Authentication credentials |

### 2. Connection Established

Server sends `connected` event:

```json
{
  "sessionId": "sess_abc123def456",
  "timestamp": "2025-12-02T10:30:45.123Z",
  "serverVersion": "1.0.0",
  "config": {
    "signalBroadcastInterval": 3000,
    "availableChannels": [
      "signals:all",
      "signals:high-confidence",
      "signals:BET",
      "signals:WAIT",
      "signals:CASH_OUT"
    ]
  }
}
```

### 3. Active Connection

Client receives signals and can send messages to the server.

### 4. Disconnection

**Graceful Disconnect:**
```javascript
socket.disconnect();
```

**Connection Lost (automatic reconnection):**
- Client detects connection failure
- Exponential backoff reconnection begins
- `reconnect_attempt` events fired
- Connection restored → `reconnect` event fired

### 5. Reconnection

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
});
```

---

## Event Protocol

### Client → Server Events

#### connect
Automatically fired on connection.

**Payload:** None

**Example:**
```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});
```

---

#### disconnect
Client initiates disconnection.

**Payload:** None

**Example:**
```javascript
socket.disconnect();
```

---

#### subscribe
Subscribe to a specific signal channel.

**Payload:**
```typescript
{
  channel: string;  // Channel name
}
```

**Available Channels:**
- `signals:all` - All signals (default)
- `signals:high-confidence` - Signals with confidence ≥ 80
- `signals:BET` - Only BET type signals
- `signals:WAIT` - Only WAIT type signals
- `signals:CASH_OUT` - Only CASH_OUT type signals

**Example:**
```javascript
socket.emit('subscribe', {
  channel: 'signals:high-confidence'
});
```

**Server Response:**
```json
{
  "status": "subscribed",
  "channel": "signals:high-confidence",
  "timestamp": "2025-12-02T10:30:45.123Z"
}
```

---

#### unsubscribe
Unsubscribe from a channel.

**Payload:**
```typescript
{
  channel: string;
}
```

**Example:**
```javascript
socket.emit('unsubscribe', {
  channel: 'signals:high-confidence'
});
```

---

#### ping
Measure connection latency.

**Payload:**
```typescript
{
  timestamp: number;  // Client timestamp (milliseconds)
}
```

**Example:**
```javascript
socket.emit('ping', {
  timestamp: Date.now()
});
```

**Server Response:** `pong` event

---

### Server → Client Events

#### connected
Fired when connection is successfully established.

**Payload:**
```typescript
{
  sessionId: string;
  timestamp: string;  // ISO 8601
  serverVersion: string;
  config: {
    signalBroadcastInterval: number;
    availableChannels: string[];
  };
}
```

**Example:**
```javascript
socket.on('connected', (data) => {
  console.log('Session ID:', data.sessionId);
  console.log('Server version:', data.serverVersion);
});
```

---

#### signal
New prediction signal broadcast.

**Payload:**
```typescript
{
  id: string;
  type: 'BET' | 'WAIT' | 'CASH_OUT';
  confidence: number;  // 0-100
  timestamp: string;   // ISO 8601
  metadata: {
    multiplier: number;
    trend: 'upward' | 'downward' | 'neutral';
    riskLevel: 'low' | 'medium' | 'high';
    analysisWindow: number;
    patternMatch?: string;
    volatility?: number;  // 0-1
  };
  recommendations?: {
    action: string;
    suggestedMultiplier?: number;
    riskAssessment?: string;
  };
}
```

**Signal Types:**

1. **BET** - Recommended time to place a bet
   - High confidence in positive outcome
   - Usually confidence ≥ 70%

2. **WAIT** - Suggested to wait for better opportunity
   - Uncertain market conditions
   - Medium confidence (50-70%)

3. **CASH_OUT** - Recommended time to cash out
   - Risk of downturn detected
   - High confidence in trend reversal

**Example:**
```javascript
socket.on('signal', (signal) => {
  console.log(`Signal: ${signal.type}`);
  console.log(`Confidence: ${signal.confidence}%`);
  console.log(`Multiplier: ${signal.metadata.multiplier}x`);

  if (signal.type === 'BET' && signal.confidence >= 85) {
    // High confidence bet signal
    notifyUser(signal);
  }
});
```

---

#### signal:history
Historical signals sent on initial connection.

**Payload:**
```typescript
{
  signals: Signal[];  // Array of Signal objects
  count: number;
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('signal:history', (data) => {
  console.log(`Received ${data.count} historical signals`);
  data.signals.forEach(signal => {
    displayHistoricalSignal(signal);
  });
});
```

---

#### stats:update
Periodic server statistics updates.

**Payload:**
```typescript
{
  timestamp: string;
  activeConnections: number;
  totalPredictions: number;
  averageConfidence: number;
  recentAccuracy: number;
}
```

**Frequency:** Every 10 seconds (configurable)

**Example:**
```javascript
socket.on('stats:update', (stats) => {
  updateDashboard(stats);
});
```

---

#### error
Error notification from server.

**Payload:**
```typescript
{
  code: string;
  message: string;
  timestamp: string;
  severity: 'warning' | 'error' | 'critical';
  details?: object;
}
```

**Error Codes:**

| Code | Description | Action |
|------|-------------|--------|
| `MAX_CONNECTIONS_REACHED` | Server at capacity | Retry later |
| `AUTHENTICATION_FAILED` | Invalid credentials | Re-authenticate |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Reduce request rate |
| `INVALID_CHANNEL` | Channel doesn't exist | Check channel name |
| `SESSION_EXPIRED` | Session timeout | Reconnect |
| `INTERNAL_ERROR` | Server error | Contact support |

**Example:**
```javascript
socket.on('error', (error) => {
  console.error(`Error [${error.code}]: ${error.message}`);

  switch (error.code) {
    case 'MAX_CONNECTIONS_REACHED':
      setTimeout(() => socket.connect(), 5000);
      break;
    case 'AUTHENTICATION_FAILED':
      reauthenticate();
      break;
  }
});
```

---

#### pong
Response to client ping (latency measurement).

**Payload:**
```typescript
{
  timestamp: number;        // Original client timestamp
  serverTimestamp: number;  // Server processing timestamp
  latency: number;          // Round-trip time (ms)
}
```

**Example:**
```javascript
socket.on('pong', (data) => {
  console.log(`Latency: ${data.latency}ms`);
  updateLatencyIndicator(data.latency);
});
```

---

## Connection States

The WebSocket connection can be in the following states:

### 1. CONNECTING
Initial connection attempt in progress.

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### 2. CONNECTED
Successfully connected and ready to send/receive.

```javascript
socket.on('connect', () => {
  console.log('Connected');
});
```

### 3. DISCONNECTED
Connection closed.

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);

  if (reason === 'io server disconnect') {
    // Server initiated disconnect, manual reconnect needed
    socket.connect();
  }
  // Else automatic reconnection will occur
});
```

### 4. RECONNECTING
Connection lost, attempting to reconnect.

```javascript
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt #${attemptNumber}`);
});
```

---

## Channel Subscriptions

### Default Subscription

All clients are automatically subscribed to `signals:all` on connection.

### Subscribing to Channels

```javascript
// Subscribe to high-confidence signals
socket.emit('subscribe', { channel: 'signals:high-confidence' });

// Subscribe to specific signal types
socket.emit('subscribe', { channel: 'signals:BET' });
socket.emit('subscribe', { channel: 'signals:CASH_OUT' });
```

### Multiple Subscriptions

Clients can subscribe to multiple channels simultaneously:

```javascript
const channels = [
  'signals:high-confidence',
  'signals:BET'
];

channels.forEach(channel => {
  socket.emit('subscribe', { channel });
});
```

### Unsubscribing

```javascript
socket.emit('unsubscribe', { channel: 'signals:high-confidence' });
```

---

## Heartbeat Mechanism

The server implements a heartbeat mechanism to detect dead connections.

### Configuration

**Default Settings:**
- Ping interval: 25 seconds
- Ping timeout: 5 seconds

### Client Response

Clients automatically respond to server pings. No manual handling required when using Socket.io client.

### Custom Heartbeat

For custom implementations:

```javascript
setInterval(() => {
  socket.emit('ping', { timestamp: Date.now() });
}, 30000);

socket.on('pong', (data) => {
  if (data.latency > 1000) {
    console.warn('High latency detected:', data.latency);
  }
});
```

---

## Authentication (Optional)

When `ENABLE_AUTHENTICATION=true`:

### 1. Connect with Credentials

```javascript
const socket = io('http://localhost:8080', {
  auth: {
    token: 'your-session-token'
  }
});
```

### 2. Handle Authentication Errors

```javascript
socket.on('error', (error) => {
  if (error.code === 'AUTHENTICATION_FAILED') {
    // Redirect to login or request new token
    requestNewToken().then(token => {
      socket.auth.token = token;
      socket.connect();
    });
  }
});
```

---

## Best Practices

### 1. Reconnection Strategy

Implement exponential backoff:

```javascript
const socket = io('http://localhost:8080', {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5
});
```

### 2. Error Handling

Always handle errors:

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  showUserNotification('Connection failed. Retrying...');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  logErrorToServer(error);
});
```

### 3. Connection Monitoring

Track connection quality:

```javascript
let latencyHistory = [];

setInterval(() => {
  socket.emit('ping', { timestamp: Date.now() });
}, 30000);

socket.on('pong', (data) => {
  latencyHistory.push(data.latency);
  if (latencyHistory.length > 10) latencyHistory.shift();

  const avgLatency = latencyHistory.reduce((a, b) => a + b) / latencyHistory.length;
  updateConnectionQuality(avgLatency);
});
```

### 4. Graceful Shutdown

Clean up on page unload:

```javascript
window.addEventListener('beforeunload', () => {
  socket.disconnect();
});
```

### 5. Resource Cleanup

Remove listeners when no longer needed:

```javascript
const signalHandler = (signal) => {
  console.log(signal);
};

socket.on('signal', signalHandler);

// Later...
socket.off('signal', signalHandler);
```

---

## Code Examples

### Complete Client Implementation

```javascript
const io = require('socket.io-client');

class SignalClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.signalHandlers = [];
    this.isConnected = false;
  }

  connect() {
    this.socket = io(this.url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to signal server');
      this.isConnected = true;
    });

    this.socket.on('connected', (data) => {
      console.log('Session ID:', data.sessionId);
      console.log('Server version:', data.serverVersion);
    });

    this.socket.on('signal', (signal) => {
      this.handleSignal(signal);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
    });
  }

  handleSignal(signal) {
    console.log(`Signal: ${signal.type} (${signal.confidence}%)`);

    // Notify all registered handlers
    this.signalHandlers.forEach(handler => handler(signal));
  }

  onSignal(callback) {
    this.signalHandlers.push(callback);
  }

  subscribe(channel) {
    if (this.isConnected) {
      this.socket.emit('subscribe', { channel });
    }
  }

  unsubscribe(channel) {
    if (this.isConnected) {
      this.socket.emit('unsubscribe', { channel });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const client = new SignalClient('http://localhost:8080');
client.connect();

client.onSignal((signal) => {
  if (signal.type === 'BET' && signal.confidence >= 80) {
    console.log('High confidence BET signal!');
    // Display notification to user
  }
});

client.subscribe('signals:high-confidence');
```

### Python Client

```python
import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('Connected to server')

@sio.event
def connected(data):
    print(f"Session ID: {data['sessionId']}")
    print(f"Server version: {data['serverVersion']}")

@sio.event
def signal(data):
    print(f"Signal: {data['type']} ({data['confidence']}%)")

    if data['type'] == 'BET' and data['confidence'] >= 80:
        print('High confidence BET signal!')

@sio.event
def disconnect():
    print('Disconnected from server')

# Connect
sio.connect('http://localhost:8080')

# Subscribe to channel
sio.emit('subscribe', {'channel': 'signals:high-confidence'})

# Keep connection alive
sio.wait()
```

---

## Troubleshooting

### Connection Fails

**Problem:** Cannot establish connection

**Solutions:**
1. Check server is running: `curl http://localhost:3000/api/health`
2. Verify firewall allows port 8080
3. Check CORS configuration
4. Try long-polling: `transports: ['polling']`

### High Latency

**Problem:** Slow signal delivery

**Solutions:**
1. Use WebSocket transport only: `transports: ['websocket']`
2. Reduce ping interval
3. Check network connection
4. Verify server resources

### Frequent Disconnections

**Problem:** Connection drops repeatedly

**Solutions:**
1. Increase ping timeout
2. Check server logs for errors
3. Verify network stability
4. Adjust reconnection settings

### No Signals Received

**Problem:** Connected but no signals

**Solutions:**
1. Check subscription: Ensure subscribed to correct channel
2. Verify signal broadcast interval in config
3. Lower confidence threshold
4. Check server logs

---

## Performance Considerations

### Bandwidth Usage

**Typical bandwidth per connection:**
- Idle connection: ~1-2 KB/min (heartbeat)
- Active (3s interval): ~10-20 KB/min
- High frequency (1s interval): ~30-60 KB/min

### Connection Limits

**Server capacity:**
- Default: 1000 concurrent connections
- Configurable via `MAX_CONNECTIONS`
- Adjust based on server resources

### Scaling

For high-traffic deployments:
1. Use Redis adapter for horizontal scaling
2. Load balance WebSocket connections
3. Implement connection pooling
4. Monitor server resources

---

## Security

### Transport Security

**Production deployments must use WSS (WebSocket Secure):**
```javascript
const socket = io('wss://yourdomain.com', {
  secure: true,
  rejectUnauthorized: true
});
```

### Authentication

Enable authentication for production:
```bash
ENABLE_AUTHENTICATION=true
```

### Rate Limiting

Default limits:
- 100 messages per minute per connection
- Automatically enforced by server

---

## Support

For WebSocket protocol issues:
- Review this documentation
- Check browser console for errors
- Inspect Network tab in DevTools (WS frames)
- GitHub Issues: https://github.com/dnbyukusenge/Aviator-Predictor-Pro/issues

---

**Protocol Version:** 1.0.0
**Last Updated:** December 2, 2025
