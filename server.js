const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const config = require('./config.json');

const app = express();
const PORT = process.env.HTTP_PORT || config.server.httpPort || 3000;

const predictionStats = {
  totalSignals: 0,
  successfulPredictions: 0,
  accuracyRate: 0,
  uptime: Date.now(),
  lastSignalTime: null
};

const signalHistory = [];
const MAX_HISTORY_SIZE = config.signals.historyBufferSize || 100;

app.use(cors({
  origin: config.security.cors.origins || ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: config.security.cors.credentials || true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  const uptime = Math.floor((Date.now() - predictionStats.uptime) / 1000);

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    service: 'aviator-predictor-pro',
    version: '1.0.0',
    websocket: {
      port: config.server.websocketPort,
      status: 'available'
    }
  });
});

app.get('/api/stats', (req, res) => {
  const uptime = Math.floor((Date.now() - predictionStats.uptime) / 1000);

  const stats = {
    totalSignals: predictionStats.totalSignals,
    successfulPredictions: predictionStats.successfulPredictions,
    accuracyRate: predictionStats.totalSignals > 0
      ? parseFloat(((predictionStats.successfulPredictions / predictionStats.totalSignals) * 100).toFixed(2))
      : 0,
    uptime: uptime,
    lastSignalTime: predictionStats.lastSignalTime,
    currentTime: new Date().toISOString(),
    config: {
      confidenceThreshold: config.prediction.confidenceThreshold,
      signalBroadcastInterval: config.signals.broadcastInterval,
      minConfidenceForBroadcast: config.signals.minConfidenceForBroadcast
    }
  };

  res.json(stats);
});

app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const validLimit = Math.min(Math.max(limit, 1), MAX_HISTORY_SIZE);
  const validOffset = Math.max(offset, 0);

  const paginatedHistory = signalHistory.slice(validOffset, validOffset + validLimit);

  res.json({
    history: paginatedHistory,
    total: signalHistory.length,
    limit: validLimit,
    offset: validOffset,
    hasMore: (validOffset + validLimit) < signalHistory.length
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

function updateStats(signal) {
  predictionStats.totalSignals++;
  predictionStats.lastSignalTime = signal.timestamp;

  if (signal.success !== undefined && signal.success === true) {
    predictionStats.successfulPredictions++;
  }

  predictionStats.accuracyRate = predictionStats.totalSignals > 0
    ? parseFloat(((predictionStats.successfulPredictions / predictionStats.totalSignals) * 100).toFixed(2))
    : 0;
}

function addToHistory(signal) {
  signalHistory.unshift(signal);

  if (signalHistory.length > MAX_HISTORY_SIZE) {
    signalHistory.pop();
  }
}

app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`Environment: ${config.server.environment}`);
  console.log(`WebSocket will be available on port ${config.server.websocketPort}`);
  console.log(`API Endpoints:`);
  console.log(`  - GET /api/health - Server health check`);
  console.log(`  - GET /api/stats - Prediction statistics`);
  console.log(`  - GET /api/history - Signal history`);
});

module.exports = { app, updateStats, addToHistory };
