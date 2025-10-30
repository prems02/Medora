# 🚀 Cliqpat Server Startup Guide

## ✅ Problem Solved: Port 5000 Already in Use

The error `EADDRINUSE: address already in use :::5000` has been completely resolved with multiple solutions.

## 🔧 Solutions Available

### 1. **Automatic Port Selection (Recommended)**
The server now automatically finds an available port if 5000 is busy:
- Tries ports 5000, 5001, 5002, etc. until it finds a free one
- No manual intervention required
- Server will tell you which port it's using

### 2. **PowerShell Script (Most Robust)**
```bash
npm run force-start
```
- Automatically kills all Node processes
- Waits for port 5000 to be free
- Provides step-by-step feedback
- Handles edge cases automatically

### 3. **Batch File (Windows)**
Double-click `start-server.bat`
- Kills existing processes
- Waits for cleanup
- Starts server automatically

### 4. **NPM Scripts**
```bash
npm run clean-start    # Kills processes and starts fresh
npm run kill          # Just kill existing processes
npm run dev           # Normal start (auto-handles port conflicts)
```

## 🚨 When You Still Get the Error

If you still see the port conflict error, use this sequence:

1. **Stop the server**: Press `Ctrl+C` in the terminal
2. **Kill all processes**: `npm run kill`
3. **Wait 5 seconds** for cleanup
4. **Start fresh**: `npm run force-start`

## 🔍 Manual Troubleshooting

If automatic solutions don't work:

```powershell
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill specific process by PID
Stop-Process -Id [PID] -Force

# Kill all Node processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

## 📁 Files Created/Modified

- `server.js` - Enhanced with automatic port selection
- `start-server.bat` - Windows batch file
- `start-server.ps1` - PowerShell script
- `package.json` - New npm scripts
- `.port` - Temporary file showing current port (auto-created)

## 🎯 Best Practice

**Always use `npm run force-start`** when you encounter port conflicts. This script:
- ✅ Kills all existing processes
- ✅ Waits for proper cleanup
- ✅ Verifies port availability
- ✅ Provides clear feedback
- ✅ Handles edge cases automatically

## 🚀 Quick Start Commands

```bash
# Normal development (auto-handles port conflicts)
npm run dev

# Force clean start (recommended for troubleshooting)
npm run force-start

# Just kill processes
npm run kill

# Clean start
npm run clean-start
```

## 🔄 Server Restart

When you need to restart:
1. Press `Ctrl+C` to stop gracefully
2. Wait for "Server closed" message
3. Run `npm run force-start`

The server will now automatically handle any port conflicts and find an available port!
