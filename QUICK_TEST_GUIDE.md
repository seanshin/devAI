# Quick Test Guide - Mock WeRU.B Client

**Goal**: Test the entire system without needing a real WeRU.B API key

---

## Option 1: Using Mock Mode (Recommended for Quick Testing)

### Step 1: Enable Mock Mode

Edit `api/.env`:
```env
MOCK_MODE=true
```

Or set environment variable:
```bash
export MOCK_MODE=true
```

### Step 2: Start the Backend

```bash
cd api
source venv/bin/activate  # If not already activated
python -m uvicorn main:app --reload --port 4500 --host 0.0.0.0
```

You should see:
```
⚠️  WARNING: WERUB_API_KEY not set...
🧪 MOCK MODE ENABLED - Using mock WeRU.B client
```

### Step 3: Start the Frontend

In another terminal:
```bash
cd web
npm run dev
```

Open: http://localhost:3200

### Step 4: Test Orchestration

1. Type something in the input field: `FastAPI 기반 사용자 인증 시스템`
2. Click "실행" button
3. **Expected behavior**:
   - ✅ Returns a mock run_id (like `mock-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - ✅ Dashboard shows "실행 중" status
   - ✅ Progress bar updates in real-time
   - ✅ Logs show streaming progress
   - ✅ After ~8 seconds, completes with "✓ 작업 완료"
   - ❌ **NO** "Connection error" messages

### Step 5: Open Terminal

Click "터미널 열기" button:
- Terminal opens successfully (we fixed the undefined variable bug)
- Can type commands (local execution)

---

## Option 2: Test with Real WeRU.B (If You Have API Key)

### Step 1: Set API Key

Edit `api/.env`:
```env
WERUB_API_KEY=sk-your-actual-api-key-here
MOCK_MODE=false
```

### Step 2: Start Backend

```bash
cd api
source venv/bin/activate
python -m uvicorn main:app --reload --port 4500 --host 0.0.0.0
```

### Step 3: Check Backend Logs

Look for these debug lines when you call `/api/orchestrate`:
```
[WeRU.B orchestrator_chat] Status: 200
[WeRU.B orchestrator_chat] Response: {...actual WeRU.B response...}
[WeRU.B orchestrator_chat] Response keys: [...]
```

If you see `"run_id" missing` error, it means WeRU.B response format is different than expected. Document this and report it.

---

## What to Verify

### ✅ Backend Health
```bash
curl http://localhost:4500/health
# Should return: {"status": "ok", "version": "0.1.0"}
```

### ✅ Orchestration Endpoint
```bash
curl -X POST http://localhost:4500/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"input": "test", "session_id": "test-sess"}'

# Should return: {"run_id": "...", "status": "running", "message": "..."}
```

### ✅ Status Endpoint
```bash
# Use run_id from above response
curl http://localhost:4500/api/orchestrate/{run_id}/status

# Should return status object (not 404 error)
```

### ✅ Frontend Status
- No console errors
- No "Connection error" messages in dashboard
- Progress updates every 2 seconds
- Logs display streaming messages

---

## Debug Logs

### Backend Console
```bash
# Terminal with backend running should show:

[MockWeRU.B] orchestrator_chat: message='...' session='...' → run_id='mock-...'
[MockWeRU.B] orchestrator_stream: session='...' starting
[MockWeRU.B] Yielding event: phase_started
[MockWeRU.B] Yielding event: phase_progress
... (more events)
[MockWeRU.B] orchestrator_stream: completed
```

### Frontend Console (Browser DevTools)
```javascript
// Should show:
[ChatInterface] Calling orchestrator API: ...
[ChatInterface] API response: {run_id: '...', ...}
[Dashboard] Poll response: {status: 'running', progress: 33, ...}
```

### Network Tab (Browser DevTools)
- POST `/api/orchestrate` → 200 OK
- GET `/api/orchestrate/{run_id}/status` → 200 OK (no 404!)
- Repeated GET calls every 2 seconds

---

## Troubleshooting

### Issue: Backend won't start

```bash
# Check if port 4500 is in use
lsof -i :4500
# If something is running, kill it:
kill -9 <PID>
```

### Issue: Frontend shows "Connection error"

Check backend logs for:
1. `MOCK_MODE ENABLED` - if yes, mock client is being used ✅
2. `WERUB_API_KEY not set` - expected for mock mode
3. `[WeRU.B ...]` debug logs - showing actual API calls

If no mock logs, then MOCK_MODE didn't take effect. Restart backend and verify `.env` file.

### Issue: Progress doesn't update

Check browser DevTools → Network tab:
- Are GET requests being made to `/api/orchestrate/{run_id}/status`?
- What status codes? (should be 200, not 404)
- What response body?

If 404: Backend is not using mock client. Check MOCK_MODE setting.

---

## Next Steps

### After Verifying Mock Works
1. Decide: Keep mock mode, or use real WeRU.B?
2. If keeping mock: Perfect for development/testing
3. If using real WeRU.B: Get valid API key and test

### Real WeRU.B Integration
Once you have API key:
1. Set `WERUB_API_KEY` in `.env`
2. Set `MOCK_MODE=false`
3. Restart backend
4. Check debug logs to verify WeRU.B responses
5. If responses missing `run_id`, document the actual format
6. Implement proper handling in backend

---

## Success Checklist

- [ ] Mock mode enabled in `.env`
- [ ] Backend starts with "MOCK MODE ENABLED" log
- [ ] Frontend at http://localhost:3200
- [ ] Can submit orchestration request
- [ ] Get back valid run_id (not UUID fallback)
- [ ] Dashboard shows progress updates
- [ ] No "Connection error" messages in logs
- [ ] Terminal button works without errors
- [ ] After ~8 seconds, shows "✓ 작업 완료"

If all checked: **System architecture is sound** ✅

---

**Quick Start** (Copy-paste):
```bash
# Terminal 1: Backend with mock
cd api
export MOCK_MODE=true
python -m uvicorn main:app --reload --port 4500

# Terminal 2: Frontend
cd web
npm run dev

# Then: http://localhost:3200
```
