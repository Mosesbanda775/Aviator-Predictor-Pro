# Quick Start Guide

Get up and running with the Aviator Predictor Pro Live Signal System in 5 minutes.

## Prerequisites

Before you begin, ensure you have:
- Node.js 14.0.0 or higher
- npm 6.0.0 or higher

Check your versions:
```bash
node --version
npm --version
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dnbyukusenge/Aviator-Predictor-Pro.git
cd Aviator-Predictor-Pro
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages (~30 seconds).

### 3. Configure Environment

```bash
cp .env.example .env
```

The default configuration works for local development. No changes needed to start.

---

## Running the Application

### Start the Server

```bash
npm start
```

You should see:
```
HTTP Server running on port 3000
WebSocket Server running on port 8080
Prediction engine initialized
```

### Access the Dashboard

Open your web browser and navigate to:
```
http://localhost:3000
```

You should see:
- ✅ Connection status indicator (top-right, green when connected)
- 📊 Main signal card area
- 📜 Signal history section
- 📈 Statistics dashboard

---

## Using the System

### Understanding Signals

The system broadcasts three types of signals:

**🟢 BET** - Recommended time to place a bet
- High confidence in positive outcome
- Green color indicator
- Usually confidence ≥ 70%

**🟡 WAIT** - Suggested to wait for better opportunity
- Uncertain market conditions
- Yellow color indicator
- Medium confidence (50-70%)

**🔴 CASH_OUT** - Recommended time to cash out
- Risk of downturn detected
- Red color indicator
- High confidence in trend reversal

### Reading a Signal

Each signal displays:
- **Type**: BET, WAIT, or CASH_OUT
- **Confidence**: Percentage (0-100%)
- **Timestamp**: When signal was generated
- **Multiplier**: Current game multiplier (if available)
- **Trend**: Market direction (upward, downward, neutral)

### Example Signal

```
┌─────────────────────────┐
│ 🟢 BET                  │
│ Confidence: 85%         │
│ Time: 10:30:45          │
│ Multiplier: 2.45x       │
│ Trend: Upward           │
└─────────────────────────┘
```

---

## Basic Configuration

### Adjust Signal Frequency

Edit `.env`:
```bash
SIGNAL_BROADCAST_INTERVAL=3000  # Milliseconds (3 seconds)
```

**Common values:**
- Fast updates: 1000-2000ms
- Standard: 3000-5000ms
- Slow: 7000-10000ms

### Adjust Confidence Threshold

```bash
CONFIDENCE_THRESHOLD=70  # Only show signals with 70%+ confidence
```

**Recommendations:**
- Conservative: 75-85
- Balanced: 65-75
- Aggressive: 55-65

### Restart After Changes

```bash
# Stop server (Ctrl+C)
# Then restart
npm start
```

---

## Development Mode

For development with auto-reload on file changes:

```bash
npm run dev
```

The server will automatically restart when you modify code.

---

## Testing the Connection

### Check Server Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 123,
  "service": "aviator-predictor-pro",
  "version": "1.0.0"
}
```

### Check WebSocket Connection

In browser console (F12):
```javascript
// Should log connection events
localStorage.debug = '*';
location.reload();
```

### View Recent Signals

```bash
curl http://localhost:3000/api/history?limit=5
```

---

## Common First-Time Issues

### Port Already in Use

**Error:** `Error: listen EADDRINUSE`

**Solution:**
```bash
# Change ports in .env
HTTP_PORT=3001
WEBSOCKET_PORT=8081
```

### No Signals Appearing

**Possible causes:**
1. Prediction engine needs more data (wait 30-60 seconds)
2. Confidence threshold too high

**Solution:**
```bash
# Lower threshold temporarily
MIN_CONFIDENCE_FOR_BROADCAST=40
```

### Connection Failed in Browser

**Check:**
1. Server is running: `curl http://localhost:3000/api/health`
2. No firewall blocking ports
3. Browser console for errors (F12)

---

## Next Steps

### 📚 Read the Full Documentation

- **README.md**: Complete overview and features
- **API.md**: REST API and WebSocket protocol
- **CONFIGURATION.md**: Detailed configuration options
- **TROUBLESHOOTING.md**: Common issues and solutions
- **DEPLOYMENT.md**: Production deployment guide

### 🔧 Customize Your Setup

1. **Tune prediction algorithm** (CONFIGURATION.md)
2. **Adjust signal types** to your trading style
3. **Configure notifications** (audio/visual)
4. **Set up authentication** for production

### 🚀 Deploy to Production

When ready for production:

1. Update `.env` with production settings
2. Set `NODE_ENV=production`
3. Configure CORS for your domain
4. Set up SSL/TLS certificates
5. Use a process manager (PM2)
6. Set up monitoring

See **DEPLOYMENT.md** for complete instructions.

---

## Quick Reference

### Useful Commands

```bash
# Start server
npm start

# Development mode (auto-reload)
npm run dev

# View logs (if using PM2)
pm2 logs aviator-predictor

# Check server health
curl http://localhost:3000/api/health

# Get statistics
curl http://localhost:3000/api/stats

# View signal history
curl http://localhost:3000/api/history
```

### Important Files

```
.env                    # Environment configuration
config.json            # Application configuration
server.js              # Main HTTP server
websocket-server.js    # WebSocket server
public/index.html      # Dashboard UI
public/app.js          # Client-side logic
```

### Important URLs

```
http://localhost:3000           # Dashboard
http://localhost:3000/api/health    # Health check
http://localhost:3000/api/stats     # Statistics
http://localhost:3000/api/history   # Signal history
ws://localhost:8080             # WebSocket endpoint
```

---

## Support

### Getting Help

1. **Check documentation** in `docs/` folder
2. **Search GitHub issues**: https://github.com/dnbyukusenge/Aviator-Predictor-Pro/issues
3. **Review troubleshooting guide**: TROUBLESHOOTING.md

### Reporting Issues

When reporting issues, include:
- Error messages
- Server logs
- Browser console output
- Your configuration (redact sensitive data)
- Steps to reproduce

---

## Tips for Best Results

### 1. Let it Run
The prediction engine improves as it collects more data. Give it 5-10 minutes to build up history.

### 2. Start Conservative
Begin with higher confidence thresholds and lower them as you become familiar with the system.

### 3. Monitor Performance
Watch CPU and memory usage, especially with high signal frequencies.

### 4. Use Browser DevTools
Keep the browser console open (F12) to see real-time WebSocket events and debug issues.

### 5. Test Before Trading
Use the system in demo/practice mode first to understand signal patterns.

---

## Success Checklist

- [ ] Server starts without errors
- [ ] Dashboard loads at http://localhost:3000
- [ ] Connection indicator shows green (connected)
- [ ] Signals appear in the main card area
- [ ] Signal history populates
- [ ] Statistics dashboard shows data
- [ ] Can view API endpoints with curl

**If all items are checked, you're ready to go! 🎉**

---

## What's Next?

Now that you're up and running:

1. **Experiment** with different confidence thresholds
2. **Monitor** signal accuracy over time
3. **Customize** the dashboard to your preferences
4. **Learn** about advanced configuration options
5. **Deploy** to production when ready

Happy predicting! 🎲

---

**Quick Start Version:** 1.0.0
**Last Updated:** December 2, 2025
