const http = require('http');
const express = require('express');
const WebSocketServer = require('./websocket-server');
const SignalBroadcaster = require('./src/signal-broadcaster');

const app = express();
const httpServer = http.createServer(app);

const wsServer = new WebSocketServer(httpServer, {
  port: 8081,
  enableAuth: false
});

const broadcaster = new SignalBroadcaster(wsServer, {
  broadcastInterval: 2000,
  minConfidenceForBroadcast: 0
});

console.log('Starting test...');

httpServer.listen(8081, () => {
  console.log('Test server listening on port 8081');

  broadcaster.start();
  console.log('Signal broadcaster started');

  const mockMultipliers = [1.2, 1.5, 1.8, 2.1, 1.3, 1.1, 5.5, 1.4, 1.6, 2.3, 1.2, 1.5, 10.2, 1.8];
  let index = 0;

  const feedInterval = setInterval(() => {
    if (index < mockMultipliers.length) {
      broadcaster.addGameResult(mockMultipliers[index]);
      console.log(`Added game result: ${mockMultipliers[index]}`);
      index++;
    } else {
      index = 0;
    }
  }, 1000);

  setTimeout(() => {
    const stats = broadcaster.getStatistics();
    console.log('\n=== Broadcaster Statistics ===');
    console.log(JSON.stringify(stats, null, 2));

    const history = broadcaster.getSignalHistory(5);
    console.log('\n=== Recent Signal History ===');
    console.log(JSON.stringify(history, null, 2));

    clearInterval(feedInterval);
    broadcaster.stop();
    wsServer.close();
    httpServer.close();
    console.log('\nTest completed successfully!');
  }, 15000);
});
