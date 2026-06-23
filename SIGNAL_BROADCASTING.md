# Signal Broadcasting System

## Overview

The Signal Broadcasting System integrates the Prediction Engine with the WebSocket Server to deliver real-time prediction signals to connected clients. This system enables live, bidirectional communication for optimal betting timing recommendations.

## Architecture

### Components

1. **SignalBroadcaster** (`src/signal-broadcaster.js`)
   - Main broadcasting controller
   - Integrates prediction engine with WebSocket server
   - Manages signal distribution and rate limiting

2. **PredictionEngine** (`src/prediction-engine.js`)
   - Generates prediction signals based on historical data
   - Calculates confidence scores and risk assessments

3. **WebSocketServer** (`websocket-server.js`)
   - Handles client connections and subscriptions
   - Manages connection state and authentication

4. **AppIntegration** (`src/app-integration.js`)
   - Coordinates all system components
   - Provides unified initialization and lifecycle management

## Features

### ✅ Broadcast Signals to All Connected Clients
- Automatic broadcasting at configurable intervals (default: 3 seconds)
- Signals only broadcast when confidence exceeds minimum threshold
- Real-time delivery to all active WebSocket connections

### ✅ Targeted Signals for Individual Subscriptions
- Per-client preference management
- Channel-based subscription system
- Filtered signal delivery based on user preferences

### ✅ Signal Payload Structure
Each signal includes:
- **type**: BET, WAIT, or CASH_OUT
- **confidence**: 0-100% confidence score
- **reason**: Human-readable explanation
- **timestamp**: Signal generation time
- **prediction data**: Trend, strength, volatility metrics
- **risk assessment**: Risk level, score, and contributing factors
- **analysis data**: Moving averages, EMA, data points count

### ✅ Signal History Buffer
- Maintains buffer of recent signals (default: 100 signals)
- New connections receive recent history automatically
- On-demand history requests with pagination support

### ✅ Rate Limiting
- Per-client request limits (default: 60 requests/minute)
- Automatic window-based tracking
- Rate limit exceeded notifications with retry timing

### ✅ Integration with Prediction Engine
- Seamless integration via SignalBroadcaster class
- Mock data feed for development/testing
- Real-time game result ingestion

## Configuration

Signal broadcasting is configured in `config.json`:

```json
{
  "signals": {
    "broadcastInterval": 3000,
    "historyBufferSize": 100,
    "minConfidenceForBroadcast": 50,
    "signalTypes": ["BET", "WAIT", "CASH_OUT"],
    "rateLimitPerClient": {
      "maxRequests": 60,
      "windowMs": 60000
    }
  }
}
```

## Signal Payload Example

```json
{
  "id": "sig_1719234567890_abc123def",
  "type": "BET",
  "confidence": 85,
  "reason": "Strong opportunity: 4 consecutive low outcomes",
  "timestamp": 1719234567890,
  "source": "broadcast",
  "data": {
    "prediction": {
      "trend": "DOWNWARD",
      "strength": 35.5,
      "volatility": 22.3
    },
    "risk": {
      "level": "LOW",
      "score": 25,
      "factors": [
        "Multiple consecutive low multipliers",
        "Low average recent outcomes"
      ]
    },
    "analysis": {
      "recentAverage": 1.67,
      "ema": 1.72,
      "dataPoints": 45
    }
  },
  "metadata": {
    "serverTime": 1719234567890,
    "version": "1.0.0"
  }
}
```

## WebSocket Events

### Client → Server Events

#### `request_signal`
Request an immediate signal (subject to rate limiting).

```javascript
socket.emit('request_signal');
```

#### `request_history`
Request historical signals with pagination.

```javascript
socket.emit('request_history', {
  limit: 10,
  offset: 0
});
```

#### `update_preferences`
Update signal delivery preferences.

```javascript
socket.emit('update_preferences', {
  minConfidence: 70,
  signalTypes: ['BET', 'CASH_OUT'],
  notifyHighConfidence: true
});
```

#### `subscribe`
Subscribe to specific channels.

```javascript
socket.emit('subscribe', ['high-confidence', 'bet-signals']);
```

#### `unsubscribe`
Unsubscribe from channels.

