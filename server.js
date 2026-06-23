const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const config = require('./config.json');
const AppIntegration = require('./src/app-integration');

const app = express();
const PORT = process.env.HTTP_PORT || config.server.httpPort || 3000;

let appIntegration = null;

app.use(cors({
  origin: config.security.cors.origins || ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: config.security.cors.credentials || true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  const uptime = Math.floor(process.uptime());

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    service: 'aviator-predictor-pro',
    version: '1.0.0',
    websocket: {
      port: config.server.websocketPort,
      status: appIntegration && appIntegration.getWebSocketServer() ? 'running' : 'initializing'
    }
  });
});

app.get('/api/stats', (req, res) => {
  const uptime = Math.floor(process.uptime());

  let stats = {
    uptime: uptime,
    currentTime: new Date().toISOString(),
    config: {
      confidenceThreshold: config.prediction.confidenceThreshold,
      signalBroadcastInterval: config.signals.broadcastInterval,
      minConfidenceForBroadcast: config.signals.minConfidenceForBroadcast
    }
  };

  if (appIntegration && appIntegration.getBroadcaster()) {
    const broadcasterStats = appIntegration.getBroadcaster().getStatistics();
    stats = {
      ...stats,
      ...broadcasterStats.broadcaster,
      predictionEngine: broadcasterStats.predictionEngine
    };
  }

  res.json(stats);
});

app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const MAX_HISTORY_SIZE = config.signals.historyBufferSize || 100;
  const validLimit = Math.min(Math.max(limit, 1), MAX_HISTORY_SIZE);
  const validOffset = Math.max(offset, 0);

  let history = [];
  let total = 0;

  if (appIntegration && appIntegration.getBroadcaster()) {
    const allHistory = appIntegration.getBroadcaster().getSignalHistory(MAX_HISTORY_SIZE);
    history = allHistory.slice(validOffset, validOffset + validLimit);
    total = allHistory.length;
  }

  res.json({
    history: history,
    total: total,
    limit: validLimit,
    offset: validOffset,
    hasMore: (validOffset + validLimit) < total
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message: message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Resource not found',
      status: 404,
      path: req.path,
      timestamp: new Date().toISOString()
    }
  });
});

if (require.main === module) {
  appIntegration = new AppIntegration(app, {
    httpPort: PORT,
    enableMockData: config.server.environment === 'development'
  });

  appIntegration.initialize();
  appIntegration.start();

  console.log(`Environment: ${config.server.environment}`);
  console.log(`API Endpoints:`);
  console.log(`  - GET /api/health - Server health check`);
  console.log(`  - GET /api/stats - Prediction statistics`);
  console.log(`  - GET /api/history - Signal history`);

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (appIntegration) {
      appIntegration.stop();
    }
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    if (appIntegration) {
      appIntegration.stop();
    }
    process.exit(0);
  });
}

module.exports = { app, AppIntegration };
