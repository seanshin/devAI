"""CLI Execution API routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import uuid
from typing import Optional


router = APIRouter(prefix="/api/cli", tags=["cli"])


class CliExecuteRequest(BaseModel):
    """Request to execute CLI command"""
    command: str
    session_id: Optional[str] = None


class CliExecuteResponse(BaseModel):
    """Response from CLI execution"""
    session_id: str
    command: str
    exit_code: int
    output: str
    error: str


@router.post("/execute", response_model=CliExecuteResponse)
async def execute_command(request: CliExecuteRequest):
    """
    Execute a CLI command

    Args:
        request: Command to execute

    Returns:
        Execution result
    """
    try:
        session_id = request.session_id or str(uuid.uuid4())

        # Execute command
        result = subprocess.run(
            request.command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30,
        )

        return CliExecuteResponse(
            session_id=session_id,
            command=request.command,
            exit_code=result.returncode,
            output=result.stdout,
            error=result.stderr,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Command timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
