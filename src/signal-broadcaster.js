const PredictionEngine = require('./prediction-engine');
const config = require('../config.json');

class SignalBroadcaster {
  constructor(websocketServer, options = {}) {
    this.wsServer = websocketServer;
    this.predictionEngine = new PredictionEngine(options.predictionOptions || {});

    this.config = {
      broadcastInterval: options.broadcastInterval || config.signals.broadcastInterval,
      historyBufferSize: options.historyBufferSize || config.signals.historyBufferSize,
      minConfidenceForBroadcast: options.minConfidenceForBroadcast || config.signals.minConfidenceForBroadcast,
      rateLimitPerClient: {
        maxRequests: config.signals.rateLimitPerClient?.maxRequests || 60,
        windowMs: config.signals.rateLimitPerClient?.windowMs || 60000
      }
    };

    this.signalBuffer = [];
    this.broadcastInterval = null;
    this.isRunning = false;

    this.clientRateLimits = new Map();

    this.statistics = {
      totalSignalsBroadcast: 0,
      signalsByType: {
        BET: 0,
        WAIT: 0,
        CASH_OUT: 0
      },
      totalClientsReached: 0,
      lastBroadcastTime: null,
      averageBroadcastLatency: 0
    };

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.wsServer || !this.wsServer.io) {
      console.error('WebSocket server not properly initialized');
      return;
    }

