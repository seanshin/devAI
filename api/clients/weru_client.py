"""WeRU.B AI Server API Client"""
import aiohttp
import json
from typing import AsyncGenerator, Optional, Dict, Any
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
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"WeRU.B API error: {response.status}")

    async def orchestrator_stream(
        self, session_id: str
    ) -> AsyncGenerator[str, None]:
        """
        Stream execution status from Orchestrator

        Args:
            session_id: Session ID to stream

        Yields:
            Server-Sent Events from WeRU.B
        """
        url = f"{self.base_url}/api/orchestrator/run/stream"
        params = {"session_id": session_id}

        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                params=params,
                headers=self._auth_headers(),
            ) as response:
                if response.status == 200:
                    async for line in response.content:
                        if line:
                            yield line.decode().strip()
                else:
                    raise Exception(f"WeRU.B API error: {response.status}")

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
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"WeRU.B API error: {response.status}")

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
