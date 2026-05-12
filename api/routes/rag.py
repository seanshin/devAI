"""RAG System API routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from clients.weru_client import weru_client
from typing import Optional, List


router = APIRouter(prefix="/api/rag", tags=["rag"])


class RagSearchRequest(BaseModel):
    """Request to search using RAG"""
    query: str
    limit: Optional[int] = 5


class RagSearchResult(BaseModel):
    """RAG search result"""
    id: str
    content: str
    score: float
    metadata: Optional[dict] = None


class RagAskRequest(BaseModel):
    """Request to ask RAG"""
    question: str


@router.post("/search", response_model=List[RagSearchResult])
async def search(request: RagSearchRequest):
    """
    Search using RAG system

    Args:
        request: Search query and limit

    Returns:
        List of search results
    """
    try:
        result = await weru_client.rag_search(
            request.query,
            request.limit or 5,
        )

        # Transform result to match our model
        if isinstance(result, dict) and "results" in result:
            return result["results"]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask")
async def ask_question(request: RagAskRequest):
    """
    Ask question to RAG system

    Args:
        request: Question to ask

    Returns:
        RAG response
    """
    try:
        result = await weru_client.rag_ask(request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
