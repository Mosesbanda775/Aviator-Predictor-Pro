const io = require('socket.io-client');

const WEBSOCKET_URL = 'http://localhost:8080';

console.log('Connecting to WebSocket server...');

const socket = io(WEBSOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log(`Connected to server with ID: ${socket.id}`);
});

socket.on('connected', (data) => {
  console.log('Server connection confirmed:', data);

  socket.emit('subscribe', ['high-confidence', 'bet-signals']);
  console.log('Subscribed to channels');
});

socket.on('signal', (signal) => {
  console.log('\n=== NEW SIGNAL RECEIVED ===');
  console.log(`Type: ${signal.type}`);
  console.log(`Confidence: ${signal.confidence}%`);
  console.log(`Reason: ${signal.reason}`);
  console.log(`Source: ${signal.source}`);
  console.log(`Timestamp: ${new Date(signal.timestamp).toISOString()}`);
  console.log(`Trend: ${signal.data.prediction.trend}`);
  console.log(`Risk Level: ${signal.data.risk.level} (${signal.data.risk.score})`);
  console.log('===========================\n');

  if (signal.confidence >= 80) {
    console.log('🔥 HIGH CONFIDENCE SIGNAL! 🔥');
  }
});

socket.on('signal_history', (data) => {
  console.log(`\nReceived ${data.signals.length} historical signals`);
  data.signals.forEach((signal, index) => {
    console.log(`  ${index + 1}. ${signal.type} - Confidence: ${signal.confidence}%`);
  });
  console.log('');
});

socket.on('subscribed', (data) => {
  console.log('Subscription confirmed:', data.channels);
});

socket.on('rate_limit_exceeded', (data) => {
  console.warn(`⚠️  Rate limit exceeded. Retry after ${data.retryAfter}ms`);
});

socket.on('disconnect', (reason) => {
  console.log(`Disconnected: ${reason}`);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('pong', (data) => {
  const latency = Date.now() - data.timestamp;
  console.log(`Pong received. Latency: ${latency}ms`);
});

setTimeout(() => {
  console.log('\nRequesting signal manually...');
  socket.emit('request_signal');
}, 5000);

setTimeout(() => {
  console.log('\nRequesting signal history...');
  socket.emit('request_history', { limit: 5 });
}, 10000);

setTimeout(() => {
  console.log('\nUpdating preferences...');
  socket.emit('update_preferences', {
    minConfidence: 70,
    signalTypes: ['BET', 'CASH_OUT'],
    notifyHighConfidence: true
  });
}, 15000);

process.on('SIGINT', () => {
  console.log('\nDisconnecting...');
  socket.disconnect();
  process.exit(0);
});

console.log('Client is running. Press Ctrl+C to exit.');
console.log('Waiting for signals...\n');
