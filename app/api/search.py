"""
Search API endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.models.search import SearchQuery, SearchResponse
from app.services.search_engine import SearchEngine
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])

# Global search engine instance
search_engine = SearchEngine()


@router.post("/", response_model=SearchResponse)
async def search(
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    filters: Optional[dict] = None
):
    """
    Perform a search query with AI enhancement
    """
    try:
        search_query = SearchQuery(
            query=query,
            limit=limit,
            offset=offset,
            filters=filters
        )
        
        response = await search_engine.search(search_query)
        return response
        
    except Exception as e:
        logger.error(f"Search API error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


@router.get("/suggestions")
async def get_suggestions(
    query: str = Query(..., description="Query to get suggestions for")
):
    """
    Get search suggestions based on query
    """
    try:
        suggestions = await search_engine.openai_service.generate_suggestions(query)
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Suggestions API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get suggestions")


@router.post("/index")
async def index_url(
    url: str = Query(..., description="URL to index")
):
    """
    Index a specific URL
    """
    try:
        success = await search_engine.index_url(url)
        if success:
            return {"message": f"Successfully indexed {url}"}
        else:
            raise HTTPException(status_code=400, detail="Failed to index URL")
            
    except Exception as e:
        logger.error(f"Index API error: {e}")
        raise HTTPException(status_code=500, detail="Indexing failed")


@router.post("/bulk-index")
async def bulk_index(
    urls: List[str]
):
    """
    Bulk index multiple URLs
    """
    try:
        success_count = await search_engine.bulk_index(urls)
        return {
            "message": f"Indexed {success_count} out of {len(urls)} URLs",
            "success_count": success_count,
            "total_urls": len(urls)
        }
        
    except Exception as e:
        logger.error(f"Bulk index API error: {e}")
        raise HTTPException(status_code=500, detail="Bulk indexing failed")


@router.get("/stats")
async def get_stats():
    """
    Get search engine statistics
    """
    try:
        stats = search_engine.get_index_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Stats API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")

