"""
Web crawler service for collecting data
"""
import asyncio
import aiohttp
import time
from typing import List, Set, Optional
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from app.core.config import settings
from app.models.search import WebPage
import logging

logger = logging.getLogger(__name__)


class WebCrawler:
    """Web crawler for collecting web pages"""
    
    def __init__(self):
        self.visited_urls: Set[str] = set()
        self.crawl_delay = settings.crawl_delay
        self.max_depth = settings.max_crawl_depth
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'Mawrid Search Engine Bot 1.0'
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def crawl_url(self, url: str, depth: int = 0) -> Optional[WebPage]:
        """Crawl a single URL and return WebPage object"""
        if depth > self.max_depth or url in self.visited_urls:
            return None
        
        try:
            self.visited_urls.add(url)
            
            async with self.session.get(url) as response:
                if response.status != 200:
                    return None
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract content
                title = self._extract_title(soup)
                content = self._extract_content(soup)
                links = self._extract_links(soup, url)
                
                # Create WebPage object
                webpage = WebPage(
                    url=url,
                    title=title,
                    content=content,
                    html=html,
                    metadata={
                        'status_code': response.status,
                        'content_type': response.headers.get('content-type', ''),
                        'content_length': len(html),
                        'crawl_depth': depth
                    },
                    crawled_at=time.time(),
                    domain=urlparse(url).netloc,
                    links=links
                )
                
                logger.info(f"Crawled: {url} (depth: {depth})")
                return webpage
                
        except Exception as e:
            logger.error(f"Error crawling {url}: {e}")
            return None
    
    async def crawl_multiple_urls(self, urls: List[str], max_concurrent: int = 10) -> List[WebPage]:
        """Crawl multiple URLs concurrently"""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def crawl_with_semaphore(url):
            async with semaphore:
                await asyncio.sleep(self.crawl_delay)  # Rate limiting
                return await self.crawl_url(url)
        
        tasks = [crawl_with_semaphore(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out None results and exceptions
        webpages = [result for result in results if isinstance(result, WebPage)]
        return webpages
    
    async def discover_urls(self, seed_urls: List[str], max_urls: int = 1000) -> List[str]:
        """Discover URLs by crawling from seed URLs"""
        discovered_urls = set(seed_urls)
        urls_to_crawl = list(seed_urls)
        
        while urls_to_crawl and len(discovered_urls) < max_urls:
            current_batch = urls_to_crawl[:50]  # Process in batches
            urls_to_crawl = urls_to_crawl[50:]
            
            webpages = await self.crawl_multiple_urls(current_batch)
            
            for webpage in webpages:
                if webpage:
                    # Add new links to discovery queue
                    for link in webpage.links:
                        if link not in discovered_urls and len(discovered_urls) < max_urls:
                            discovered_urls.add(link)
                            urls_to_crawl.append(link)
        
        return list(discovered_urls)
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title"""
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text().strip()
        
        h1_tag = soup.find('h1')
        if h1_tag:
            return h1_tag.get_text().strip()
        
        return "Untitled"
    
    def _extract_content(self, soup: BeautifulSoup) -> str:
        """Extract main content from page"""
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text[:5000]  # Limit content length
    
    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract links from page"""
        links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            absolute_url = urljoin(base_url, href)
            
            # Filter out non-http links and fragments
            if absolute_url.startswith(('http://', 'https://')):
                links.append(absolute_url)
        
        return links[:50]  # Limit number of links

