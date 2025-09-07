"""
Vercel-compatible search engine service
"""
import time
import asyncio
from typing import List, Dict, Any, Optional
from app.models.search import SearchQuery, SearchResult, SearchResponse, WebPage
from app.services.openai_service import OpenAIService
from app.services.web_crawler import WebCrawler
import logging

logger = logging.getLogger(__name__)


class VercelSearchEngine:
    """Vercel-compatible search engine service (no persistent storage)"""
    
    def __init__(self):
        self.openai_service = OpenAIService()
        self.web_crawler = WebCrawler()
        # In-memory storage (lost between requests)
        self.indexed_pages: Dict[str, WebPage] = {}
        self.search_history: List[SearchQuery] = []
    
    async def search(self, query: SearchQuery) -> SearchResponse:
        """Perform search with AI enhancement (Vercel-compatible)"""
        start_time = time.time()
        
        try:
            # Step 1: Search indexed content (in-memory)
            indexed_results = await self._search_indexed_content(query)
            
            # Step 2: If insufficient results, crawl new content
            if len(indexed_results) < 3:  # Reduced threshold for Vercel
                new_results = await self._crawl_and_search(query)
                indexed_results.extend(new_results)
            
            # Step 3: Rank and filter results
            ranked_results = await self._rank_results(query.query, indexed_results)
            
            # Step 4: Generate AI summary and suggestions
            ai_summary = await self.openai_service.generate_search_summary(
                query.query, ranked_results[:3]  # Reduced for Vercel
            )
            
            suggestions = await self.openai_service.generate_suggestions(query.query)
            
            # Step 5: Create response
            processing_time = time.time() - start_time
            
            response = SearchResponse(
                query=query.query,
                results=ranked_results[:query.limit],
                total_results=len(ranked_results),
                processing_time=processing_time,
                ai_summary=ai_summary,
                suggestions=suggestions
            )
            
            # Store search in history (in-memory)
            self.search_history.append(query)
            
            logger.info(f"Search completed: '{query.query}' - {len(ranked_results)} results in {processing_time:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return SearchResponse(
                query=query.query,
                results=[],
                total_results=0,
                processing_time=time.time() - start_time,
                ai_summary="Search encountered an error. Please try again."
            )
    
    async def _search_indexed_content(self, query: SearchQuery) -> List[SearchResult]:
        """Search through indexed content (in-memory)"""
        results = []
        query_terms = query.query.lower().split()
        
        for url, webpage in self.indexed_pages.items():
            # Simple text matching
            content_lower = webpage.content.lower()
            title_lower = webpage.title.lower()
            
            # Calculate relevance score
            score = 0
            for term in query_terms:
                if term in title_lower:
                    score += 3
                if term in content_lower:
                    score += 1
            
            if score > 0:
                # Create snippet
                snippet = self._create_snippet(webpage.content, query.query)
                
                result = SearchResult(
                    title=webpage.title,
                    url=webpage.url,
                    snippet=snippet,
                    content=webpage.content[:500],
                    score=score,
                    timestamp=webpage.crawled_at,
                    domain=webpage.domain,
                    metadata=webpage.metadata
                )
                results.append(result)
        
        return results
    
    async def _crawl_and_search(self, query: SearchQuery) -> List[SearchResult]:
        """Crawl new content based on search query (limited for Vercel)"""
        try:
            # Generate search URLs based on query
            search_urls = self._generate_search_urls(query.query)
            
            # Crawl the URLs (limited for Vercel)
            async with self.web_crawler as crawler:
                webpages = await crawler.crawl_multiple_urls(search_urls[:3])  # Reduced for Vercel
            
            # Index the new pages (in-memory)
            for webpage in webpages:
                if webpage:
                    self.indexed_pages[webpage.url] = webpage
            
            # Search the new content
            return await self._search_indexed_content(query)
            
        except Exception as e:
            logger.error(f"Error crawling for search: {e}")
            return []
    
    async def _rank_results(self, query: str, results: List[SearchResult]) -> List[SearchResult]:
        """Rank search results by relevance"""
        def ranking_key(result: SearchResult) -> float:
            return result.score
        
        # Sort by ranking score
        ranked = sorted(results, key=ranking_key, reverse=True)
        return ranked
    
    def _create_snippet(self, content: str, query: str) -> str:
        """Create a snippet highlighting query terms"""
        query_terms = query.lower().split()
        content_lower = content.lower()
        
        # Find the first occurrence of any query term
        best_position = len(content)
        for term in query_terms:
            pos = content_lower.find(term)
            if pos != -1 and pos < best_position:
                best_position = pos
        
        # Extract snippet around the match
        start = max(0, best_position - 100)
        end = min(len(content), best_position + 200)
        snippet = content[start:end]
        
        # Add ellipsis if needed
        if start > 0:
            snippet = "..." + snippet
        if end < len(content):
            snippet = snippet + "..."
        
        return snippet.strip()
    
    def _generate_search_urls(self, query: str) -> List[str]:
        """Generate search URLs based on query"""
        base_urls = [
            f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}",
            f"https://www.britannica.com/search?query={query.replace(' ', '+')}",
            f"https://www.merriam-webster.com/dictionary/{query.replace(' ', '%20')}",
        ]
        return base_urls
    
    def get_index_stats(self) -> Dict[str, Any]:
        """Get indexing statistics (in-memory)"""
        return {
            "total_indexed_pages": len(self.indexed_pages),
            "total_searches": len(self.search_history),
            "domains": list(set(page.domain for page in self.indexed_pages.values())),
            "last_search": self.search_history[-1].query if self.search_history else None,
            "note": "Data is stored in-memory and will be lost between requests"
        }
