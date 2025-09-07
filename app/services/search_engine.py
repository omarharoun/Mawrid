"""
Core search engine service
"""
import time
import asyncio
from typing import List, Dict, Any, Optional
from app.models.search import SearchQuery, SearchResult, SearchResponse, WebPage
from app.services.openai_service import OpenAIService
from app.services.web_crawler import WebCrawler
import logging

logger = logging.getLogger(__name__)


class SearchEngine:
    """Main search engine service"""
    
    def __init__(self):
        self.openai_service = OpenAIService()
        self.web_crawler = WebCrawler()
        self.indexed_pages: Dict[str, WebPage] = {}
        self.search_history: List[SearchQuery] = []
    
    async def search(self, query: SearchQuery) -> SearchResponse:
        """Perform search with AI enhancement"""
        start_time = time.time()
        
        try:
            # Step 1: Search indexed content
            indexed_results = await self._search_indexed_content(query)
            
            # Step 2: If insufficient results, crawl new content
            if len(indexed_results) < 5:
                new_results = await self._crawl_and_search(query)
                indexed_results.extend(new_results)
            
            # Step 3: Rank and filter results
            ranked_results = await self._rank_results(query.query, indexed_results)
            
            # Step 4: Generate AI summary and suggestions
            ai_summary = await self.openai_service.generate_search_summary(
                query.query, ranked_results[:5]
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
            
            # Store search in history
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
        """Search through indexed content"""
        results = []
        query_terms = query.query.lower().split()
        
        for url, webpage in self.indexed_pages.items():
            # Simple text matching for now
            content_lower = webpage.content.lower()
            title_lower = webpage.title.lower()
            
            # Calculate relevance score
            score = 0
            for term in query_terms:
                if term in title_lower:
                    score += 3  # Title matches are more important
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
        """Crawl new content based on search query"""
        try:
            # Generate search URLs based on query
            search_urls = self._generate_search_urls(query.query)
            
            # Crawl the URLs
            async with self.web_crawler as crawler:
                webpages = await crawler.crawl_multiple_urls(search_urls[:10])
            
            # Index the new pages
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
        # Simple ranking based on score and recency
        def ranking_key(result: SearchResult) -> float:
            # Combine score with recency factor
            recency_factor = 1.0  # Could implement time-based decay
            return result.score * recency_factor
        
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
        """Generate URLs to search based on query"""
        # This is a simplified version - in production, you'd use actual search APIs
        # or crawl from known good sources
        
        # Example: Generate some common URLs to crawl
        base_urls = [
            "https://en.wikipedia.org/wiki/" + query.replace(" ", "_"),
            "https://www.britannica.com/search?query=" + query.replace(" ", "+"),
            "https://www.merriam-webster.com/dictionary/" + query.replace(" ", "%20"),
        ]
        
        return base_urls
    
    async def index_url(self, url: str) -> bool:
        """Index a specific URL"""
        try:
            async with self.web_crawler as crawler:
                webpage = await crawler.crawl_url(url)
                if webpage:
                    self.indexed_pages[url] = webpage
                    logger.info(f"Indexed: {url}")
                    return True
            return False
        except Exception as e:
            logger.error(f"Error indexing {url}: {e}")
            return False
    
    async def bulk_index(self, urls: List[str]) -> int:
        """Bulk index multiple URLs"""
        success_count = 0
        for url in urls:
            if await self.index_url(url):
                success_count += 1
        return success_count
    
    def get_index_stats(self) -> Dict[str, Any]:
        """Get indexing statistics"""
        return {
            "total_indexed_pages": len(self.indexed_pages),
            "total_searches": len(self.search_history),
            "domains": list(set(page.domain for page in self.indexed_pages.values())),
            "last_search": self.search_history[-1].query if self.search_history else None
        }

