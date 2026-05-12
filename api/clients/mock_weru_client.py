"""Mock WeRU.B client for development and testing without external API dependency"""
import uuid
import asyncio
from typing import Dict, Any, AsyncGenerator


class MockWeRUClient:
    """Mock client that simulates WeRU.B API responses for testing"""

    async def orchestrator_chat(self, message: str, session_id: str) -> Dict[str, Any]:
        """
        Simulate orchestrator_chat response

        Args:
            message: User input
            session_id: Session ID

        Returns:
            Mock response with run_id
        """
        run_id = f"mock-{uuid.uuid4()}"
        print(f"[MockWeRU.B] orchestrator_chat: message='{message}' session='{session_id}' → run_id='{run_id}'")

        return {
            "run_id": run_id,
            "session_id": session_id,
            "status": "running",
            "message": f"Processing: {message}",
            "phases": ["analysis", "execution", "validation"],
        }

    async def orchestrator_stream(self, session_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Simulate SSE stream of execution updates

        Args:
            session_id: Session ID to stream

        Yields:
            Mock event objects
        """
        print(f"[MockWeRU.B] orchestrator_stream: session='{session_id}' starting")

        # Simulate streaming progress with delays
        stages = [
            {
                "type": "phase_started",
                "phase": "analysis",
                "message": "분석 단계 시작",
                "timestamp": "2026-05-12T10:00:00Z",
            },
            {
                "type": "phase_progress",
                "phase": "analysis",
                "progress": 33,
                "overall_progress": 10,
                "log": "[분석] 입력 파싱 중...",
                "timestamp": "2026-05-12T10:00:01Z",
            },
            {
                "type": "phase_progress",
                "phase": "analysis",
                "progress": 66,
                "overall_progress": 20,
                "log": "[분석] 의도 분석 중...",
                "timestamp": "2026-05-12T10:00:02Z",
            },
            {
                "type": "phase_completed",
                "phase": "analysis",
                "message": "분석 완료",
                "timestamp": "2026-05-12T10:00:03Z",
            },
            {
                "type": "phase_started",
                "phase": "execution",
                "message": "실행 단계 시작",
                "timestamp": "2026-05-12T10:00:04Z",
            },
            {
                "type": "phase_progress",
                "phase": "execution",
                "progress": 33,
                "overall_progress": 50,
                "log": "[실행] 작업 A 진행 중...",
                "timestamp": "2026-05-12T10:00:05Z",
            },
            {
                "type": "phase_progress",
                "phase": "execution",
                "progress": 66,
                "overall_progress": 75,
                "log": "[실행] 작업 B 진행 중...",
                "timestamp": "2026-05-12T10:00:06Z",
            },
            {
                "type": "phase_completed",
                "phase": "execution",
                "message": "실행 완료",
                "timestamp": "2026-05-12T10:00:07Z",
            },
            {
                "type": "orchestration_completed",
                "status": "success",
                "message": "워크플로우 완료",
                "result": {
                    "output": "작업이 성공적으로 완료되었습니다.",
                    "duration": "8초",
                },
                "timestamp": "2026-05-12T10:00:08Z",
            },
        ]

        for stage in stages:
            print(f"[MockWeRU.B] Yielding event: {stage['type']}")
            yield stage
            await asyncio.sleep(1)  # Simulate processing delay

        print("[MockWeRU.B] orchestrator_stream: completed")

    async def get_status(self, run_id: str) -> Dict[str, Any]:
        """
        Simulate status check

        Args:
            run_id: Run ID to check

        Returns:
            Mock status response
        """
        print(f"[MockWeRU.B] get_status: run_id='{run_id}'")

        return {
            "run_id": run_id,
            "status": "running",
            "progress": 50,
            "current_phase": "execution",
            "current_log": "[실행] 작업 진행 중...",
            "elapsed_time": "3초",
        }

    async def get_history(self, limit: int = 50) -> Dict[str, Any]:
        """
        Simulate history retrieval

        Args:
            limit: Number of items to retrieve

        Returns:
            Mock history response
        """
        print(f"[MockWeRU.B] get_history: limit={limit}")

        return {
            "history": [
                {
                    "run_id": f"mock-{uuid.uuid4()}",
                    "status": "completed",
                    "input": f"샘플 작업 {i}",
                    "created_at": "2026-05-12T09:00:00Z",
                }
                for i in range(min(limit, 10))
            ],
            "total": 42,
        }

    async def rag_search(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """
        Simulate RAG search

        Args:
            query: Search query
            limit: Number of results

        Returns:
            Mock search results
        """
        print(f"[MockWeRU.B] rag_search: query='{query}' limit={limit}")

        return {
            "query": query,
            "results": [
                {
                    "id": f"result-{i}",
                    "text": f"검색 결과 {i}: {query}와 관련된 문서",
                    "score": 0.95 - (i * 0.1),
                    "source": f"document-{i}.txt",
                }
                for i in range(limit)
            ],
        }

    async def rag_ask(self, question: str) -> Dict[str, Any]:
        """
        Simulate RAG ask (question answering)

        Args:
            question: Question to ask

        Returns:
            Mock answer response
        """
        print(f"[MockWeRU.B] rag_ask: question='{question}'")

        return {
            "question": question,
            "answer": f"다음은 '{question}'에 대한 답변입니다: 이것은 시뮬레이션된 답변입니다. 실제 WeRU.B API를 사용하면 더 정확한 답변을 받을 수 있습니다.",
            "sources": ["document-1.txt", "document-2.txt"],
            "confidence": 0.87,
        }
