class AviatorPredictorClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionStartTime = null;
    this.latencyInterval = null;
    this.uptimeInterval = null;
    this.signalHistory = [];
    this.statistics = {
      totalSignals: 0,
      betCount: 0,
      waitCount: 0,
      cashoutCount: 0,
      accuracyRate: 0
    };

    this.settings = this.loadSettings();
    this.initializeUI();
    this.setupEventListeners();
  }

  loadSettings() {
    const defaultSettings = {
      serverUrl: 'http://localhost:3000',
      notificationsEnabled: true,
      soundEnabled: true,
      confidenceThreshold: 70
    };

    const savedSettings = localStorage.getItem('aviatorPredictorSettings');
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  }

  saveSettings() {
    localStorage.setItem('aviatorPredictorSettings', JSON.stringify(this.settings));
  }

  loadSignalHistory() {
    const saved = localStorage.getItem('aviatorPredictorHistory');
    return saved ? JSON.parse(saved) : [];
  }

  saveSignalHistory() {
    const historyToSave = this.signalHistory.slice(-10);
    localStorage.setItem('aviatorPredictorHistory', JSON.stringify(historyToSave));
  }

  initializeUI() {
    this.elements = {
      connectBtn: document.getElementById('connectBtn'),
      disconnectBtn: document.getElementById('disconnectBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      statusIndicator: document.getElementById('statusIndicator'),
      statusText: document.getElementById('statusText'),
      latencyValue: document.getElementById('latencyValue'),
      currentSignal: document.getElementById('currentSignal'),
      signalType: document.getElementById('signalType'),
      confidenceValue: document.getElementById('confidenceValue'),
      predictedMultiplier: document.getElementById('predictedMultiplier'),
      riskLevel: document.getElementById('riskLevel'),
      signalTimestamp: document.getElementById('signalTimestamp'),
      signalMessage: document.getElementById('signalMessage'),
      historyContainer: document.getElementById('historyContainer'),
      accuracyRate: document.getElementById('accuracyRate'),
      accuracyProgress: document.getElementById('accuracyProgress'),
      totalSignals: document.getElementById('totalSignals'),
      betCount: document.getElementById('betCount'),
      waitCount: document.getElementById('waitCount'),
      cashoutCount: document.getElementById('cashoutCount'),
      uptime: document.getElementById('uptime'),
      settingsModal: document.getElementById('settingsModal'),
      serverUrlInput: document.getElementById('serverUrl'),
      notificationsCheckbox: document.getElementById('notificationsEnabled'),
      soundCheckbox: document.getElementById('soundEnabled'),
      confidenceThresholdRange: document.getElementById('confidenceThreshold'),
      confidenceThresholdValue: document.getElementById('confidenceThresholdValue'),
      closeModal: document.getElementById('closeModal'),
      cancelSettings: document.getElementById('cancelSettings'),
      saveSettingsBtn: document.getElementById('saveSettings')
    };

    this.applySettingsToUI();
    this.signalHistory = this.loadSignalHistory();
    this.renderSignalHistory();
  }

  applySettingsToUI() {
    this.elements.serverUrlInput.value = this.settings.serverUrl;
    this.elements.notificationsCheckbox.checked = this.settings.notificationsEnabled;
    this.elements.soundCheckbox.checked = this.settings.soundEnabled;
    this.elements.confidenceThresholdRange.value = this.settings.confidenceThreshold;
    this.elements.confidenceThresholdValue.textContent = `${this.settings.confidenceThreshold}%`;
  }

  setupEventListeners() {
    this.elements.connectBtn.addEventListener('click', () => this.connect());
    this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());
    this.elements.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.elements.closeModal.addEventListener('click', () => this.closeSettingsModal());
    this.elements.cancelSettings.addEventListener('click', () => this.closeSettingsModal());
    this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromModal());

    this.elements.confidenceThresholdRange.addEventListener('input', (e) => {
      this.elements.confidenceThresholdValue.textContent = `${e.target.value}%`;
    });

    this.elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.elements.settingsModal) {
        this.closeSettingsModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.settingsModal.classList.contains('active')) {
        this.closeSettingsModal();
      }
    });
  }

  connect() {
    if (this.isConnected) return;

    this.updateConnectionStatus('connecting', 'Connecting...');
    this.elements.connectBtn.disabled = true;

    try {
      this.socket = io(this.settings.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      this.setupSocketHandlers();
    } catch (error) {
      console.error('Connection error:', error);
      this.updateConnectionStatus('disconnected', 'Connection Failed');
      this.elements.connectBtn.disabled = false;
      this.showNotification('Connection failed. Please check your server URL.', 'error');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.handleDisconnection('client_disconnect');
  }

  setupSocketHandlers() {
    this.socket.on('connect', () => this.handleConnection());
    this.socket.on('disconnect', (reason) => this.handleDisconnection(reason));
    this.socket.on('connected', (data) => this.handleConnectedEvent(data));
    this.socket.on('signal', (data) => this.handleSignal(data));
    this.socket.on('error', (error) => this.handleError(error));
    this.socket.on('ping', () => this.handlePing());
    this.socket.on('pong', (data) => this.handlePong(data));
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.updateConnectionStatus('connecting', `Reconnecting... (${attemptNumber})`);
    });
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.showNotification('Reconnected successfully', 'success');
    });
    this.socket.on('reconnect_failed', () => {
      console.log('Reconnection failed');
      this.updateConnectionStatus('disconnected', 'Reconnection Failed');
      this.showNotification('Failed to reconnect. Please try again manually.', 'error');
    });
  }

  handleConnection() {
    this.isConnected = true;
    this.connectionStartTime = Date.now();
    this.updateConnectionStatus('connected', 'Connected');
    this.elements.connectBtn.disabled = true;
    this.elements.disconnectBtn.disabled = false;
    this.startLatencyMonitor();
    this.startUptimeCounter();
    this.showNotification('Connected to signal server', 'success');
    console.log('Connected to WebSocket server');
  }

  handleConnectedEvent(data) {
    console.log('Connection confirmed:', data);
  }

  handleDisconnection(reason) {
    this.isConnected = false;
    this.connectionStartTime = null;
    this.updateConnectionStatus('disconnected', 'Disconnected');
    this.elements.connectBtn.disabled = false;
    this.elements.disconnectBtn.disabled = true;
    this.elements.latencyValue.textContent = '--';
    this.stopLatencyMonitor();
    this.stopUptimeCounter();

    if (reason !== 'client_disconnect' && reason !== 'io client disconnect') {
      this.showNotification(`Disconnected: ${reason}`, 'warning');
    }

    console.log('Disconnected from WebSocket server:', reason);
  }

  handleSignal(signal) {
    console.log('Signal received:', signal);

    this.addSignalToHistory(signal);
    this.updateCurrentSignal(signal);
    this.updateStatistics();
    this.renderSignalHistory();
    this.saveSignalHistory();

    if (signal.confidence >= this.settings.confidenceThreshold) {
      this.notifyHighConfidenceSignal(signal);
    }
  }

  handleError(error) {
    console.error('Socket error:', error);
    this.showNotification(error.message || 'An error occurred', 'error');
  }

  handlePing() {
    if (this.socket) {
      this.socket.emit('pong');
    }
  }

  handlePong(data) {
    if (data && data.timestamp) {
      const latency = Date.now() - data.timestamp;
      this.updateLatency(latency);
    }
  }

  startLatencyMonitor() {
    this.latencyInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 5000);
  }

  stopLatencyMonitor() {
    if (this.latencyInterval) {
      clearInterval(this.latencyInterval);
      this.latencyInterval = null;
    }
  }

  startUptimeCounter() {
    this.updateUptime();
    this.uptimeInterval = setInterval(() => {
      this.updateUptime();
    }, 1000);
  }

  stopUptimeCounter() {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }
    this.elements.uptime.textContent = '00:00:00';
  }

  updateUptime() {
    if (!this.connectionStartTime) return;

    const elapsed = Date.now() - this.connectionStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    this.elements.uptime.textContent =
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  updateLatency(latency) {
    this.elements.latencyValue.textContent = `${latency}ms`;
  }

  updateConnectionStatus(status, text) {
    this.elements.statusText.textContent = text;

    if (status === 'connected') {
      this.elements.statusIndicator.classList.add('connected');
    } else {
      this.elements.statusIndicator.classList.remove('connected');
    }
  }

  addSignalToHistory(signal) {
    this.signalHistory.unshift(signal);

    if (this.signalHistory.length > 10) {
      this.signalHistory = this.signalHistory.slice(0, 10);
    }
  }

  updateCurrentSignal(signal) {
    this.elements.currentSignal.classList.remove('signal-bet', 'signal-wait', 'signal-cashout');
    this.elements.currentSignal.classList.add('new-signal');

    const signalClass = `signal-${signal.signalType.toLowerCase().replace('_', '')}`;
    this.elements.currentSignal.classList.add(signalClass);

    const signalIcons = {
      'BET': '🎯',
      'WAIT': '⏳',
      'CASH_OUT': '💰'
    };

    const signalTypeElement = this.elements.signalType;
    signalTypeElement.querySelector('.signal-icon').textContent = signalIcons[signal.signalType] || '❓';
    signalTypeElement.querySelector('.signal-label').textContent = signal.signalType;

    this.elements.confidenceValue.textContent = `${signal.confidence}%`;
    this.elements.predictedMultiplier.textContent = `${signal.predictedMultiplier}x`;
    this.elements.riskLevel.textContent = signal.riskLevel;

    const timestamp = new Date(signal.timestamp);
    this.elements.signalTimestamp.textContent = timestamp.toLocaleTimeString();

    const messages = {
      'BET': 'Favorable conditions detected. Consider placing a bet.',
      'WAIT': 'Market conditions uncertain. Recommend waiting for better signal.',
      'CASH_OUT': 'High risk detected. Consider cashing out if in position.'
    };
    this.elements.signalMessage.textContent = messages[signal.signalType] || 'Signal received';

    setTimeout(() => {
      this.elements.currentSignal.classList.remove('new-signal');
    }, 500);
  }

  updateStatistics() {
    this.statistics.totalSignals = this.signalHistory.length;
    this.statistics.betCount = this.signalHistory.filter(s => s.signalType === 'BET').length;
    this.statistics.waitCount = this.signalHistory.filter(s => s.signalType === 'WAIT').length;
    this.statistics.cashoutCount = this.signalHistory.filter(s => s.signalType === 'CASH_OUT').length;

    const highConfidenceSignals = this.signalHistory.filter(s => s.confidence >= 75).length;
    this.statistics.accuracyRate = this.statistics.totalSignals > 0
      ? Math.round((highConfidenceSignals / this.statistics.totalSignals) * 100)
      : 0;

    this.elements.accuracyRate.textContent = `${this.statistics.accuracyRate}%`;
    this.elements.accuracyProgress.style.width = `${this.statistics.accuracyRate}%`;
    this.elements.totalSignals.textContent = this.statistics.totalSignals;
    this.elements.betCount.textContent = this.statistics.betCount;
    this.elements.waitCount.textContent = this.statistics.waitCount;
    this.elements.cashoutCount.textContent = this.statistics.cashoutCount;
  }

  renderSignalHistory() {
    if (this.signalHistory.length === 0) {
      this.elements.historyContainer.innerHTML = `
        <div class="history-empty">
          <span class="empty-icon">📭</span>
          <p class="empty-message">No signal history yet. Connect to start receiving signals.</p>
        </div>
      `;
      return;
    }

    this.elements.historyContainer.innerHTML = this.signalHistory.map(signal => {
      const signalClass = `signal-${signal.signalType.toLowerCase().replace('_', '')}`;
      const timestamp = new Date(signal.timestamp);

      return `
        <div class="history-item ${signalClass}">
          <div class="history-type">${signal.signalType}</div>
          <div class="history-details">
            <span class="history-multiplier">Multiplier: ${signal.predictedMultiplier}x</span>
          </div>
          <div class="history-confidence">${signal.confidence}%</div>
          <div class="history-timestamp">${timestamp.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  notifyHighConfidenceSignal(signal) {
    if (this.settings.soundEnabled) {
      this.playNotificationSound(signal.signalType);
    }

    if (this.settings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        this.showBrowserNotification(signal);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.showBrowserNotification(signal);
          }
        });
      }
    }

    this.showVisualAlert(signal);
  }

  playNotificationSound(signalType) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies = {
      'BET': 800,
      'WAIT': 600,
      'CASH_OUT': 1000
    };

    oscillator.frequency.value = frequencies[signalType] || 700;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  showBrowserNotification(signal) {
    const notification = new Notification('Aviator Predictor Pro', {
      body: `${signal.signalType} signal detected with ${signal.confidence}% confidence`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'aviator-signal',
      requireInteraction: false
    });

    setTimeout(() => notification.close(), 5000);
  }

  showVisualAlert(signal) {
    this.elements.currentSignal.style.animation = 'none';
    setTimeout(() => {
      this.elements.currentSignal.style.animation = '';
    }, 10);
  }

  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  openSettingsModal() {
    this.elements.settingsModal.classList.add('active');
    this.applySettingsToUI();
  }

  closeSettingsModal() {
    this.elements.settingsModal.classList.remove('active');
  }

  saveSettingsFromModal() {
    this.settings.serverUrl = this.elements.serverUrlInput.value.trim();
    this.settings.notificationsEnabled = this.elements.notificationsCheckbox.checked;
    this.settings.soundEnabled = this.elements.soundCheckbox.checked;
    this.settings.confidenceThreshold = parseInt(this.elements.confidenceThresholdRange.value);

    this.saveSettings();
    this.closeSettingsModal();
    this.showNotification('Settings saved successfully', 'success');

    if (this.isConnected) {
      this.showNotification('Reconnect to apply new server URL', 'info');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.aviatorClient = new AviatorPredictorClient();
  console.log('Aviator Predictor Pro initialized');
});
