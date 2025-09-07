"""
Vercel-compatible database configuration
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Check if running on Vercel
def is_vercel():
    return os.environ.get("VERCEL") == "1"

# Database configuration for Vercel
if is_vercel():
    # For Vercel, use in-memory SQLite (data will be lost between requests)
    # In production, you should use an external database
    DATABASE_URL = "sqlite:///:memory:"
    
    # Alternative: Use external database services
    # DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///:memory:")
    
    # For production, consider these options:
    # - PostgreSQL: "postgresql://user:pass@host:port/db"
    # - MySQL: "mysql://user:pass@host:port/db"
    # - PlanetScale: "mysql://user:pass@host:port/db"
    # - Supabase: "postgresql://user:pass@host:port/db"
    # - Neon: "postgresql://user:pass@host:port/db"
else:
    # Local development
    DATABASE_URL = "sqlite:///./mawrid_search.db"

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class
Base = declarative_base()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create database tables"""
    Base.metadata.create_all(bind=engine)
