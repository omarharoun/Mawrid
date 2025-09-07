"""
Fine-tuning API endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Dict, Any
from app.services.fine_tuning_service import FineTuningService
from app.services.database_service import DatabaseService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/fine-tuning", tags=["fine-tuning"])

# Global services
fine_tuning_service = FineTuningService()
db_service = DatabaseService()


@router.post("/prepare-data")
async def prepare_training_data(
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of training examples")
):
    """
    Prepare training data from the database
    """
    try:
        training_data = await fine_tuning_service.prepare_training_data(limit)
        return {
            "status": "success",
            "training_examples": len(training_data),
            "data": training_data[:5]  # Return first 5 examples as preview
        }
        
    except Exception as e:
        logger.error(f"Error preparing training data: {e}")
        raise HTTPException(status_code=500, detail="Failed to prepare training data")


@router.post("/upload-file")
async def upload_training_file(
    training_data: List[Dict[str, Any]],
    filename: str = Query("training_data.jsonl", description="Filename for the training file")
):
    """
    Upload training data to OpenAI
    """
    try:
        file_id = await fine_tuning_service.upload_training_file(training_data, filename)
        if file_id:
            return {
                "status": "success",
                "file_id": file_id,
                "message": "Training file uploaded successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to upload training file")
            
    except Exception as e:
        logger.error(f"Error uploading training file: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload training file")


@router.post("/create-job")
async def create_fine_tuning_job(
    training_file_id: str = Query(..., description="OpenAI file ID"),
    model_name: str = Query("gpt-3.5-turbo", description="Base model for fine-tuning")
):
    """
    Create a fine-tuning job
    """
    try:
        job_id = await fine_tuning_service.create_fine_tuning_job(training_file_id, model_name)
        if job_id:
            return {
                "status": "success",
                "job_id": job_id,
                "message": "Fine-tuning job created successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to create fine-tuning job")
            
    except Exception as e:
        logger.error(f"Error creating fine-tuning job: {e}")
        raise HTTPException(status_code=500, detail="Failed to create fine-tuning job")


@router.get("/job/{job_id}/status")
async def get_fine_tuning_status(job_id: str):
    """
    Get fine-tuning job status
    """
    try:
        status = await fine_tuning_service.get_fine_tuning_status(job_id)
        return status
        
    except Exception as e:
        logger.error(f"Error getting fine-tuning status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get job status")


@router.get("/jobs")
async def list_fine_tuning_jobs():
    """
    List all fine-tuning jobs
    """
    try:
        jobs = await fine_tuning_service.list_fine_tuning_jobs()
        return {
            "status": "success",
            "jobs": jobs
        }
        
    except Exception as e:
        logger.error(f"Error listing fine-tuning jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to list jobs")


@router.delete("/job/{job_id}")
async def cancel_fine_tuning_job(job_id: str):
    """
    Cancel a fine-tuning job
    """
    try:
        success = await fine_tuning_service.delete_fine_tuning_job(job_id)
        if success:
            return {
                "status": "success",
                "message": f"Job {job_id} cancelled successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to cancel job")
            
    except Exception as e:
        logger.error(f"Error cancelling fine-tuning job: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel job")


@router.post("/test-model")
async def test_fine_tuned_model(
    model_id: str = Query(..., description="Fine-tuned model ID"),
    test_query: str = Query(..., description="Test query")
):
    """
    Test a fine-tuned model
    """
    try:
        response = await fine_tuning_service.test_fine_tuned_model(model_id, test_query)
        return {
            "status": "success",
            "model_id": model_id,
            "test_query": test_query,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"Error testing fine-tuned model: {e}")
        raise HTTPException(status_code=500, detail="Failed to test model")


@router.post("/compare-models")
async def compare_models(
    base_model: str = Query("gpt-3.5-turbo", description="Base model"),
    fine_tuned_model: str = Query(..., description="Fine-tuned model ID"),
    test_queries: List[str] = Query(..., description="List of test queries")
):
    """
    Compare base model with fine-tuned model
    """
    try:
        results = await fine_tuning_service.compare_models(base_model, fine_tuned_model, test_queries)
        return results
        
    except Exception as e:
        logger.error(f"Error comparing models: {e}")
        raise HTTPException(status_code=500, detail="Failed to compare models")


@router.post("/pipeline")
async def run_fine_tuning_pipeline(
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of training examples")
):
    """
    Run the complete fine-tuning pipeline
    """
    try:
        result = await fine_tuning_service.full_fine_tuning_pipeline(limit)
        return result
        
    except Exception as e:
        logger.error(f"Error in fine-tuning pipeline: {e}")
        raise HTTPException(status_code=500, detail="Fine-tuning pipeline failed")


@router.post("/training-data")
async def add_training_data(
    query: str = Query(..., description="Training query"),
    answer: str = Query(..., description="Training answer"),
    source_url: str = Query(None, description="Source URL"),
    quality_score: float = Query(1.0, ge=0.0, le=1.0, description="Quality score"),
    category: str = Query("general", description="Category")
):
    """
    Add training data to the database
    """
    try:
        success = db_service.save_training_data(query, answer, source_url, quality_score, category)
        if success:
            return {
                "status": "success",
                "message": "Training data added successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to add training data")
            
    except Exception as e:
        logger.error(f"Error adding training data: {e}")
        raise HTTPException(status_code=500, detail="Failed to add training data")


@router.get("/training-data")
async def get_training_data(
    category: str = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records")
):
    """
    Get training data from the database
    """
    try:
        training_data = db_service.get_training_data(category, limit)
        return {
            "status": "success",
            "count": len(training_data),
            "data": training_data
        }
        
    except Exception as e:
        logger.error(f"Error getting training data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get training data")
