"""WebSocket routes for real-time streaming"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import subprocess
from typing import Set

router = APIRouter(prefix="/ws", tags=["websocket"])

# Active WebSocket connections
active_connections: Set[WebSocket] = set()


class ConnectionManager:
    """Manage WebSocket connections"""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept and register a connection"""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a disconnected client"""
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Send message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Skip clients with send errors
                pass

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to specific client"""
        try:
            await websocket.send_json(message)
        except Exception:
            pass


manager = ConnectionManager()


@router.websocket("/orchestrate/{session_id}")
async def websocket_orchestrate(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for orchestration streaming

    Args:
        websocket: WebSocket connection
        session_id: Session ID for the orchestration
    """
    await manager.connect(websocket)
    try:
        while True:
            # Wait for client messages (e.g., to cancel operation)
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            if message.get("type") == "ping":
                await manager.send_personal(
                    websocket,
                    {"type": "pong", "session_id": session_id},
                )
            elif message.get("type") == "cancel":
                await manager.send_personal(
                    websocket,
                    {"type": "cancelled", "session_id": session_id},
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


@router.websocket("/logs/{run_id}")
async def websocket_logs(websocket: WebSocket, run_id: str):
    """
    WebSocket endpoint for log streaming

    Args:
        websocket: WebSocket connection
        run_id: Run ID to stream logs for
    """
    await manager.connect(websocket)
    try:
        # Send initial message
        await manager.send_personal(
            websocket,
            {"type": "connected", "run_id": run_id},
        )

        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await manager.send_personal(
                    websocket,
                    {"type": "pong"},
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


async def emit_log(run_id: str, log_message: str, level: str = "info"):
    """
    Emit a log message to all connected clients

    Args:
        run_id: Run ID
        log_message: Log message text
        level: Log level (info, error, warning, success)
    """
    message = {
        "type": "log",
        "run_id": run_id,
        "message": log_message,
        "level": level,
    }
    await manager.broadcast(message)


async def emit_progress(run_id: str, progress: int, status: str):
    """
    Emit progress update

    Args:
        run_id: Run ID
        progress: Progress percentage (0-100)
        status: Status message
    """
    message = {
        "type": "progress",
        "run_id": run_id,
        "progress": min(progress, 100),
        "status": status,
    }
    await manager.broadcast(message)


@router.websocket("/cli/{session_id}")
async def websocket_cli(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for CLI command execution

    Args:
        websocket: WebSocket connection
        session_id: Session ID for the CLI session
    """
    await manager.connect(websocket)
    try:
        await manager.send_personal(
            websocket,
            {"type": "connected", "session_id": session_id},
        )

        while True:
            # Wait for client messages
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "execute":
                command = message.get("command", "").strip()
                if not command:
                    continue

                try:
                    # Execute command with timeout
                    result = subprocess.run(
                        command,
                        shell=True,
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )

                    # Send output
                    if result.stdout:
                        await manager.send_personal(
                            websocket,
                            {"type": "output", "data": result.stdout},
                        )
                    if result.stderr:
                        await manager.send_personal(
                            websocket,
                            {"type": "output", "data": f"\x1b[31m{result.stderr}\x1b[0m"},
                        )

                    # Send exit status
                    await manager.send_personal(
                        websocket,
                        {"type": "exit", "exit_code": result.returncode},
                    )
                except subprocess.TimeoutExpired:
                    await manager.send_personal(
                        websocket,
                        {"type": "error", "message": "Command timeout (30s)"},
                    )
                except Exception as e:
                    await manager.send_personal(
                        websocket,
                        {"type": "error", "message": str(e)},
                    )

            elif message.get("type") == "ping":
                await manager.send_personal(
                    websocket,
                    {"type": "pong"},
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
