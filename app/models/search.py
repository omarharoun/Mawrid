"""
Search-related data models
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class SearchQuery(BaseModel):
    """Search query model"""
    query: str
    filters: Optional[Dict[str, Any]] = None
    limit: int = 20
    offset: int = 0


class SearchResult(BaseModel):
    """Individual search result model"""
    title: str
    url: str
    snippet: str
    content: Optional[str] = None
    score: float
    timestamp: datetime
    domain: str
    metadata: Optional[Dict[str, Any]] = None


class SearchResponse(BaseModel):
    """Search response model"""
    query: str
    results: List[SearchResult]
    total_results: int
    processing_time: float
    ai_summary: Optional[str] = None
    suggestions: Optional[List[str]] = None


class WebPage(BaseModel):
    """Web page model for indexing"""
    url: str
    title: str
    content: str
    html: str
    metadata: Dict[str, Any]
    crawled_at: datetime
    domain: str
    links: List[str] = []


class AIResponse(BaseModel):
    """AI-generated response model"""
    summary: str
    answer: str
    sources: List[str]
    confidence: float
    reasoning: Optional[str] = None

