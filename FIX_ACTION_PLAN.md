# Action Plan: Fix WeRU.B API Integration

**Date**: 2026-05-12  
**Status**: Ready for Implementation  
**Priority**: Critical (Blocks entire system)

---

## Summary of Issues Found

### ✅ Frontend (Fixed)
- [x] Fixed undefined `isConnected` variable in EmbeddedTerminal.tsx
- [x] REST API polling correctly implemented
- [x] API URL calculation working properly

### ❌ Backend (Broken)
- **Root Issue**: Implementation doesn't match design document
- **Design says**: Use SSE streaming from `/api/orchestrator/run/stream`
- **Implementation does**: REST polling to `/api/orchestrator/status/{run_id}` (doesn't exist)
- **Result**: All status requests return 404, frontend logs "Connection error"

### ❌ WeRU.B Integration (Not Working)
- Missing API key in `api/.env` (WERUB_API_KEY is empty)
- Unknown response format from `/api/orchestrator/chat`
- Fallback UUID generation hides real problems
- No error visibility into what WeRU.B actually returns

---

## Immediate Actions (Do These First)

### Step 1: Get Valid WeRU.B API Key
**What**: Obtain the actual API key from WeRU.B service  
**Where**: Contact WeRU.B administrator or check your account settings  
**Update**: `api/.env` → set `WERUB_API_KEY=sk-xxxxxxxxxxxxx`

### Step 2: Add Minimal Mock for Testing (Without External Dependency)

Create `api/clients/mock_weru_client.py`:

```python
"""Mock WeRU.B client for development/testing"""
import uuid
import asyncio
from typing import Dict, Any, AsyncGenerator

class MockWeRUClient:
    """Mock client that simulates WeRU.B API responses"""

    async def orchestrator_chat(self, message: str, session_id: str) -> Dict[str, Any]:
        """Simulate orchestrator_chat response"""
        run_id = f"mock-{uuid.uuid4()}"
        print(f"[MockWeRU.B] orchestrator_chat: {message} → {run_id}")
        
        return {
            "run_id": run_id,
            "session_id": session_id,
            "status": "running",
            "message": f"Processing: {message}",
        }

    async def orchestrator_stream(self, session_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Simulate SSE stream"""
        # Simulate streaming progress
        stages = [
            {"type": "phase_started", "phase": "analysis", "message": "분석 중..."},
            {"type": "phase_progress", "phase": "analysis", "progress": 33, "log": "입력 파싱 중..."},
            {"type": "phase_progress", "phase": "analysis", "progress": 66, "log": "의도 분석 중..."},
            {"type": "phase_completed", "phase": "analysis"},
            {"type": "phase_started", "phase": "execution", "message": "실행 중..."},
            {"type": "phase_progress", "phase": "execution", "progress": 50, "log": "작업 진행 중..."},
            {"type": "orchestration_completed", "status": "success", "result": "작업 완료"},
        ]
        
        for stage in stages:
            yield stage
            await asyncio.sleep(1)  # Simulate delay

    async def get_status(self, run_id: str) -> Dict[str, Any]:
        """Simulate status check"""
        return {
            "run_id": run_id,
            "status": "running",
            "progress": 50,
            "current_phase": "execution",
        }

    async def get_history(self, limit: int = 50) -> Dict[str, Any]:
        """Simulate history"""
        return {
            "history": [
                {"run_id": f"mock-{i}", "status": "completed"} 
                for i in range(limit)
            ]
        }

    async def rag_search(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """Simulate RAG search"""
        return {
            "results": [
                {"id": f"result-{i}", "text": f"Mock result {i}"} 
                for i in range(limit)
            ]
        }

    async def rag_ask(self, question: str) -> Dict[str, Any]:
        """Simulate RAG ask"""
        return {"answer": f"Mock answer to: {question}"}
```

Update `api/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # New: Mock mode for development
    MOCK_MODE: bool = False  # Set via environment or .env
```

Update `api/main.py`:

```python
from config import settings
from clients.weru_client import weru_client
from clients.mock_weru_client import MockWeRUClient

# Use mock client if MOCK_MODE enabled
if settings.MOCK_MODE:
    weru_client = MockWeRUClient()
    # Log the mode
    logger.info("🧪 Using MOCK WeRU.B client (development mode)")
else:
    # Use real WeRU.B client
    logger.info("🔗 Using real WeRU.B client")
```

### Step 3: Test with Mock (Before Real WeRU.B)

```bash
# Terminal 1: Start API with mock
cd api
MOCK_MODE=true python -m uvicorn main:app --reload --port 4500

# Terminal 2: Test from frontend
# Open http://localhost:3200 and try orchestration
# Should work without real WeRU.B API key
```

---

## Medium Term: Fix Architecture (Choose One Approach)

### Approach A: Use SSE Streaming (Recommended - Matches Design)

Advantages:
- Matches design document
- Real-time streaming (better UX)
- Less polling overhead
- More efficient

Implementation:
1. Keep WebSocket endpoint (supports SSE via fallback)
2. Frontend uses EventSource instead of REST polling
3. Backend properly forwards WeRU.B SSE stream

```typescript
// Frontend: Replace REST polling with SSE
const eventSource = new EventSource(`${apiUrl}/api/orchestrate/${runId}/stream`);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateProgress(data);
};
```

```python
# Backend: Implement SSE endpoint
from fastapi.responses import StreamingResponse

@router.get("/{run_id}/stream")
async def stream_status(run_id: str):
    """Stream execution status using Server-Sent Events"""
    
    async def event_generator():
        try:
            # Stream directly from WeRU.B
            async for event in weru_client.orchestrator_stream(run_id):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

### Approach B: Keep REST Polling (Current - But Fix It)

Advantages:
- Simpler for beginners
- No streaming complexity
- Works with any API

Implementation:
1. Verify WeRU.B has `/api/orchestrator/status/{run_id}` endpoint
2. Or implement status tracking in our backend
3. Keep REST polling, just fix the endpoint

```python
# If WeRU.B doesn't have status endpoint, we track it
# Store run_id → session mapping in Redis
# Return cached status from our backend

redis_client.set(f"run:{run_id}", {
    "status": "running",
    "progress": 0,
    "session_id": session_id,
})

# Later, when SSE event comes in:
redis_client.set(f"run:{run_id}", {
    "status": "running",
    "progress": 50,
    # ... updated data ...
})
```

### Approach C: Hybrid (Redis Caching + SSE)

Best of both:
1. Subscribe to WeRU.B SSE internally
2. Cache status in Redis
3. Frontend polls Redis via REST
4. Or frontend gets WebSocket events

---

## Testing Checklist

### Unit Tests (Add to `api/test_main.py`)
```python
def test_mock_orchestrator_chat():
    """Test mock returns proper run_id"""
    client = MockWeRUClient()
    result = asyncio.run(client.orchestrator_chat("test", "sess-1"))
    assert "run_id" in result
    assert result["status"] == "running"

def test_real_orchestrator_chat_with_api_key():
    """Test real API only if key exists"""
    if not settings.WERUB_API_KEY:
        pytest.skip("WERUB_API_KEY not set")
    # ... test with real API ...
```

### Integration Tests (With Frontend)
```python
def test_orchestration_flow():
    """Full orchestration flow test"""
    # 1. POST /api/orchestrate → get run_id
    response = client.post("/api/orchestrate", json={
        "input": "test",
        "session_id": "test-sess"
    })
    assert response.status_code == 200
    run_id = response.json()["run_id"]
    
    # 2. GET /api/orchestrate/{run_id}/status → get status
    response = client.get(f"/api/orchestrate/{run_id}/status")
    assert response.status_code == 200
    assert "status" in response.json()
```

---

## Priority Order

### Phase 1: Immediate (Today)
- [ ] Document findings (✅ Done: FUNDAMENTAL_ARCHITECTURE_ISSUE.md)
- [ ] Set WERUB_API_KEY in .env
- [ ] Implement mock client
- [ ] Test mock client works
- [ ] Add debug logging (✅ Done)

### Phase 2: Short Term (This Week)
- [ ] Choose approach (SSE vs REST vs Hybrid)
- [ ] Implement chosen approach
- [ ] Add unit tests
- [ ] Test with real WeRU.B API
- [ ] Document WeRU.B API format expectations

### Phase 3: Long Term (This Month)
- [ ] Improve error handling
- [ ] Add monitoring/logging
- [ ] Performance optimization
- [ ] Production deployment

---

## Files to Modify

```
Priority 1:
- api/.env (add WERUB_API_KEY)
- api/config.py (add MOCK_MODE)
- api/clients/mock_weru_client.py (create new)
- api/main.py (use mock client if MOCK_MODE)

Priority 2:
- api/routes/orchestrator.py (implement streaming or caching)
- web/lib/hooks/useWebSocket.ts (replace with EventSource)
- web/components/Dashboard.tsx (update for new approach)
- web/components/ChatInterface.tsx (update for new approach)

Priority 3:
- api/test_main.py (add tests)
- README.md (document mock mode and testing)
- FUNDAMENTAL_ARCHITECTURE_ISSUE.md (✅ Done)
```

---

## Debugging Commands

### Check Backend Logs
```bash
# Terminal where API is running
# Look for [WeRU.B ...] log lines showing what's happening
```

### Test WeRU.B Directly
```bash
# Test if WeRU.B is accessible
curl -X POST "https://weve.io.kr/ollama/api/orchestrator/chat" \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "session_id": "test"}'

# Check response format
# Should tell us what's actually in the response
```

### Monitor Status Updates
```bash
# Open browser console on http://localhost:3200
# Look at network requests to /api/orchestrate/... endpoints
# Check response status codes and body content
```

---

## Success Criteria

✅ When fixed:
1. POST /api/orchestrate returns valid run_id (not fallback UUID)
2. GET /api/orchestrate/{run_id}/status returns 200 (not 404)
3. Frontend receives status updates without "Connection error" messages
4. Dashboard shows real progress from WeRU.B
5. Logs show actual WeRU.B API responses (with debug logging)

---

**Next Step**: Choose your approach and let me implement it.

Which would you prefer?
- **A** (SSE Streaming) - Better architecture, matches design
- **B** (REST Polling) - Simpler, but need to verify WeRU.B endpoint
- **C** (Hybrid) - Best of both, more complex

Or start with **mock mode** first to test the frontend works correctly?
