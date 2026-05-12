# Deployment Hotfix - WebSocket Connection Fix (2026-05-12)

## Problem
WebSocket connections from the browser at `172.237.14.73/ai/` were failing because the frontend was trying to connect to `ws://localhost:4500/...` instead of `ws://172.237.14.73:4500/...`.

## Solution
Updated ChatInterface and EmbeddedTerminal components to determine the API URL dynamically at runtime based on the current browser hostname.

**Commit**: `f499878`

## Deployment Steps

**On Production Server (172.237.14.73)**:

```bash
# 1. Navigate to the project directory
cd /home/weruby/Dev_AI

# 2. Pull the latest code
git pull origin main

# 3. Rebuild the Next.js frontend
cd web
npm run build

# 4. Stop the current Next.js service
pkill -f "npm run start" || true
sleep 2

# 5. Start the Next.js service again (port 3200)
npm run start -- --port 3200 &

# 6. Verify it's running
sleep 3
curl -I http://localhost:3200/ai/ | head -5
```

## Verification

After deployment, test the WebSocket connection:

```bash
# From local machine
curl http://172.237.14.73/ai/
# Should load the dashboard without WebSocket errors
```

Open browser console (F12) and check:
- No "Connection error" messages in logs
- WebSocket should connect to `ws://172.237.14.73:4500/ws/orchestrate/...`
- Able to enter natural language input and see real-time logs

## What Changed

### Components Updated (4 files):

1. **ChatInterface.tsx**
   - Replaced static `API_URL` with dynamic `getApiUrl()` function
   - API URL determined at runtime based on `window.location.hostname`

2. **EmbeddedTerminal.tsx**
   - Applied same dynamic API URL logic for CLI WebSocket connections
   - Ensures terminal uses correct hostname in production

3. **Dashboard.tsx**
   - Updated WebSocket URL calculation to use dynamic API URL
   - Guarantees real-time log streaming works in production

4. **lib/api/client.ts**
   - Added `getApiBase()` helper function
   - Added `createOrchestratorClient()` factory for dynamic client creation
   - Maintains backward compatibility with existing singleton

### Runtime URL Resolution:
- **Development (localhost)**: Connects to `http://localhost:4500`
- **Production (172.237.14.73)**: Connects to `http://172.237.14.73:4500`
- Determined automatically using `window.location` in browser

## Rollback (if needed)

If issues arise, revert to the previous working version:

```bash
git checkout 60259a0
npm run build
npm run start -- --port 3200 &
```

---

## Commits

1. `f499878` - Fix: Use dynamic API URL based on hostname for WebSocket connections
2. `b60cca7` - Fix: Apply dynamic API URL fix to all components (Dashboard + client)

---

**Status**: ✅ Ready for deployment  
**Latest Commit**: b60cca7
