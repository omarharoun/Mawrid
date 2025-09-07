"""
Vercel serverless function entry point
"""
import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Mawrid Search Engine",
    version="1.0.0",
    description="AI-powered search engine with OpenAI integration"
)

# Setup templates
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with search interface"""
    try:
        return templates.TemplateResponse("simple.html", {"request": request})
    except Exception as e:
        logger.error(f"Error rendering home page: {e}")
        return HTMLResponse("""
        <html>
            <head><title>Mawrid Search Engine</title></head>
            <body>
                <h1>Mawrid Search Engine</h1>
                <p>AI-powered search engine is starting up...</p>
                <p>Please try again in a moment.</p>
            </body>
        </html>
        """)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": "Mawrid Search Engine",
        "version": "1.0.0",
        "platform": "vercel"
    }


@app.get("/api/search/")
async def search(query: str, limit: int = 5):
    """Simple search endpoint for Vercel"""
    try:
        # Simple response for now
        return {
            "query": query,
            "results": [
                {
                    "title": f"Search result for: {query}",
                    "url": "https://example.com",
                    "snippet": f"This is a sample result for your search: {query}",
                    "score": 1.0,
                    "domain": "example.com"
                }
            ],
            "total_results": 1,
            "processing_time": 0.1,
            "ai_summary": f"Here's what I found about {query}. This is a demo response from the Mawrid Search Engine.",
            "suggestions": [f"{query} tutorial", f"{query} examples", f"{query} guide"]
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        return {
            "error": str(e),
            "query": query,
            "results": [],
            "total_results": 0,
            "processing_time": 0,
            "ai_summary": "Search temporarily unavailable. Please try again."
        }


# This is the entry point for Vercel
handler = app
