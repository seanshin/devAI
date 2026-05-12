# Fundamental Architecture Issue - Design vs Implementation Gap

**Critical Finding**: The current implementation does NOT match the design document. This is why users are seeing repeated "Connection error" messages.

---

## The Problem

### Design Document Says (Correct Architecture)
From `docs/02-design/features/ai-orchestrator-werub.design.md`:

```
Communication Flow (Section 2.2):
1. Client calls: POST /api/orchestrate
   → Backend calls WeRU.B: POST /api/orchestrator/chat
   → Returns: { "run_id": "xxx" }

2. Client subscribes to SSE stream: GET /api/orchestrator/run/stream?session_id=xxx
   → Receives: Real-time status updates from WeRU.B
```

### Current Implementation Does (Broken)

```
api/routes/orchestrator.py (Line 41-44):
result = await weru_client.orchestrator_chat(request.input, session_id)
return OrchestrateResponse(
    run_id=result.get("run_id", str(uuid.uuid4())),  # ❌ Falls back to random UUID!
    ...
)

api/clients/weru_client.py (Line 91):
url = f"{self.base_url}/api/orchestrator/status/{run_id}"  # ❌ WRONG ENDPOINT!
```

### What's Happening

1. **Frontend** → Calls `POST /api/orchestrate` with user input
2. **Backend** → Calls WeRU.B at `/api/orchestrator/chat`
   - If response doesn't have "run_id" field, generates a fake UUID
3. **Backend** → Returns fake UUID to frontend
4. **Frontend** → Polls `GET /api/orchestrate/{run_id}/status` with fake UUID
5. **Backend** → Tries to fetch from WeRU.B: `/api/orchestrator/status/{fake_uuid}`
   - ❌ This endpoint doesn't exist or doesn't recognize the fake UUID
   - Returns: `{"detail": "WeRU.B API error: 404"}`
6. **Frontend** → Receives 404, logs "Connection error"
7. **Repeat**: Frontend polls every 2 seconds, getting 404 errors indefinitely

---

## Root Causes

### 1. **Missing run_id in orchestrator_chat Response**
- The WeRU.B `/api/orchestrator/chat` endpoint may not return a "run_id" field
- The backend should log the actual response to debug this
- Currently using `result.get("run_id", str(uuid.uuid4()))` as a band-aid

### 2. **Wrong Endpoint for Status**
- Design says: Use SSE streaming at `/api/orchestrator/run/stream`
- Implementation uses: REST polling at `/api/orchestrator/status/{run_id}`
- The second endpoint doesn't exist or returns 404

### 3. **No Proper Error Handling**
- Backend exceptions are wrapped with "WeRU.B API error: {status}"
- Frontend doesn't distinguish between:
  - Real connection error
  - Backend failure
  - WeRU.B API failure

### 4. **Missing API Key**
- `api/.env` has empty `WERUB_API_KEY`
- WeRU.B probably requires authentication
- All requests to WeRU.B likely fail silently

---

## Why Frontend Looks "Fixed" But Still Fails

### What Was "Fixed" (Misleading Changes)
- ✅ Removed WebSocket dependency
- ✅ Changed to REST polling
- ✅ Fixed API URL calculation
- ✅ Fixed undefined variable references

### Why These Didn't Help
- The frontend polling is syntactically correct
- But it's polling a **broken backend endpoint**
- The backend keeps returning 404 from WeRU.B
- Frontend correctly logs this as "Connection error"

---

## Solution: Implementation Redesign Required

### Option A: Use SSE Streaming (Recommended - Matches Design)

