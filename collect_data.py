#!/usr/bin/env python3
"""
Data collection script for fine-tuning the AI agent
"""
import asyncio
import logging
from app.utils.data_collector import DataCollector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Main data collection function"""
    logger.info("Starting data collection for AI fine-tuning...")
    
    # Initialize data collector
    collector = DataCollector()
    
    try:
        # Collect comprehensive dataset
        filepath = await collector.collect_comprehensive_dataset()
        
        logger.info(f"Data collection completed successfully!")
        logger.info(f"Dataset saved to: {filepath}")
        logger.info("You can now use this data for fine-tuning your AI model.")
        
    except Exception as e:
        logger.error(f"Data collection failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())

