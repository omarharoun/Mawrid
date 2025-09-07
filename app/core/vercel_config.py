"""
Vercel-specific configuration
"""
import os
from typing import Optional
from pydantic import BaseSettings


class VercelSettings(BaseSettings):
    """Vercel-specific settings"""
    
    # App Configuration
    app_name: str = "Mawrid Search Engine"
    app_version: str = "1.0.0"
    debug: bool = False
    secret_key: str = "vercel-secret-key-change-in-production"
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-3.5-turbo"
    openai_max_tokens: int = 1000
    
    # Database Configuration (Vercel-compatible)
    database_url: str = "sqlite:///tmp/mawrid_search.db"  # Use /tmp for Vercel
    
    # Search Configuration
    max_search_results: int = 20
    crawl_delay: int = 1
    max_crawl_depth: int = 2  # Reduced for Vercel
    
    # Fine-tuning Configuration
    fine_tuning_data_path: str = "/tmp/fine_tuning"
    model_checkpoint_path: str = "/tmp/checkpoints"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Check if running on Vercel
def is_vercel():
    return os.environ.get("VERCEL") == "1"


# Use Vercel settings if on Vercel, otherwise use regular settings
if is_vercel():
    settings = VercelSettings()
else:
    from app.core.config import settings
