const config = require('../config.json');

class PredictionEngine {
  constructor(options = {}) {
    this.confidenceThreshold = options.confidenceThreshold || config.prediction.confidenceThreshold;
    this.analysisWindowSize = options.analysisWindowSize || config.prediction.analysisWindowSize;
    this.minDataPoints = options.minDataPoints || config.prediction.minDataPoints;
    this.patternRecognitionDepth = options.patternRecognitionDepth || config.prediction.patternRecognitionDepth;
    this.riskLevels = config.prediction.riskLevels;

    this.historicalData = [];
    this.signalHistory = [];
    this.statistics = {
      totalPredictions: 0,
      accuratePredictions: 0,
      accuracy: 0
    };

    this.sensitivity = options.sensitivity || 1.0;
  }

  addGameResult(multiplier, timestamp = Date.now()) {
    this.historicalData.push({
      multiplier: parseFloat(multiplier),
      timestamp
    });

    if (this.historicalData.length > this.analysisWindowSize) {
      this.historicalData.shift();
    }
  }

  calculateMovingAverage(windowSize) {
    if (this.historicalData.length < windowSize) {
      windowSize = this.historicalData.length;
    }

    if (windowSize === 0) return 0;

    const recentData = this.historicalData.slice(-windowSize);
    const sum = recentData.reduce((acc, data) => acc + data.multiplier, 0);
    return sum / windowSize;
  }

