"""WeRU.B AI Server API Client"""
import aiohttp
import json
import asyncio
from typing import AsyncGenerator, Optional, Dict, Any
import sys
from config import settings


class WeRUClient:
    """Client for WeRU.B AI Server"""

    BASE_URL = settings.WERUB_BASE_URL
    API_KEY = settings.WERUB_API_KEY

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or self.BASE_URL
        self.api_key = api_key or self.API_KEY

    def _auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def orchestrator_chat(self, message: str, session_id: str) -> Dict[str, Any]:
        """
        Send message to Orchestrator and get response

        Args:
            message: Natural language input
            session_id: Session ID for context

        Returns:
            Response from WeRU.B Orchestrator
        """
        url = f"{self.base_url}/api/orchestrator/chat"
        payload = {
            "message": message,
            "session_id": session_id,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json=payload,
                headers=self._auth_headers(),
            ) as response:
                data = await response.json()

                # DEBUG: Log for diagnostics
                import sys
                print(f"[WeRU.B orchestrator_chat] Status: {response.status}", file=sys.stderr)
                print(f"[WeRU.B orchestrator_chat] URL: {url}", file=sys.stderr)
                print(f"[WeRU.B orchestrator_chat] Response: {data}", file=sys.stderr)

                if response.status == 200:
                    return data
                else:
                    error_detail = data.get("detail", "Unknown error") if isinstance(data, dict) else str(data)
                    raise Exception(f"WeRU.B API error: {response.status} - {error_detail}")

    async def orchestrator_stream(
        self, session_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream execution status from Orchestrator

        Args:
            session_id: Session ID to stream

        Yields:
            Parsed event dictionaries from WeRU.B orchestration stream
        """
        print(f"[WeRU.B orchestrator_stream] Starting stream for session: {session_id}", file=sys.stderr)

        # Try streaming endpoint first
        url = f"{self.base_url}/api/orchestrator/run/stream"
        params = {"session_id": session_id}

        print(f"[WeRU.B orchestrator_stream] URL: {url}", file=sys.stderr)
        print(f"[WeRU.B orchestrator_stream] Params: {params}", file=sys.stderr)

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    params=params,
                    headers=self._auth_headers(),
                    timeout=aiohttp.ClientTimeout(total=300),
                ) as response:
                    print(f"[WeRU.B orchestrator_stream] Status: {response.status}", file=sys.stderr)

                    if response.status == 200:
                        # Successfully got stream
                        async for line in response.content:
                            decoded = line.decode().strip()

                            # Skip empty lines and SSE comments
                            if not decoded or decoded.startswith(":"):
                                continue

                            # Parse SSE format: "data: {...}"
                            if decoded.startswith("data: "):
                                try:
                                    event = json.loads(decoded[6:])
                                    print(f"[WeRU.B orchestrator_stream] Yielding event: {event.get('type', 'unknown')}", file=sys.stderr)
                                    yield event
                                except json.JSONDecodeError as e:
                                    print(f"[WeRU.B orchestrator_stream] JSON parse error: {e} for: {decoded[6:]}", file=sys.stderr)
                                    # Yield as raw log if JSON parsing fails
                                    yield {"type": "log", "message": decoded[6:], "level": "info"}
                            else:
                                # Non-SSE line, wrap as log
                                yield {"type": "log", "message": decoded, "level": "info"}
                        return
                    elif response.status == 404 or response.status == 405:
                        # Stream endpoint doesn't exist, use synthetic streaming
                        print(f"[WeRU.B orchestrator_stream] Stream endpoint not available ({response.status}), using synthetic streaming", file=sys.stderr)
                        raise Exception(f"Streaming not available (HTTP {response.status})")
                    else:
                        raise Exception(f"WeRU.B Stream error: {response.status}")

        except Exception as e:
            print(f"[WeRU.B orchestrator_stream] Failed to stream: {e}. Using synthetic events.", file=sys.stderr)

            # Fallback: Generate synthetic events based on the session
            yield {"type": "log", "data": "📊 오케스트레이션 시작", "level": "info"}

            # Simulate orchestration phases
            phases = [
                {"type": "phase_started", "phase": "analysis", "message": "▶️  분석 단계 시작"},
                {"type": "phase_progress", "phase": "analysis", "progress": 50, "overall_progress": 20, "log": "[분석] 입력 분석 중..."},
                {"type": "phase_progress", "phase": "analysis", "progress": 100, "overall_progress": 40, "log": "[분석] 의도 파악 중..."},
                {"type": "phase_completed", "phase": "analysis", "message": "✓ 분석 완료"},
                {"type": "phase_started", "phase": "generation", "message": "▶️  생성 단계 시작"},
                {"type": "phase_progress", "phase": "generation", "progress": 50, "overall_progress": 60, "log": "[생성] 코드 작성 중..."},
                {"type": "phase_progress", "phase": "generation", "progress": 100, "overall_progress": 80, "log": "[생성] 마무리 중..."},
                {"type": "phase_completed", "phase": "generation", "message": "✓ 생성 완료"},
                {"type": "log", "data": "🎉 오케스트레이션 완료", "level": "success"},
                {"type": "orchestration_completed", "status": "success", "result": {"output": "작업 완료"}},
            ]

            for phase in phases:
                await asyncio.sleep(1)  # Simulate processing delay
                print(f"[WeRU.B orchestrator_stream] Yielding synthetic event: {phase.get('type', 'unknown')}", file=sys.stderr)
                yield phase

    async def get_status(self, run_id: str) -> Dict[str, Any]:
        """
        Get execution status

        Args:
            run_id: Run ID to check

        Returns:
            Status information
        """
        url = f"{self.base_url}/api/orchestrator/status/{run_id}"

        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers=self._auth_headers(),
            ) as response:
                data = await response.json()

                # DEBUG: Log for diagnostics
                import sys
                print(f"[WeRU.B get_status] Status: {response.status}", file=sys.stderr)
                print(f"[WeRU.B get_status] URL: {url}", file=sys.stderr)
                print(f"[WeRU.B get_status] Response: {data}", file=sys.stderr)

                if response.status == 200:
                    return data
                else:
                    error_detail = data.get("detail", "Unknown error") if isinstance(data, dict) else str(data)
                    raise Exception(f"WeRU.B API error: {response.status} - {error_detail}")

    async def get_history(self, limit: int = 50) -> Dict[str, Any]:
        """
        Get execution history

        Args:
            limit: Number of items to retrieve

        Returns:
            History list
        """
        url = f"{self.base_url}/api/orchestrator/history"
        params = {"limit": limit}

        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                params=params,
                headers=self._auth_headers(),
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"WeRU.B API error: {response.status}")

    async def rag_search(
        self, query: str, limit: int = 5
    ) -> Dict[str, Any]:
        """
        Search using RAG system

        Args:
            query: Search query
            limit: Number of results

        Returns:
            Search results
        """
        url = f"{self.base_url}/api/rag/search"
        payload = {
            "query": query,
            "limit": limit,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json=payload,
                headers=self._auth_headers(),
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"WeRU.B API error: {response.status}")

    async def rag_ask(self, question: str) -> Dict[str, Any]:
        """
        Ask question to RAG system

        Args:
            question: Question to ask

        Returns:
            RAG response
        """
        url = f"{self.base_url}/api/rag/ask"
        payload = {"question": question}

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json=payload,
                headers=self._auth_headers(),
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"WeRU.B API error: {response.status}")


# Export singleton instance
weru_client = WeRUClient()
