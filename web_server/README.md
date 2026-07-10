# APK Distribution Server

This directory contains the Material 3 styled download portal for distributing your debug APK build.

## Files

- **index.html** - Beautiful Material 3 styled download portal
- **server.py** - Lightweight Python HTTP server
- **app-debug.apk** - Your compiled debug APK (add after building)

## Quick Start

### Step 1: Build Your APK

From your project root directory:

```bash
gradle :app:assembleDebug
```

This will create: `app/build/outputs/apk/debug/app-debug.apk`

### Step 2: Copy APK to web_server

```bash
cp app/build/outputs/apk/debug/app-debug.apk web_server/
```

Verify the file exists:
```bash
ls -lh web_server/app-debug.apk
```

### Step 3: Start the Server

#### Option A: Using Python (Recommended)

```bash
cd web_server
python3 server.py
```

#### Option B: Using Python's Built-in HTTP Server

```bash
cd web_server
python3 -m http.server 3000
```

### Step 4: Access Your Portal

Open your browser and visit:

```
http://localhost:3000
```

## Features

✅ **Beautiful Material 3 Design** - Modern, responsive UI
✅ **One-Click Download** - Direct APK download button
✅ **File Information** - Auto-detects APK size and build date
✅ **Mobile Responsive** - Works on phones, tablets, and desktops
✅ **Development Features** - Shows debug build info and status
✅ **Zero Dependencies** - Pure HTML/CSS/JavaScript + Python

## Troubleshooting

### Server won't start
- **Port 3000 already in use?** Use a different port: `python3 -m http.server 8080`
- **Permission denied?** Use: `python3 -m http.server 3000` instead of `server.py`

### APK not found
- Make sure `app-debug.apk` is in the `web_server/` directory
- Check file size is > 1MB: `ls -lh web_server/app-debug.apk`

### Can't access from phone
- Use your computer's IP address instead of `localhost`
- Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Access from phone: `http://YOUR_IP:3000`

## Installation on Device

1. On your Android device, visit: `http://localhost:3000`
2. Tap the "Download APK" button
3. Open the downloaded file to install
4. Allow installation from unknown sources if prompted
5. Launch the app and start testing!

## Customization

Edit `index.html` to customize:
- App name and icon
- Colors (update CSS variables in `:root`)
- Build information
- Feature list

Edit `server.py` to:
- Change port number
- Add authentication
- Add CORS headers
- Customize logging

## Advanced: Background Server

### Mac/Linux (Run in background)

```bash
cd web_server
nohup python3 server.py > server.log 2>&1 &
```

View logs:
```bash
tail -f web_server/server.log
```

Stop server:
```bash
pkill -f "python3 server.py"
```

### Windows (Run in background)

```bash
cd web_server
start pythonw server.py
```

## Development URL

Once running, your Development App URL is:

```
http://localhost:3000
```

Or on your local network (from other devices):

```
http://YOUR_COMPUTER_IP:3000
```

---

**Ready to test?** Build, copy the APK, and start the server! 🚀
