const { Server } = require('socket.io');
const crypto = require('crypto');
require('dotenv').config();

const config = require('./config.json');

class WebSocketServer {
  constructor(httpServer, options = {}) {
    this.config = {
      port: options.port || config.server.websocketPort || 8080,
      pingInterval: options.pingInterval || config.websocket.pingInterval || 25000,
      pingTimeout: options.pingTimeout || config.websocket.pingTimeout || 5000,
      maxConnections: options.maxConnections || config.websocket.maxConnections || 1000,
      reconnectionAttempts: options.reconnectionAttempts || config.websocket.reconnectionAttempts || 5,
      reconnectionDelay: options.reconnectionDelay || config.websocket.reconnectionDelay || 1000,
      enableAuth: options.enableAuth !== undefined ? options.enableAuth : config.security.enableAuthentication,
      sessionTimeout: options.sessionTimeout || config.security.sessionTimeout || 3600000,
      maxSessionsPerIP: options.maxSessionsPerIP || config.security.maxSessionsPerIP || 5,
      corsOrigins: options.corsOrigins || config.security.cors.origins || ['http://localhost:3000']
    };

    this.io = new Server(httpServer, {
      cors: {
        origin: this.config.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST']
      },
      pingInterval: this.config.pingInterval,
      pingTimeout: this.config.pingTimeout,
      maxHttpBufferSize: 1e6,
      transports: ['websocket', 'polling']
    });

    this.connections = new Map();
    this.sessions = new Map();
    this.ipConnections = new Map();
    this.connectionStates = new Map();

    this.statistics = {
      totalConnections: 0,
      activeConnections: 0,
      totalDisconnections: 0,
      rejectedConnections: 0,
      averageConnectionDuration: 0,
      peakConnections: 0
    };

    this.setupEventHandlers();
    this.startHeartbeatMonitor();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    this.io.engine.on('connection_error', (err) => {
      console.error('WebSocket connection error:', err);
    });
  }

  async handleConnection(socket) {
    const clientIP = this.getClientIP(socket);
    const sessionToken = socket.handshake.auth.token || socket.handshake.query.token;

    if (!this.canAcceptConnection(clientIP)) {
      this.statistics.rejectedConnections++;
      socket.emit('error', {
        code: 'MAX_CONNECTIONS_PER_IP',
        message: `Maximum connections per IP (${this.config.maxSessionsPerIP}) exceeded`
      });
      socket.disconnect(true);
      return;
    }

    if (this.connections.size >= this.config.maxConnections) {
      this.statistics.rejectedConnections++;
      socket.emit('error', {
        code: 'MAX_CONNECTIONS',
        message: `Server has reached maximum connections (${this.config.maxConnections})`
      });
      socket.disconnect(true);
      return;
    }

    let session;
    if (this.config.enableAuth) {
      session = await this.authenticateConnection(socket, sessionToken);
      if (!session) {
        this.statistics.rejectedConnections++;
        socket.emit('error', {
          code: 'AUTH_FAILED',
          message: 'Authentication failed. Invalid or missing token.'
        });
        socket.disconnect(true);
        return;
      }
    } else {
      session = this.createSession(socket.id, clientIP);
    }

    this.registerConnection(socket, session, clientIP);

    socket.emit('connected', {
      sessionId: session.id,
      timestamp: Date.now(),
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      pingInterval: this.config.pingInterval
    });

    this.setupSocketHandlers(socket, session);

    this.statistics.totalConnections++;
    this.statistics.activeConnections = this.connections.size;
    if (this.statistics.activeConnections > this.statistics.peakConnections) {
      this.statistics.peakConnections = this.statistics.activeConnections;
    }

    console.log(`Client connected: ${socket.id} (IP: ${clientIP}, Total: ${this.connections.size})`);
  }

  setupSocketHandlers(socket, session) {
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, session, reason);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    socket.on('ping', () => {
      this.handlePing(socket);
    });

