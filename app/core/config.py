"""
Configuration settings for Mawrid Search Engine
"""
import os
from typing import Optional
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # App Configuration
    app_name: str = "Mawrid Search Engine"
    app_version: str = "1.0.0"
    debug: bool = True
    secret_key: str = "your-secret-key-change-in-production"
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-3.5-turbo"
    openai_max_tokens: int = 1000
    
    # Database Configuration
    database_url: str = "sqlite:///./mawrid_search.db"
    redis_url: str = "redis://localhost:6379/0"
    
    # Elasticsearch Configuration
    elasticsearch_url: str = "http://localhost:9200"
    
    # Search Configuration
    max_search_results: int = 20
    crawl_delay: int = 1
    max_crawl_depth: int = 3
    
    # Fine-tuning Configuration
    fine_tuning_data_path: str = "./data/fine_tuning"
    model_checkpoint_path: str = "./data/checkpoints"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

