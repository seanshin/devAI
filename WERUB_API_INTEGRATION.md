# WeRU.B API Integration Fix Guide

## Problem

The real WeRU.B API response format doesn't match what the orchestrator expects:

### Expected by Code
```python
{
    "run_id": "abc-123",
    "status": "running",
    "message": "Orchestration started",
    ...
}
```

### Actual from WeRU.B API
```python
{
    "intent": "general",
    "message": "FastAPI 사용하여... [long response]",
    "session_id": "test-sess-001",
    "suggestions": ["진료 접수", "증상 상담"],
    "type": "chat"
}
```

## Solution Options

### Option A: Generate run_id Locally (Recommended)
If the WeRU.B API doesn't provide run_id but maintains session context internally, we can generate one locally.

**Implementation in `api/routes/orchestrator.py`:**

```python
import uuid

@router.post("", response_model=OrchestrateResponse)
async def start_orchestration(request: OrchestrateRequest):
    try:
        session_id = request.session_id or str(uuid.uuid4())
        
        # Call WeRU.B Orchestrator API
        result = await weru_client.orchestrator_chat(
            request.input,
            session_id,
        )
        
        # Generate run_id locally if API doesn't provide one
        if "run_id" in result:
            run_id = result["run_id"]
        else:
            run_id = f"run-{uuid.uuid4().hex[:12]}"
        
        return OrchestrateResponse(
            run_id=run_id,
            status="running",
            message=f"Orchestration started. Session: {session_id}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Trade-off**: The run_id becomes a local identifier. It needs to be stored in the session context so the WebSocket handler can track it.

### Option B: Map WeRU.B Response Fields
Create an adapter that transforms the actual response to the expected format.

```python
def adapt_werub_response(response: Dict[str, Any], session_id: str) -> Dict[str, Any]:
    """Adapt WeRU.B chat response to orchestration response format"""
    return {
        "run_id": f"run-{uuid.uuid4().hex[:12]}",
        "session_id": session_id,
        "status": "running",
        "message": response.get("message", "")[:100],  # First 100 chars
        "intent": response.get("intent"),
        "suggestions": response.get("suggestions", []),
        "type": "orchestration",
    }
```

### Option C: Verify API Contract
Contact WeRU.B support to understand:
- Does the API have a separate "orchestration" endpoint vs "chat" endpoint?
- Should we be calling a different endpoint for orchestrations?
- Does the API generate run_ids internally?

**Check Documentation**: https://weve.io.kr/ollama/docs

## Recommended Approach: Option A + Option B

1. **For immediate testing**: Use Option A (generate run_id locally)
2. **For production**: Implement Option B (adapter pattern) for clarity
3. **Long-term**: Clarify API contract with WeRU.B team

## Implementation Steps

### Step 1: Update Orchestrator Route

```python
# api/routes/orchestrator.py
import uuid

@router.post("", response_model=OrchestrateResponse)
async def start_orchestration(request: OrchestrateRequest):
    try:
        session_id = request.session_id or str(uuid.uuid4())
        
        # Call WeRU.B Orchestrator API
        result = await weru_client.orchestrator_chat(
            request.input,
            session_id,
        )
        
        # Extract or generate run_id
        run_id = result.get("run_id") or f"run-{uuid.uuid4().hex[:12]}"
        
        return OrchestrateResponse(
            run_id=run_id,
            status="running",
            message="Orchestration started",
        )
    except Exception as e:
        print(f"[orchestrator] Error: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))
```

### Step 2: Store run_id in Session Context

The WebSocket handler needs to track the run_id for correlation.

```python
# api/routes/websocket.py
class OrchestrationSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.run_id = None  # Will be set when orchestration starts
        self.status = "idle"

# In websocket_orchestrate handler:
session_context = OrchestrationSession(session_id)

if message.get("type") == "start":
    session_context.run_id = message.get("run_id")  # Track the run_id
    # ... rest of orchestration logic
```

### Step 3: Test with Real API

```bash
# With real WeRU.B API
python -m uvicorn main:app --host 0.0.0.0 --port 4500

# Test orchestration endpoint
curl -X POST http://localhost:4500/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"input": "FastAPI 만들어줘", "session_id": "test-123"}'

# Expected response (now with generated run_id):
# {"run_id": "run-abc123...", "status": "running", "message": "Orchestration started"}
```

## Additional Investigation Needed

### 1. Check if orchestrator_chat is the Right Endpoint

The naming suggests:
- `orchestrator_chat` → Interactive chat responses
- Possibly `orchestrator_start` → Actual orchestration execution?
- Possibly `orchestrator_run` → Run orchestration and stream results?

### 2. Verify Stream Endpoint

The WebSocket calls:
```python
url = f"{self.base_url}/api/orchestrator/run/stream"
params = {"session_id": session_id}
```

Does this endpoint exist and work? Or does it need the run_id?

### 3. Check API Documentation

Visit https://weve.io.kr/ollama/docs or check the actual API specification for:
- Available endpoints
- Request/response formats  
- Session vs run_id semantics
- Stream vs polling APIs

## Testing Checklist

- [ ] REST endpoint `/api/orchestrate` returns valid run_id
- [ ] WebSocket endpoint accepts the run_id from client
- [ ] Stream endpoint `/api/orchestrator/run/stream` returns events
- [ ] Events flow correctly to frontend in real-time
- [ ] Dashboard updates progress, logs, and completion status

---

**Priority**: Fix this before the next UI testing phase. The WebSocket infrastructure is solid; this is just API contract alignment.