```javascript
socket.emit('unsubscribe', ['high-confidence']);
```

### Server → Client Events

#### `signal`
New prediction signal broadcast.

```javascript
socket.on('signal', (payload) => {
  console.log(`Signal: ${payload.type}, Confidence: ${payload.confidence}%`);
});
```

#### `signal_history`
Historical signals response.

```javascript
socket.on('signal_history', (data) => {
  console.log(`Received ${data.signals.length} signals`);
});
```

#### `preferences_updated`
Confirmation of preference update.

```javascript
socket.on('preferences_updated', (data) => {
  console.log('Preferences:', data.preferences);
});
```

#### `rate_limit_exceeded`
Rate limit notification.

```javascript
socket.on('rate_limit_exceeded', (data) => {
  console.log(`Retry after ${data.retryAfter}ms`);
});
```

## Usage Example

### Starting the Server

```javascript
const { app, AppIntegration } = require('./server');

const appIntegration = new AppIntegration(app, {
  httpPort: 3000,
  websocketPort: 8080,
  enableMockData: true
});

appIntegration.initialize();
appIntegration.start();
```

### Client Connection

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:8080');

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('signal', (signal) => {
  console.log(`New signal: ${signal.type} (${signal.confidence}%)`);
});
```

### Adding Game Results

```javascript
const broadcaster = appIntegration.getBroadcaster();

// Add real game results as they occur
broadcaster.addGameResult(2.35, Date.now());
```

## API Endpoints

### GET `/api/stats`
Returns broadcasting and prediction engine statistics.

**Response:**
```json
{
  "totalSignalsBroadcast": 150,
  "signalsByType": {
    "BET": 45,
    "WAIT": 80,
    "CASH_OUT": 25
  },
  "isRunning": true,
  "bufferSize": 100,
  "predictionEngine": {
    "accuracy": 72.5,
    "totalPredictions": 150,
    "dataPoints": 50
  }
}
```

### GET `/api/history`
Returns recent signal history.

**Query Parameters:**
- `limit`: Number of signals to return (default: 10, max: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "history": [...],
  "total": 100,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

## Rate Limiting

Rate limiting prevents spam and ensures fair resource distribution:

- **Window**: 60 seconds (configurable)
- **Max Requests**: 60 per window (configurable)
- **Scope**: Per client (by socket ID)
- **Response**: Rate limit exceeded event with retry timing

## Signal Quality Filters

Signals are only broadcast when:
1. Confidence score meets minimum threshold (default: 50%)
2. Sufficient historical data is available (default: 10 data points)
3. Prediction engine successfully generates signal

## Performance Considerations

- **Broadcast Latency**: Average ~5-10ms per broadcast cycle
- **Memory Usage**: Signal buffer limited to prevent memory leaks
- **Connection Limits**: Default max 1000 concurrent connections
- **Rate Limiting**: Automatic cleanup of expired rate limit windows

## Testing

Run the example client to test signal reception:

```bash
node example-client.js
```

Run the test suite:

```bash
node test-signal-broadcaster.js
```

## Troubleshooting

### No Signals Received
- Check if broadcaster is running: `broadcaster.isRunning`
- Verify minimum confidence threshold isn't too high
- Ensure sufficient historical data exists
- Check client preferences aren't filtering all signals

### Rate Limiting Issues
- Reduce request frequency
- Check `rateLimitPerClient` configuration
- Wait for rate limit window to expire

### Connection Issues
- Verify WebSocket server is running on correct port
- Check CORS configuration in `config.json`
- Ensure firewall allows WebSocket connections
- Verify client transport compatibility

## Best Practices

1. **Production Deployment**
   - Disable mock data feed (`enableMockData: false`)
   - Integrate real game result data source
   - Configure appropriate rate limits
   - Enable authentication if needed

2. **Performance Optimization**
   - Adjust broadcast interval based on needs
   - Set reasonable history buffer size
   - Implement connection pooling for high traffic

3. **Monitoring**
   - Track broadcaster statistics regularly
   - Monitor connection counts and latency
   - Log signal broadcast failures

4. **Client Implementation**
   - Handle reconnection logic
   - Implement exponential backoff for requests
   - Cache signal history locally
   - Display connection status to users
