#!/usr/bin/env python3
"""
Test script for Mawrid Search Engine
"""
import asyncio
import aiohttp
import json
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SearchEngineTester:
    """Test the search engine functionality"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_health_check(self) -> bool:
        """Test health check endpoint"""
        try:
            async with self.session.get(f"{self.base_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Health check passed: {data}")
                    return True
                else:
                    logger.error(f"Health check failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Health check error: {e}")
            return False
    
    async def test_search(self, query: str) -> Dict[str, Any]:
        """Test search functionality"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/search/",
                params={"query": query, "limit": 5}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Search test passed for query: '{query}'")
                    logger.info(f"Results: {len(data.get('results', []))} found")
                    return data
                else:
                    logger.error(f"Search test failed: {response.status}")
                    return {}
        except Exception as e:
            logger.error(f"Search test error: {e}")
            return {}
    
    async def test_suggestions(self, query: str) -> bool:
        """Test suggestions endpoint"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/search/suggestions",
                params={"query": query}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Suggestions test passed: {len(data.get('suggestions', []))} suggestions")
                    return True
                else:
                    logger.error(f"Suggestions test failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Suggestions test error: {e}")
            return False
    
    async def test_index_url(self, url: str) -> bool:
        """Test URL indexing"""
        try:
            async with self.session.post(
                f"{self.base_url}/api/search/index",
                params={"url": url}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Index test passed for URL: {url}")
                    return True
                else:
                    logger.error(f"Index test failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Index test error: {e}")
            return False
    
    async def test_stats(self) -> bool:
        """Test stats endpoint"""
        try:
            async with self.session.get(f"{self.base_url}/api/search/stats") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Stats test passed: {data}")
                    return True
                else:
                    logger.error(f"Stats test failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Stats test error: {e}")
            return False
    
    async def test_fine_tuning_endpoints(self) -> bool:
        """Test fine-tuning endpoints"""
        try:
            # Test getting training data
            async with self.session.get(f"{self.base_url}/api/fine-tuning/training-data") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Fine-tuning training data test passed: {data.get('count', 0)} records")
                else:
                    logger.warning(f"Fine-tuning training data test failed: {response.status}")
            
            # Test getting fine-tuning jobs
            async with self.session.get(f"{self.base_url}/api/fine-tuning/jobs") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Fine-tuning jobs test passed: {len(data.get('jobs', []))} jobs")
                else:
                    logger.warning(f"Fine-tuning jobs test failed: {response.status}")
            
            return True
            
        except Exception as e:
            logger.error(f"Fine-tuning test error: {e}")
            return False
    
    async def run_comprehensive_test(self) -> Dict[str, bool]:
        """Run comprehensive tests"""
        logger.info("Starting comprehensive search engine tests...")
        
        results = {}
        
        # Test health check
        results["health_check"] = await self.test_health_check()
        
        # Test search functionality
        test_queries = [
            "artificial intelligence",
            "python programming",
            "machine learning"
        ]
        
        search_results = []
        for query in test_queries:
            result = await self.test_search(query)
            search_results.append(len(result.get('results', [])) > 0)
        
        results["search"] = any(search_results)
        
        # Test suggestions
        results["suggestions"] = await self.test_suggestions("python")
        
        # Test URL indexing
        test_urls = [
            "https://en.wikipedia.org/wiki/Artificial_intelligence",
            "https://www.python.org/"
        ]
        
        index_results = []
        for url in test_urls:
            index_results.append(await self.test_index_url(url))
        
        results["indexing"] = any(index_results)
        
        # Test stats
        results["stats"] = await self.test_stats()
        
        # Test fine-tuning endpoints
        results["fine_tuning"] = await self.test_fine_tuning_endpoints()
        
        return results


async def main():
    """Main test function"""
    async with SearchEngineTester() as tester:
        results = await tester.run_comprehensive_test()
        
        logger.info("\n" + "="*50)
        logger.info("TEST RESULTS SUMMARY")
        logger.info("="*50)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "PASS" if result else "FAIL"
            logger.info(f"{test_name.upper()}: {status}")
            if result:
                passed += 1
        
        logger.info("="*50)
        logger.info(f"OVERALL: {passed}/{total} tests passed")
        
        if passed == total:
            logger.info("🎉 All tests passed! Search engine is working correctly.")
        else:
            logger.warning(f"⚠️  {total - passed} tests failed. Check the logs above.")


if __name__ == "__main__":
    asyncio.run(main())