  calculateExponentialMovingAverage(windowSize, smoothing = 2) {
    if (this.historicalData.length === 0) return 0;
    if (this.historicalData.length < windowSize) {
      windowSize = this.historicalData.length;
    }

    const recentData = this.historicalData.slice(-windowSize);
    const multiplier = smoothing / (windowSize + 1);

    let ema = recentData[0].multiplier;
    for (let i = 1; i < recentData.length; i++) {
      ema = (recentData[i].multiplier * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  detectPatterns() {
    if (this.historicalData.length < this.patternRecognitionDepth) {
      return {
        trend: 'NEUTRAL',
        strength: 0,
        volatility: 0
      };
    }

    const recentData = this.historicalData.slice(-this.patternRecognitionDepth);
    const multipliers = recentData.map(d => d.multiplier);

    const shortMA = this.calculateMovingAverage(5);
    const longMA = this.calculateMovingAverage(this.patternRecognitionDepth);

    const volatility = this.calculateVolatility(multipliers);

    let trend = 'NEUTRAL';
    let strength = 0;

    if (shortMA > longMA * 1.1) {
      trend = 'UPWARD';
      strength = Math.min(((shortMA - longMA) / longMA) * 100, 100);
    } else if (shortMA < longMA * 0.9) {
      trend = 'DOWNWARD';
      strength = Math.min(((longMA - shortMA) / longMA) * 100, 100);
    } else {
      strength = Math.abs(((shortMA - longMA) / longMA) * 100);
    }

    const consecutiveLow = this.countConsecutiveBelow(multipliers, 2.0);
    const consecutiveHigh = this.countConsecutiveAbove(multipliers, 5.0);

    return {
      trend,
      strength: strength * this.sensitivity,
      volatility,
      consecutiveLow,
      consecutiveHigh,
      shortMA,
      longMA
    };
  }

  calculateVolatility(multipliers) {
    if (multipliers.length < 2) return 0;

    const mean = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
    const squaredDiffs = multipliers.map(m => Math.pow(m - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / multipliers.length;
    const standardDeviation = Math.sqrt(variance);

    return (standardDeviation / mean) * 100;
  }

  countConsecutiveBelow(multipliers, threshold) {
    let count = 0;
    for (let i = multipliers.length - 1; i >= 0; i--) {
      if (multipliers[i] < threshold) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  countConsecutiveAbove(multipliers, threshold) {
    let count = 0;
    for (let i = multipliers.length - 1; i >= 0; i--) {
      if (multipliers[i] > threshold) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  assessRisk() {
    if (this.historicalData.length < this.minDataPoints) {
      return {
        level: 'UNKNOWN',
        score: 0,
        factors: []
      };
    }

    const patterns = this.detectPatterns();
    const recentMultipliers = this.historicalData.slice(-10).map(d => d.multiplier);
    const avgRecent = recentMultipliers.reduce((a, b) => a + b, 0) / recentMultipliers.length;

    let riskScore = 0;
    const factors = [];

    if (patterns.volatility > 50) {
      riskScore += 30;
      factors.push('High volatility detected');
    } else if (patterns.volatility > 30) {
      riskScore += 15;
      factors.push('Moderate volatility');
    }

    if (patterns.consecutiveLow >= 3) {
      riskScore -= 20;
      factors.push('Multiple consecutive low multipliers');
    }

    if (patterns.consecutiveHigh >= 2) {
      riskScore += 25;
      factors.push('Consecutive high multipliers detected');
    }

    if (avgRecent < 2.0) {
      riskScore -= 15;
      factors.push('Low average recent outcomes');
    } else if (avgRecent > 4.0) {
      riskScore += 20;
      factors.push('High average recent outcomes');
    }

    if (patterns.trend === 'DOWNWARD' && patterns.strength > 20) {
      riskScore -= 10;
      factors.push('Strong downward trend');
    } else if (patterns.trend === 'UPWARD' && patterns.strength > 20) {
      riskScore += 10;
      factors.push('Strong upward trend');
    }

    riskScore = Math.max(0, Math.min(100, riskScore + 50));

    let level = 'MEDIUM';
    if (riskScore <= this.riskLevels.low.max) {
      level = 'LOW';
    } else if (riskScore >= this.riskLevels.high.min) {
      level = 'HIGH';
    }

    return {
      level,
      score: Math.round(riskScore),
      factors
    };
  }

  calculateConfidence(patterns, risk) {
    if (this.historicalData.length < this.minDataPoints) {
      return 0;
    }

    let confidence = 50;

    const dataMaturity = Math.min(this.historicalData.length / this.analysisWindowSize, 1.0);
    confidence += dataMaturity * 20;

    if (patterns.trend !== 'NEUTRAL') {
      confidence += (patterns.strength / 100) * 15;
    }

    if (patterns.volatility < 20) {
      confidence += 10;
    } else if (patterns.volatility > 60) {
      confidence -= 15;
    }

    if (patterns.consecutiveLow >= 4) {
      confidence += 15;
    } else if (patterns.consecutiveLow >= 3) {
      confidence += 10;
    }

    if (risk.level === 'LOW') {
      confidence += 5;
    } else if (risk.level === 'HIGH') {
      confidence -= 5;
    }

    confidence = confidence * this.sensitivity;

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  generateSignal() {
    if (this.historicalData.length < this.minDataPoints) {
      return {
        type: 'WAIT',
        confidence: 0,
        reason: 'Insufficient data for prediction',
        timestamp: Date.now(),
        data: null
      };
    }

    const patterns = this.detectPatterns();
    const risk = this.assessRisk();
    const confidence = this.calculateConfidence(patterns, risk);

    let signalType = 'WAIT';
    let reason = '';

    if (patterns.consecutiveLow >= 4 && risk.level === 'LOW') {
      signalType = 'BET';
      reason = `Strong opportunity: ${patterns.consecutiveLow} consecutive low outcomes`;
    } else if (patterns.consecutiveLow >= 3 && patterns.trend === 'DOWNWARD') {
      signalType = 'BET';
      reason = `Good opportunity: Downward trend with ${patterns.consecutiveLow} low outcomes`;
    } else if (risk.level === 'HIGH' && patterns.volatility > 50) {
      signalType = 'CASH_OUT';
      reason = 'High risk environment with elevated volatility';
    } else if (patterns.consecutiveHigh >= 2 && risk.score > 70) {
      signalType = 'CASH_OUT';
      reason = `Risk warning: ${patterns.consecutiveHigh} consecutive high multipliers`;
    } else if (patterns.trend === 'UPWARD' && patterns.strength > 30 && risk.score > 60) {
      signalType = 'WAIT';
      reason = 'Upward trend detected, waiting for stabilization';
    } else {
      signalType = 'WAIT';
      reason = 'Market conditions unclear, waiting for better signal';
    }

    const signal = {
      type: signalType,
      confidence,
      reason,
      timestamp: Date.now(),
      data: {
        patterns,
        risk,
        recentAverage: this.calculateMovingAverage(10),
        ema: this.calculateExponentialMovingAverage(10)
      }
    };

    this.signalHistory.push(signal);
    if (this.signalHistory.length > config.signals.historyBufferSize) {
      this.signalHistory.shift();
    }

    this.statistics.totalPredictions++;

    return signal;
  }

  updateAccuracy(signalId, wasAccurate) {
    if (wasAccurate) {
      this.statistics.accuratePredictions++;
    }

    this.statistics.accuracy = this.statistics.totalPredictions > 0
      ? (this.statistics.accuratePredictions / this.statistics.totalPredictions) * 100
      : 0;
  }

  getStatistics() {
    return {
      ...this.statistics,
      accuracy: Math.round(this.statistics.accuracy * 100) / 100,
      dataPoints: this.historicalData.length,
      signalsGenerated: this.signalHistory.length
    };
  }

  getSignalHistory(limit = 10) {
    return this.signalHistory.slice(-limit);
  }

  setSensitivity(sensitivity) {
    this.sensitivity = Math.max(0.5, Math.min(2.0, sensitivity));
  }

  setThreshold(threshold) {
    this.confidenceThreshold = Math.max(0, Math.min(100, threshold));
  }

  reset() {
    this.historicalData = [];
    this.signalHistory = [];
    this.statistics = {
      totalPredictions: 0,
      accuratePredictions: 0,
      accuracy: 0
    };
  }
}

module.exports = PredictionEngine;
