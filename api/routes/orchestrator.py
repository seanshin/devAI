"""Orchestrator API routes"""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from clients.weru_client import weru_client
from typing import Optional
import uuid


router = APIRouter(prefix="/api/orchestrate", tags=["orchestrator"])


class OrchestrateRequest(BaseModel):
    """Request to start orchestration"""
    input: str
    session_id: Optional[str] = None


class OrchestrateResponse(BaseModel):
    """Response from orchestration start"""
    run_id: str
    status: str
    message: str


@router.post("", response_model=OrchestrateResponse)
async def start_orchestration(request: OrchestrateRequest):
    """
    Start an orchestration with natural language input

    Args:
        request: Orchestration request with input and optional session_id

    Returns:
        Response with run_id and status
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())

        # Call WeRU.B Orchestrator API
        result = await weru_client.orchestrator_chat(
            request.input,
            session_id,
        )

        # IMPORTANT: Check if run_id exists in response
        run_id = result.get("run_id")
        if not run_id:
            # Log the response for debugging
            import sys
            print(f"[orchestrator] ERROR: No run_id in WeRU.B response", file=sys.stderr)
            print(f"[orchestrator] Response data: {result}", file=sys.stderr)
            print(f"[orchestrator] Response keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}", file=sys.stderr)

            # Return error instead of silently using UUID
            raise ValueError(
                f"WeRU.B orchestrator_chat response missing 'run_id'. "
                f"This indicates the WeRU.B API response format is unexpected. "
                f"Response: {result}"
            )

        return OrchestrateResponse(
            run_id=run_id,
            status="running",
            message="Orchestration started",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{run_id}/status")
async def get_status(run_id: str):
    """
    Get current execution status

    Args:
        run_id: Run ID to check

    Returns:
        Execution status
    """
    try:
        status = await weru_client.get_status(run_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(limit: int = 50):
    """
    Get execution history

    Args:
        limit: Number of items to retrieve

    Returns:
        History list
    """
    try:
        history = await weru_client.get_history(limit)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