    socket.on('pong', () => {
      this.handlePong(socket);
    });

    socket.on('reconnect_attempt', () => {
      console.log(`Client ${socket.id} attempting to reconnect`);
    });

    socket.on('restore_state', (data) => {
      this.handleStateRestoration(socket, data);
    });

    socket.on('subscribe', (channels) => {
      this.handleSubscription(socket, channels);
    });

    socket.on('unsubscribe', (channels) => {
      this.handleUnsubscription(socket, channels);
    });
  }

  canAcceptConnection(clientIP) {
    const ipConnectionCount = this.ipConnections.get(clientIP) || 0;
    return ipConnectionCount < this.config.maxSessionsPerIP;
  }

  async authenticateConnection(socket, token) {
    if (!token) {
      return null;
    }

    const existingSession = this.sessions.get(token);
    if (existingSession && !this.isSessionExpired(existingSession)) {
      existingSession.lastActivity = Date.now();
      existingSession.socketId = socket.id;
      return existingSession;
    }

    const isValid = await this.validateToken(token);
    if (!isValid) {
      return null;
    }

    return this.createSession(socket.id, this.getClientIP(socket), token);
  }

  async validateToken(token) {
    if (token.length < 32) {
      return false;
    }

    return true;
  }

  createSession(socketId, clientIP, token = null) {
    const sessionId = token || this.generateSessionToken();
    const session = {
      id: sessionId,
      socketId: socketId,
      clientIP: clientIP,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      subscriptions: new Set(),
      metadata: {}
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  isSessionExpired(session) {
    return (Date.now() - session.lastActivity) > this.config.sessionTimeout;
  }

  registerConnection(socket, session, clientIP) {
    this.connections.set(socket.id, {
      socket: socket,
      session: session,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      isAlive: true,
      clientIP: clientIP,
      subscriptions: new Set()
    });

    const ipCount = this.ipConnections.get(clientIP) || 0;
    this.ipConnections.set(clientIP, ipCount + 1);

    this.connectionStates.set(socket.id, {
      signalHistory: [],
      lastSignalIndex: 0,
      preferences: {}
    });
  }

  handleDisconnection(socket, session, reason) {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    const duration = Date.now() - connection.connectedAt;
    this.updateAverageConnectionDuration(duration);

    const clientIP = connection.clientIP;
    const ipCount = this.ipConnections.get(clientIP) || 0;
    if (ipCount > 1) {
      this.ipConnections.set(clientIP, ipCount - 1);
    } else {
      this.ipConnections.delete(clientIP);
    }

    this.connections.delete(socket.id);

    this.statistics.totalDisconnections++;
    this.statistics.activeConnections = this.connections.size;

    console.log(`Client disconnected: ${socket.id} (Reason: ${reason}, Duration: ${Math.floor(duration / 1000)}s, Total: ${this.connections.size})`);
  }

  handlePing(socket) {
    const connection = this.connections.get(socket.id);
    if (connection) {
      connection.lastHeartbeat = Date.now();
      connection.isAlive = true;
      socket.emit('pong', { timestamp: Date.now() });
    }
  }

  handlePong(socket) {
    const connection = this.connections.get(socket.id);
    if (connection) {
      connection.lastHeartbeat = Date.now();
      connection.isAlive = true;
    }
  }

  handleStateRestoration(socket, data) {
    const state = this.connectionStates.get(data.previousSocketId);
    if (state) {
      this.connectionStates.set(socket.id, state);
      this.connectionStates.delete(data.previousSocketId);

      socket.emit('state_restored', {
        signalHistory: state.signalHistory,
        lastSignalIndex: state.lastSignalIndex,
        timestamp: Date.now()
      });

      console.log(`State restored for client: ${socket.id} (previous: ${data.previousSocketId})`);
    } else {
      socket.emit('state_restoration_failed', {
        reason: 'State not found or expired',
        timestamp: Date.now()
      });
    }
  }

  handleSubscription(socket, channels) {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        connection.subscriptions.add(channel);
        socket.join(channel);
      });
    } else if (typeof channels === 'string') {
      connection.subscriptions.add(channels);
      socket.join(channels);
    }

    socket.emit('subscribed', {
      channels: Array.from(connection.subscriptions),
      timestamp: Date.now()
    });

    console.log(`Client ${socket.id} subscribed to: ${channels}`);
  }

  handleUnsubscription(socket, channels) {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        connection.subscriptions.delete(channel);
        socket.leave(channel);
      });
    } else if (typeof channels === 'string') {
      connection.subscriptions.delete(channels);
      socket.leave(channels);
    }

    socket.emit('unsubscribed', {
      channels: Array.from(connection.subscriptions),
      timestamp: Date.now()
    });

    console.log(`Client ${socket.id} unsubscribed from: ${channels}`);
  }

  startHeartbeatMonitor() {
    setInterval(() => {
      this.checkHeartbeats();
    }, this.config.pingInterval);

    console.log(`Heartbeat monitor started (interval: ${this.config.pingInterval}ms)`);
  }

  checkHeartbeats() {
    const now = Date.now();
    const timeout = this.config.pingInterval + this.config.pingTimeout;

    for (const [socketId, connection] of this.connections.entries()) {
      const timeSinceLastHeartbeat = now - connection.lastHeartbeat;

      if (timeSinceLastHeartbeat > timeout) {
        console.log(`Heartbeat timeout for ${socketId}, disconnecting...`);
        connection.socket.emit('heartbeat_timeout', {
          lastHeartbeat: connection.lastHeartbeat,
          timeout: timeout,
          timestamp: now
        });
        connection.socket.disconnect(true);
      } else if (timeSinceLastHeartbeat > this.config.pingInterval / 2) {
        connection.socket.emit('ping', { timestamp: now });
      }
    }
  }

  broadcast(event, data) {
    this.io.emit(event, data);
  }

  broadcastToChannel(channel, event, data) {
    this.io.to(channel).emit(event, data);
  }

  sendToSocket(socketId, event, data) {
    const connection = this.connections.get(socketId);
    if (connection && connection.socket) {
      connection.socket.emit(event, data);
      return true;
    }
    return false;
  }

  saveConnectionState(socketId, state) {
    const existingState = this.connectionStates.get(socketId) || {};
    this.connectionStates.set(socketId, { ...existingState, ...state });
  }

  getConnectionState(socketId) {
    return this.connectionStates.get(socketId) || null;
  }

  updateAverageConnectionDuration(duration) {
    const totalConnections = this.statistics.totalDisconnections;
    const currentAverage = this.statistics.averageConnectionDuration;
    this.statistics.averageConnectionDuration =
      ((currentAverage * (totalConnections - 1)) + duration) / totalConnections;
  }

  getClientIP(socket) {
    return socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           socket.handshake.headers['x-real-ip'] ||
           socket.handshake.address ||
           'unknown';
  }

  getStatistics() {
    return {
      ...this.statistics,
      activeConnections: this.connections.size,
      totalSessions: this.sessions.size,
      averageConnectionDuration: Math.round(this.statistics.averageConnectionDuration / 1000),
      uptime: process.uptime()
    };
  }

  getConnectedClients() {
    return Array.from(this.connections.values()).map(conn => ({
      socketId: conn.socket.id,
      sessionId: conn.session.id,
      clientIP: conn.clientIP,
      connectedAt: conn.connectedAt,
      duration: Date.now() - conn.connectedAt,
      subscriptions: Array.from(conn.subscriptions),
      lastHeartbeat: conn.lastHeartbeat
    }));
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (this.isSessionExpired(session)) {
        this.sessions.delete(sessionId);
        console.log(`Expired session removed: ${sessionId}`);
      }
    }
  }

  close() {
    console.log('Closing WebSocket server...');
    this.io.close(() => {
      console.log('WebSocket server closed');
    });
  }
}

module.exports = WebSocketServer;