    this.wsServer.io.on('connection', (socket) => {
      this.handleNewConnection(socket);

      socket.on('request_signal', () => {
        this.handleSignalRequest(socket);
      });

      socket.on('request_history', (data) => {
        this.handleHistoryRequest(socket, data);
      });

      socket.on('update_preferences', (preferences) => {
        this.handlePreferencesUpdate(socket, preferences);
      });
    });
  }

  handleNewConnection(socket) {
    const recentHistory = this.getRecentSignals(10);

    socket.emit('signal_history', {
      signals: recentHistory,
      timestamp: Date.now(),
      bufferSize: this.signalBuffer.length
    });

    console.log(`Sent ${recentHistory.length} historical signals to new connection: ${socket.id}`);
  }

  handleSignalRequest(socket) {
    if (!this.checkRateLimit(socket.id)) {
      socket.emit('rate_limit_exceeded', {
        message: 'Too many signal requests',
        retryAfter: this.getRateLimitRetryTime(socket.id),
        timestamp: Date.now()
      });
      return;
    }

    const signal = this.predictionEngine.generateSignal();

    this.sendSignalToClient(socket, signal, 'requested');

    this.incrementRateLimit(socket.id);
  }

  handleHistoryRequest(socket, data) {
    const limit = Math.min(data?.limit || 10, this.config.historyBufferSize);
    const offset = data?.offset || 0;

    const history = this.signalBuffer.slice(offset, offset + limit);

    socket.emit('signal_history', {
      signals: history,
      total: this.signalBuffer.length,
      limit,
      offset,
      timestamp: Date.now()
    });
  }

  handlePreferencesUpdate(socket, preferences) {
    const connection = this.wsServer.connections.get(socket.id);
    if (!connection) return;

    const state = this.wsServer.getConnectionState(socket.id) || {};
    state.preferences = {
      ...state.preferences,
      minConfidence: preferences.minConfidence || this.config.minConfidenceForBroadcast,
      signalTypes: preferences.signalTypes || ['BET', 'WAIT', 'CASH_OUT'],
      notifyHighConfidence: preferences.notifyHighConfidence !== undefined ? preferences.notifyHighConfidence : true
    };

    this.wsServer.saveConnectionState(socket.id, state);

    socket.emit('preferences_updated', {
      preferences: state.preferences,
      timestamp: Date.now()
    });

    console.log(`Updated preferences for client ${socket.id}`);
  }

  start() {
    if (this.isRunning) {
      console.log('Signal broadcaster is already running');
      return;
    }

    this.isRunning = true;
    this.broadcastInterval = setInterval(() => {
      this.broadcastSignal();
    }, this.config.broadcastInterval);

    console.log(`Signal broadcaster started (interval: ${this.config.broadcastInterval}ms)`);
  }

  stop() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    this.isRunning = false;
    console.log('Signal broadcaster stopped');
  }

  broadcastSignal() {
    const startTime = Date.now();

    const signal = this.predictionEngine.generateSignal();

    if (signal.confidence < this.config.minConfidenceForBroadcast) {
      console.log(`Signal confidence too low for broadcast: ${signal.confidence}%`);
      return;
    }

    this.addSignalToBuffer(signal);

    const payload = this.createSignalPayload(signal);

    const connectedClients = this.wsServer.getConnectedClients();
    let clientsReached = 0;

    connectedClients.forEach(client => {
      if (this.shouldSendSignalToClient(client.socketId, signal)) {
        const sent = this.wsServer.sendToSocket(client.socketId, 'signal', payload);
        if (sent) {
          clientsReached++;
        }
      }
    });

    this.updateStatistics(signal, clientsReached, Date.now() - startTime);

    console.log(`Broadcasted ${signal.type} signal (confidence: ${signal.confidence}%) to ${clientsReached} clients`);
  }

  broadcastToChannel(channel, signal) {
    const payload = this.createSignalPayload(signal);
    this.wsServer.broadcastToChannel(channel, 'signal', payload);
    console.log(`Broadcasted signal to channel: ${channel}`);
  }

  sendSignalToClient(socket, signal, source = 'broadcast') {
    const payload = this.createSignalPayload(signal, source);
    socket.emit('signal', payload);
  }

  createSignalPayload(signal, source = 'broadcast') {
    return {
      id: this.generateSignalId(),
      type: signal.type,
      confidence: signal.confidence,
      reason: signal.reason,
      timestamp: signal.timestamp,
      source,
      data: {
        prediction: {
          trend: signal.data?.patterns?.trend || 'NEUTRAL',
          strength: signal.data?.patterns?.strength || 0,
          volatility: signal.data?.patterns?.volatility || 0
        },
        risk: {
          level: signal.data?.risk?.level || 'MEDIUM',
          score: signal.data?.risk?.score || 50,
          factors: signal.data?.risk?.factors || []
        },
        analysis: {
          recentAverage: signal.data?.recentAverage || 0,
          ema: signal.data?.ema || 0,
          dataPoints: this.predictionEngine.historicalData.length
        }
      },
      metadata: {
        serverTime: Date.now(),
        version: '1.0.0'
      }
    };
  }

  generateSignalId() {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addSignalToBuffer(signal) {
    const enrichedSignal = {
      ...signal,
      id: this.generateSignalId(),
      serverTimestamp: Date.now()
    };

    this.signalBuffer.push(enrichedSignal);

    if (this.signalBuffer.length > this.config.historyBufferSize) {
      this.signalBuffer.shift();
    }
  }

  getRecentSignals(limit = 10) {
    return this.signalBuffer.slice(-limit);
  }

  shouldSendSignalToClient(socketId, signal) {
    const state = this.wsServer.getConnectionState(socketId);
    if (!state || !state.preferences) {
      return true;
    }

    const prefs = state.preferences;

    if (signal.confidence < prefs.minConfidence) {
      return false;
    }

    if (prefs.signalTypes && !prefs.signalTypes.includes(signal.type)) {
      return false;
    }

    return true;
  }

  checkRateLimit(socketId) {
    const now = Date.now();
    const limit = this.clientRateLimits.get(socketId);

    if (!limit) {
      return true;
    }

    if (now - limit.windowStart > this.config.rateLimitPerClient.windowMs) {
      this.clientRateLimits.delete(socketId);
      return true;
    }

    return limit.requests < this.config.rateLimitPerClient.maxRequests;
  }

  incrementRateLimit(socketId) {
    const now = Date.now();
    let limit = this.clientRateLimits.get(socketId);

    if (!limit || now - limit.windowStart > this.config.rateLimitPerClient.windowMs) {
      limit = {
        windowStart: now,
        requests: 0
      };
    }

    limit.requests++;
    this.clientRateLimits.set(socketId, limit);
  }

  getRateLimitRetryTime(socketId) {
    const limit = this.clientRateLimits.get(socketId);
    if (!limit) return 0;

    const elapsed = Date.now() - limit.windowStart;
    return Math.max(0, this.config.rateLimitPerClient.windowMs - elapsed);
  }

  cleanupRateLimits() {
    const now = Date.now();
    for (const [socketId, limit] of this.clientRateLimits.entries()) {
      if (now - limit.windowStart > this.config.rateLimitPerClient.windowMs) {
        this.clientRateLimits.delete(socketId);
      }
    }
  }

  addGameResult(multiplier, timestamp) {
    this.predictionEngine.addGameResult(multiplier, timestamp);
  }

  updateStatistics(signal, clientsReached, latency) {
    this.statistics.totalSignalsBroadcast++;
    this.statistics.signalsByType[signal.type]++;
    this.statistics.totalClientsReached += clientsReached;
    this.statistics.lastBroadcastTime = Date.now();

    const totalBroadcasts = this.statistics.totalSignalsBroadcast;
    const currentAverage = this.statistics.averageBroadcastLatency;
    this.statistics.averageBroadcastLatency =
      ((currentAverage * (totalBroadcasts - 1)) + latency) / totalBroadcasts;
  }

  getStatistics() {
    return {
      broadcaster: {
        ...this.statistics,
        isRunning: this.isRunning,
        broadcastInterval: this.config.broadcastInterval,
        bufferSize: this.signalBuffer.length,
        averageBroadcastLatency: Math.round(this.statistics.averageBroadcastLatency)
      },
      predictionEngine: this.predictionEngine.getStatistics()
    };
  }

  getSignalHistory(limit = 10) {
    return this.getRecentSignals(limit);
  }

  setSensitivity(sensitivity) {
    this.predictionEngine.setSensitivity(sensitivity);
  }

  setMinConfidence(confidence) {
    this.config.minConfidenceForBroadcast = Math.max(0, Math.min(100, confidence));
  }

  setBroadcastInterval(interval) {
    if (interval < 1000 || interval > 60000) {
      throw new Error('Broadcast interval must be between 1000ms and 60000ms');
    }

    this.config.broadcastInterval = interval;

    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  reset() {
    this.signalBuffer = [];
    this.clientRateLimits.clear();
    this.statistics = {
      totalSignalsBroadcast: 0,
      signalsByType: {
        BET: 0,
        WAIT: 0,
        CASH_OUT: 0
      },
      totalClientsReached: 0,
      lastBroadcastTime: null,
      averageBroadcastLatency: 0
    };
    this.predictionEngine.reset();
  }
}

module.exports = SignalBroadcaster;
