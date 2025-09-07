#!/usr/bin/env python3
"""
Startup script for Mawrid Search Engine
"""
import os
import sys
import asyncio
import logging
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.models.database import create_tables
from app.utils.data_collector import DataCollector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def initialize_database():
    """Initialize the database"""
    try:
        create_tables()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def collect_initial_data():
    """Collect initial data for the search engine"""
    try:
        logger.info("Collecting initial data...")
        collector = DataCollector()
        
        # Collect some initial data
        initial_queries = [
            "artificial intelligence",
            "machine learning",
            "python programming",
            "web development"
        ]
        
        training_data = await collector.collect_search_data(initial_queries, max_pages_per_query=5)
        
        if training_data:
            filepath = collector.save_training_data(training_data, "initial_dataset.json")
            logger.info(f"Initial data collected and saved to: {filepath}")
        else:
            logger.warning("No initial data collected")
            
    except Exception as e:
        logger.error(f"Initial data collection failed: {e}")


async def main():
    """Main startup function"""
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    
    # Check if OpenAI API key is configured
    if not settings.openai_api_key:
        logger.warning("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.")
    
    # Initialize database
    await initialize_database()
    
    # Collect initial data (optional)
    if settings.debug:
        await collect_initial_data()
    
    logger.info("Startup completed successfully!")
    logger.info("You can now run: python main.py")


if __name__ == "__main__":
    asyncio.run(main())
