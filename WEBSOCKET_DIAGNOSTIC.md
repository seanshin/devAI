# WebSocket Connection Diagnostic Guide

## Problem Summary

The system experiences "Connection error" messages despite WebSocket implementation being complete. Root cause: **State loss between orchestrator initiation and stream delivery**.

## Critical Issue

### Issue 1: run_id Context Loss
```python
# POST /api/orchestrate returns:
{"run_id": "abc-123", "status": "running"}

# Client sends via WebSocket:
{"type": "start", "input": "...", "run_id": "abc-123"}

# But WebSocket handler does:
async for event in weru_client.orchestrator_stream(session_id):  # ← Ignores run_id!
```

The `run_id` from step 1 is discarded. The backend then streams from a session that may not have any active orchestration.

### Issue 2: Missing run_id Tracking in WebSocket Handler

The WebSocket handler should store the run_id and use it to:
1. Track which orchestration is being streamed
2. Pass it to orchestrator_stream() if WeRU.B requires it
3. Ensure no orphaned runs

## Proper Architecture Pattern (from Workflow Orchestrator)

Workflow Orchestrator solves this with:

```python
# Step-based tracking in WebSocket handler
class OrchestrationSession:
    session_id: str
    run_id: str  # ← Store this!
    current_step: int
    state: dict
```

Each WebSocket connection maintains the full context:
- Which run is active
- What step it's on  
- What state it has

## Diagnostic Steps

### 1. Verify WebSocket Connection
```bash
# Terminal 1: Start backend with MOCK_MODE
cd api
MOCK_MODE=true python -m uvicorn main:app --host 0.0.0.0 --port 4500 --reload

# Terminal 2: Manual WebSocket test
python3 << 'EOF'
import asyncio
import json
import websockets

async def test():
    uri = "ws://localhost:4500/ws/orchestrate/test-session-001"
    try:
        async with websockets.connect(uri) as ws:
            # Should receive connected message
            msg = await ws.recv()
            print(f"✓ Connected: {msg}")
            
            # Send start message
            start_msg = {
                "type": "start",
                "input": "Test input",
                "run_id": "test-run-001"
            }
            await ws.send(json.dumps(start_msg))
            print(f"→ Sent: {start_msg}")
            
            # Receive events
            for i in range(15):  # Expect ~10-12 events from mock
                try:
                    event = await asyncio.wait_for(ws.recv(), timeout=2.0)
                    data = json.loads(event)
                    print(f"← Event {i}: {data.get('type')} - {data.get('data', data.get('message', ''))[:60]}")
                except asyncio.TimeoutError:
                    print(f"✗ Timeout waiting for event {i}")
                    break
    except Exception as e:
        print(f"✗ Connection error: {e}")

asyncio.run(test())
EOF
```

**Expected Output**:
```
✓ Connected: {"type":"connected","session_id":"test-session-001"}
→ Sent: {"type":"start","input":"Test input","run_id":"test-run-001"}
← Event 0: log - ▶️  Processing: Test input
← Event 1: log - 분석 단계 시작
← Event 2: progress - [분석] 입력 파싱 중...
... (more events)
← Event N: complete - ✓ 워크플로우 완료
```

### 2. Check Backend Logs
```bash
# Watch stderr for WebSocket handler debug output
docker logs -f api_container 2>&1 | grep -E "(WebSocket|orchestrator_stream|Yielding)"
```

Expected patterns:
- `[OrchestrateWS] Connected to orchestrator`
- `[WeRU.B orchestrator_stream] Yielding event: ...` (multiple times)
- `[OrchestrateWS] Disconnected from orchestrator`

### 3. Verify Mock Client Events

The mock client should yield these events in order:
1. phase_started (analysis)
2. phase_progress (analysis, overall_progress: 10, 20)
3. phase_completed (analysis)
4. phase_started (execution)
5. phase_progress (execution, overall_progress: 50, 75)
6. phase_completed (execution)
7. orchestration_completed

Check in `api/clients/mock_weru_client.py` line 44-112.

## Fix Strategy

### Option A: Store run_id in WebSocket Session (Recommended)

```python
# websocket.py - Add run_id tracking
@router.websocket("/orchestrate/{session_id}")
async def websocket_orchestrate(websocket: WebSocket, session_id: str):
    await manager.connect(websocket)
    
    # Session context - store both session_id and run_id
    session_context = {"session_id": session_id, "run_id": None}
    
    try:
        # ... existing code ...
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "start":
                # ← Store the run_id!
                session_context["run_id"] = message.get("run_id")
                input_text = message.get("input", "").strip()
                
                # Now orchestrator_stream can use run_id if needed
                # async for event in weru_client.orchestrator_stream(session_context["run_id"]):
```

### Option B: Verify WeRU.B API Contract

Check if `orchestrator_stream()` should use:
- `session_id` (current) - streams all events for a session
- `run_id` (alternative) - streams events for specific run

Contact WeRU.B documentation or test both approaches.

### Option C: Implement Request/Response Correlation

```python
# Add correlation ID to track requests
correlation_id = str(uuid.uuid4())
await weru_client.orchestrator_stream(
    session_id=session_id,
    correlation_id=correlation_id,
    run_id=session_context["run_id"]
)
```

## Implementation Validation

Once fixed, validate with:

```bash
# 1. Start backend
MOCK_MODE=true python -m uvicorn main:app --host 0.0.0.0 --port 4500

# 2. Frontend test
cd ../web && npm run dev  # http://localhost:3200

# 3. Verify in browser:
# - DevTools → Network → WS tab
# - Send "Test input" via chat interface
# - Should see messages flowing in WS frames
# - No "Connection error" in logs
# - Progress bar updates in real-time
# - Final message: "✓ 워크플로우 완료"
```

## Reference: Workflow Orchestrator Pattern

From analysis of Workflow Orchestrator (https://workfloworchestrator.org/):

```
Key Pattern: Workflow = Sequence of Steps with Persistent State

1. Step Definition
   @step("step_name")
   def my_step(input_data):
       return {"status": "done", "output": "..."}

2. Workflow Execution
   def workflow():
       return (init >> step_1 >> step_2 >> done)

3. State Management  
   - Each step persists its output to database
   - Next step receives previous step's output
   - On failure: retry from failed step (no restart needed)

4. Client Visibility
   - WebSocket maintains full execution context
   - Client sees step transitions and outputs in real-time
   - State is durably stored (database-backed)
```

**Key Insight**: Store the full execution context (run_id, current_step, outputs) in the WebSocket session, not just the session_id.
