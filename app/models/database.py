"""
Database models and setup
"""
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.core.config import settings

# Database setup
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class WebPageModel(Base):
    """Database model for web pages"""
    __tablename__ = "web_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(String)
    content = Column(Text)
    html = Column(Text)
    domain = Column(String, index=True)
    crawled_at = Column(DateTime, default=datetime.utcnow)
    content_length = Column(Integer)
    status_code = Column(Integer)
    metadata = Column(Text)  # JSON string


class SearchQueryModel(Base):
    """Database model for search queries"""
    __tablename__ = "search_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    results_count = Column(Integer)
    processing_time = Column(Float)
    user_agent = Column(String)


class SearchResultModel(Base):
    """Database model for search results"""
    __tablename__ = "search_results"
    
    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, index=True)
    url = Column(String)
    title = Column(String)
    snippet = Column(Text)
    score = Column(Float)
    rank = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)


class TrainingDataModel(Base):
    """Database model for training data"""
    __tablename__ = "training_data"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String)
    answer = Column(Text)
    source_url = Column(String)
    quality_score = Column(Float)
    category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_used_for_training = Column(Boolean, default=False)


# Create all tables
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


# Database dependency
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