```python
# api/routes/orchestrator.py - FIX
@router.post("", response_model=OrchestrateResponse)
async def start_orchestration(request: OrchestrateRequest):
    try:
        session_id = request.session_id or str(uuid.uuid4())
        
        # Call WeRU.B - verify it returns run_id
        result = await weru_client.orchestrator_chat(
            request.input,
            session_id,
        )
        
        # DEBUG: Log the actual response
        print(f"[DEBUG] WeRU.B response: {result}")
        
        # If run_id exists, use it; otherwise this is the core problem
        run_id = result.get("run_id")
        if not run_id:
            raise ValueError(
                f"WeRU.B orchestrator_chat didn't return run_id. "
                f"Response: {result}"
            )
        
        return OrchestrateResponse(
            run_id=run_id,
            status="running",
            message="Orchestration started",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add WebSocket/SSE endpoint for streaming (design requirement)
@router.get("/{run_id}/stream")
async def stream_status(run_id: str):
    """Stream execution status using Server-Sent Events"""
    async def event_generator():
        try:
            async for event in weru_client.orchestrator_stream(run_id):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

### Option B: Mock WeRU.B for Development (Quick Fix)

```python
# api/clients/weru_client.py - ADD MOCK MODE
class WeRUClient:
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None, mock: bool = False):
        self.base_url = base_url or self.BASE_URL
        self.api_key = api_key or self.API_KEY
        self.mock_mode = mock  # ← ADD THIS
    
    async def orchestrator_chat(self, message: str, session_id: str):
        if self.mock_mode:
            # Return valid mock response
            return {
                "run_id": f"mock-{uuid.uuid4()}",
                "session_id": session_id,
                "status": "running",
                "message": f"Processing: {message}"
            }
        
        # ... existing code ...
```

### Option C: Debug Current Implementation

```python
# Add to api/clients/weru_client.py - orchestrator_chat method
async def orchestrator_chat(self, message: str, session_id: str):
    url = f"{self.base_url}/api/orchestrator/chat"
    payload = {"message": message, "session_id": session_id}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            json=payload,
            headers=self._auth_headers(),
        ) as response:
            data = await response.json()
            
            # DEBUG: Log everything
            print(f"[WeRU.B] Status: {response.status}")
            print(f"[WeRU.B] Response: {data}")
            print(f"[WeRU.B] Headers: {self._auth_headers()}")
            
            if response.status == 200:
                return data
            else:
                raise Exception(
                    f"WeRU.B API error: {response.status} - {data}"
                )
```

---

## Next Steps (User Must Choose)

### For Immediate Testing
1. Set `WERUB_API_KEY` in `api/.env` with valid WeRU.B API key
2. Add debug logging to see what `/api/orchestrator/chat` actually returns
3. Verify the endpoint and response format with WeRU.B documentation

### For Production Fix
1. **Option A (Recommended)**: Implement SSE streaming as per design
   - Remove REST polling from frontend
   - Use EventSource for real-time updates
   - Matches design document architecture

2. **Option B**: Implement proper mock for development
   - Keep REST polling
   - Return valid mock responses
   - Test frontend without WeRU.B

3. **Option C**: Document the actual WeRU.B API
   - Verify endpoint paths
   - Verify response formats
   - Update design/implementation to match reality

---

## Files to Check/Fix

```
Priority 1 (Critical):
❌ api/clients/weru_client.py
   - orchestrator_chat() returns wrong format
   - get_status() calls non-existent endpoint

Priority 2 (Important):
❌ api/routes/orchestrator.py
   - Fallback UUID generation hides real issue
   - No debug logging for WeRU.B responses

Priority 3 (Configuration):
❌ api/.env
   - WERUB_API_KEY is empty
```

---

## Verification Checklist

- [ ] Check WeRU.B server documentation for `/api/orchestrator/chat` response format
- [ ] Set valid WERUB_API_KEY and test endpoint
- [ ] Log actual response from orchestrator_chat to debug
- [ ] Decide between SSE streaming (design) vs REST polling (current)
- [ ] Update frontend to match chosen approach
- [ ] Test with mock WeRU.B first (no dependency on external service)

---

**Written**: 2026-05-12  
**Status**: Fundamental Architecture Issue Identified  
**Action Required**: Design Review + Implementation Fix
