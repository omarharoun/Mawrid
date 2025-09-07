"""
Database service for managing data persistence
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.models.database import (
    WebPageModel, SearchQueryModel, SearchResultModel, 
    TrainingDataModel, get_db
)
from app.models.search import WebPage, SearchQuery, SearchResult
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)


class DatabaseService:
    """Service for database operations"""
    
    def __init__(self):
        self.db = next(get_db())
    
    def save_webpage(self, webpage: WebPage) -> bool:
        """Save a webpage to the database"""
        try:
            # Check if webpage already exists
            existing = self.db.query(WebPageModel).filter(WebPageModel.url == webpage.url).first()
            
            if existing:
                # Update existing record
                existing.title = webpage.title
                existing.content = webpage.content
                existing.html = webpage.html
                existing.domain = webpage.domain
                existing.crawled_at = datetime.fromtimestamp(webpage.crawled_at)
                existing.content_length = len(webpage.content)
                existing.status_code = webpage.metadata.get('status_code')
                existing.metadata = json.dumps(webpage.metadata)
            else:
                # Create new record
                db_webpage = WebPageModel(
                    url=webpage.url,
                    title=webpage.title,
                    content=webpage.content,
                    html=webpage.html,
                    domain=webpage.domain,
                    crawled_at=datetime.fromtimestamp(webpage.crawled_at),
                    content_length=len(webpage.content),
                    status_code=webpage.metadata.get('status_code'),
                    metadata=json.dumps(webpage.metadata)
                )
                self.db.add(db_webpage)
            
            self.db.commit()
            logger.info(f"Saved webpage: {webpage.url}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving webpage {webpage.url}: {e}")
            self.db.rollback()
            return False
    
    def get_webpage(self, url: str) -> Optional[WebPage]:
        """Get a webpage from the database"""
        try:
            db_webpage = self.db.query(WebPageModel).filter(WebPageModel.url == url).first()
            
            if db_webpage:
                return WebPage(
                    url=db_webpage.url,
                    title=db_webpage.title,
                    content=db_webpage.content,
                    html=db_webpage.html,
                    metadata=json.loads(db_webpage.metadata) if db_webpage.metadata else {},
                    crawled_at=db_webpage.crawled_at.timestamp(),
                    domain=db_webpage.domain,
                    links=[]
                )
            return None
            
        except Exception as e:
            logger.error(f"Error getting webpage {url}: {e}")
            return None
    
    def search_webpages(self, query: str, limit: int = 20) -> List[WebPage]:
        """Search webpages in the database"""
        try:
            # Simple text search - in production, use full-text search
            db_webpages = self.db.query(WebPageModel).filter(
                WebPageModel.content.contains(query) | 
                WebPageModel.title.contains(query)
            ).limit(limit).all()
            
            webpages = []
            for db_webpage in db_webpages:
                webpage = WebPage(
                    url=db_webpage.url,
                    title=db_webpage.title,
                    content=db_webpage.content,
                    html=db_webpage.html,
                    metadata=json.loads(db_webpage.metadata) if db_webpage.metadata else {},
                    crawled_at=db_webpage.crawled_at.timestamp(),
                    domain=db_webpage.domain,
                    links=[]
                )
                webpages.append(webpage)
            
            return webpages
            
        except Exception as e:
            logger.error(f"Error searching webpages: {e}")
            return []
    
    def save_search_query(self, query: SearchQuery, results_count: int, processing_time: float) -> int:
        """Save a search query to the database"""
        try:
            db_query = SearchQueryModel(
                query=query.query,
                results_count=results_count,
                processing_time=processing_time,
                user_agent="Mawrid Search Engine"
            )
            self.db.add(db_query)
            self.db.commit()
            
            logger.info(f"Saved search query: {query.query}")
            return db_query.id
            
        except Exception as e:
            logger.error(f"Error saving search query: {e}")
            self.db.rollback()
            return -1
    
    def save_search_results(self, query_id: int, results: List[SearchResult]) -> bool:
        """Save search results to the database"""
        try:
            for rank, result in enumerate(results, 1):
                db_result = SearchResultModel(
                    query_id=query_id,
                    url=result.url,
                    title=result.title,
                    snippet=result.snippet,
                    score=result.score,
                    rank=rank
                )
                self.db.add(db_result)
            
            self.db.commit()
            logger.info(f"Saved {len(results)} search results for query {query_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving search results: {e}")
            self.db.rollback()
            return False
    
    def save_training_data(self, query: str, answer: str, source_url: str = None, 
                          quality_score: float = 1.0, category: str = "general") -> bool:
        """Save training data to the database"""
        try:
            db_training = TrainingDataModel(
                query=query,
                answer=answer,
                source_url=source_url,
                quality_score=quality_score,
                category=category
            )
            self.db.add(db_training)
            self.db.commit()
            
            logger.info(f"Saved training data: {query[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"Error saving training data: {e}")
            self.db.rollback()
            return False
    
    def get_training_data(self, category: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get training data from the database"""
        try:
            query = self.db.query(TrainingDataModel)
            
            if category:
                query = query.filter(TrainingDataModel.category == category)
            
            db_training = query.limit(limit).all()
            
            training_data = []
            for item in db_training:
                training_data.append({
                    "id": item.id,
                    "query": item.query,
                    "answer": item.answer,
                    "source_url": item.source_url,
                    "quality_score": item.quality_score,
                    "category": item.category,
                    "created_at": item.created_at.isoformat()
                })
            
            return training_data
            
        except Exception as e:
            logger.error(f"Error getting training data: {e}")
            return []
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            stats = {
                "total_webpages": self.db.query(WebPageModel).count(),
                "total_queries": self.db.query(SearchQueryModel).count(),
                "total_results": self.db.query(SearchResultModel).count(),
                "total_training_data": self.db.query(TrainingDataModel).count(),
                "domains": self.db.query(WebPageModel.domain).distinct().count()
            }
            return stats
            
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {}
    
    def cleanup_old_data(self, days: int = 30) -> int:
        """Clean up old data"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Clean up old search queries and results
            old_queries = self.db.query(SearchQueryModel).filter(
                SearchQueryModel.timestamp < cutoff_date
            ).all()
            
            deleted_count = 0
            for query in old_queries:
                # Delete associated results
                self.db.query(SearchResultModel).filter(
                    SearchResultModel.query_id == query.id
                ).delete()
                
                # Delete the query
                self.db.delete(query)
                deleted_count += 1
            
            self.db.commit()
            logger.info(f"Cleaned up {deleted_count} old queries and their results")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            self.db.rollback()
            return 0
