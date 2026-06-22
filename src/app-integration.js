const http = require('http');
const WebSocketServer = require('../websocket-server');
const SignalBroadcaster = require('./signal-broadcaster');
const config = require('../config.json');

class AppIntegration {
  constructor(expressApp, options = {}) {
    this.expressApp = expressApp;
    this.httpServer = null;
    this.wsServer = null;
    this.broadcaster = null;

    this.config = {
      httpPort: options.httpPort || config.server.httpPort || 3000,
      websocketPort: options.websocketPort || config.server.websocketPort || 8080,
      ...options
    };

    this.mockDataInterval = null;
    this.isMockDataEnabled = options.enableMockData !== false;
  }

  initialize() {
    this.httpServer = http.createServer(this.expressApp);

    this.wsServer = new WebSocketServer(this.httpServer, {
      port: this.config.websocketPort
    });

    this.broadcaster = new SignalBroadcaster(this.wsServer, {
      broadcastInterval: config.signals.broadcastInterval,
      minConfidenceForBroadcast: config.signals.minConfidenceForBroadcast
    });

    console.log('Application components initialized successfully');
  }

  start() {
    if (!this.httpServer) {
      throw new Error('Application not initialized. Call initialize() first.');
    }

    this.httpServer.listen(this.config.httpPort, () => {
      console.log(`HTTP Server running on port ${this.config.httpPort}`);
      console.log(`WebSocket Server running on port ${this.config.websocketPort}`);
    });

    this.broadcaster.start();

    if (this.isMockDataEnabled) {
      this.startMockDataFeed();
    }

    console.log('Application started successfully');
  }

  startMockDataFeed() {
    this.mockDataInterval = setInterval(() => {
      const mockMultiplier = this.generateMockMultiplier();
      this.broadcaster.addGameResult(mockMultiplier);
    }, 2000);

    console.log('Mock data feed started (for development/testing)');
  }

  generateMockMultiplier() {
    const random = Math.random();

    if (random < 0.6) {
      return parseFloat((1.0 + Math.random() * 1.5).toFixed(2));
    } else if (random < 0.85) {
      return parseFloat((2.5 + Math.random() * 2.5).toFixed(2));
    } else if (random < 0.95) {
      return parseFloat((5.0 + Math.random() * 5.0).toFixed(2));
    } else {
      return parseFloat((10.0 + Math.random() * 20.0).toFixed(2));
    }
  }

  stopMockDataFeed() {
    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
      console.log('Mock data feed stopped');
    }
  }

  stop() {
    if (this.broadcaster) {
      this.broadcaster.stop();
    }

    this.stopMockDataFeed();

    if (this.wsServer) {
      this.wsServer.close();
    }

    if (this.httpServer) {
      this.httpServer.close(() => {
        console.log('Application stopped');
      });
    }
  }

  getWebSocketServer() {
    return this.wsServer;
  }

  getBroadcaster() {
    return this.broadcaster;
  }

  getHttpServer() {
    return this.httpServer;
  }

  getStatistics() {
    return {
      websocket: this.wsServer ? this.wsServer.getStatistics() : null,
      broadcaster: this.broadcaster ? this.broadcaster.getStatistics() : null
    };
  }
}

module.exports = AppIntegration;
