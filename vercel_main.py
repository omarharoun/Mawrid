"""
Vercel-compatible main application
"""
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from app.core.vercel_config import settings
from app.core.vercel_database import create_tables
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered search engine with OpenAI integration"
)

# Note: For Vercel deployment, we'll use simplified endpoints
# Full API routers are available in the main application

# Setup templates
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with search interface"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "platform": "vercel"
    }


@app.get("/api/search/")
async def search(
    query: str,
    limit: int = 5
):
    """Simple search endpoint for Vercel"""
    try:
        from app.services.vercel_search_engine import VercelSearchEngine
        from app.models.search import SearchQuery
        
        search_engine = VercelSearchEngine()
        search_query = SearchQuery(query=query, limit=limit)
        
        response = await search_engine.search(search_query)
        return response.dict()
        
    except Exception as e:
        return {
            "error": str(e),
            "query": query,
            "results": [],
            "total_results": 0,
            "processing_time": 0,
            "ai_summary": "Search temporarily unavailable. Please try again."
        }


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(f"Starting {settings.app_name} v{settings.app_version} on Vercel")
    
    # Create database tables (if using SQLite)
    try:
        create_tables()
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.warning(f"Database initialization skipped: {e}")
    
    logger.info("Search engine initialized and ready")


# For Vercel deployment
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "vercel_main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=False
    )
