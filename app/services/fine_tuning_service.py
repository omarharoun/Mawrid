"""
Fine-tuning service for custom AI model training
"""
import openai
import json
import asyncio
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.database_service import DatabaseService
import logging

logger = logging.getLogger(__name__)


class FineTuningService:
    """Service for fine-tuning AI models"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
        self.db_service = DatabaseService()
        self.model_name = "gpt-3.5-turbo"  # Base model for fine-tuning
    
    async def prepare_training_data(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Prepare training data from database"""
        try:
            # Get training data from database
            training_data = self.db_service.get_training_data(limit=limit)
            
            # Convert to OpenAI format
            openai_format = []
            for item in training_data:
                training_example = {
                    "messages": [
                        {"role": "system", "content": "You are a helpful search assistant that provides accurate, comprehensive answers."},
                        {"role": "user", "content": item["query"]},
                        {"role": "assistant", "content": item["answer"]}
                    ]
                }
                openai_format.append(training_example)
            
            logger.info(f"Prepared {len(openai_format)} training examples")
            return openai_format
            
        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            return []
    
    async def upload_training_file(self, training_data: List[Dict[str, Any]], filename: str = "training_data.jsonl") -> Optional[str]:
        """Upload training data to OpenAI"""
        try:
            # Convert to JSONL format
            jsonl_data = []
            for example in training_data:
                jsonl_data.append(json.dumps(example))
            
            # Save to file
            filepath = f"{settings.fine_tuning_data_path}/{filename}"
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(jsonl_data))
            
            # Upload to OpenAI
            with open(filepath, 'rb') as f:
                response = self.client.files.create(
                    file=f,
                    purpose="fine-tune"
                )
            
            logger.info(f"Uploaded training file: {response.id}")
            return response.id
            
        except Exception as e:
            logger.error(f"Error uploading training file: {e}")
            return None
    
    async def create_fine_tuning_job(self, training_file_id: str, model_name: str = None) -> Optional[str]:
        """Create a fine-tuning job"""
        try:
            if not model_name:
                model_name = self.model_name
            
            response = self.client.fine_tuning.jobs.create(
                training_file=training_file_id,
                model=model_name,
                hyperparameters={
                    "n_epochs": 3,
                    "batch_size": 1,
                    "learning_rate_multiplier": 1.0
                }
            )
            
            logger.info(f"Created fine-tuning job: {response.id}")
            return response.id
            
        except Exception as e:
            logger.error(f"Error creating fine-tuning job: {e}")
            return None
    
    async def get_fine_tuning_status(self, job_id: str) -> Dict[str, Any]:
        """Get fine-tuning job status"""
        try:
            response = self.client.fine_tuning.jobs.retrieve(job_id)
            
            status_info = {
                "id": response.id,
                "status": response.status,
                "model": response.model,
                "created_at": response.created_at,
                "finished_at": response.finished_at,
                "trained_tokens": response.trained_tokens,
                "training_file": response.training_file,
                "result_files": response.result_files,
                "error": response.error
            }
            
            return status_info
            
        except Exception as e:
            logger.error(f"Error getting fine-tuning status: {e}")
            return {"error": str(e)}
    
    async def list_fine_tuning_jobs(self) -> List[Dict[str, Any]]:
        """List all fine-tuning jobs"""
        try:
            response = self.client.fine_tuning.jobs.list()
            
            jobs = []
            for job in response.data:
                jobs.append({
                    "id": job.id,
                    "status": job.status,
                    "model": job.model,
                    "created_at": job.created_at,
                    "finished_at": job.finished_at
                })
            
            return jobs
            
        except Exception as e:
            logger.error(f"Error listing fine-tuning jobs: {e}")
            return []
    
    async def delete_fine_tuning_job(self, job_id: str) -> bool:
        """Delete a fine-tuning job"""
        try:
            self.client.fine_tuning.jobs.cancel(job_id)
            logger.info(f"Cancelled fine-tuning job: {job_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting fine-tuning job: {e}")
            return False
    
    async def test_fine_tuned_model(self, model_id: str, test_query: str) -> str:
        """Test a fine-tuned model"""
        try:
            response = self.client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": "You are a helpful search assistant."},
                    {"role": "user", "content": test_query}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error testing fine-tuned model: {e}")
            return f"Error: {str(e)}"
    
    async def compare_models(self, base_model: str, fine_tuned_model: str, test_queries: List[str]) -> Dict[str, Any]:
        """Compare base model with fine-tuned model"""
        try:
            results = {
                "base_model": base_model,
                "fine_tuned_model": fine_tuned_model,
                "comparisons": []
            }
            
            for query in test_queries:
                # Test base model
                base_response = await self.test_fine_tuned_model(base_model, query)
                
                # Test fine-tuned model
                fine_tuned_response = await self.test_fine_tuned_model(fine_tuned_model, query)
                
                results["comparisons"].append({
                    "query": query,
                    "base_response": base_response,
                    "fine_tuned_response": fine_tuned_response
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error comparing models: {e}")
            return {"error": str(e)}
    
    async def full_fine_tuning_pipeline(self, limit: int = 1000) -> Dict[str, Any]:
        """Run the complete fine-tuning pipeline"""
        try:
            logger.info("Starting fine-tuning pipeline...")
            
            # Step 1: Prepare training data
            training_data = await self.prepare_training_data(limit)
            if not training_data:
                return {"error": "No training data available"}
            
            # Step 2: Upload training file
            file_id = await self.upload_training_file(training_data)
            if not file_id:
                return {"error": "Failed to upload training file"}
            
            # Step 3: Create fine-tuning job
            job_id = await self.create_fine_tuning_job(file_id)
            if not job_id:
                return {"error": "Failed to create fine-tuning job"}
            
            logger.info(f"Fine-tuning pipeline started. Job ID: {job_id}")
            
            return {
                "status": "started",
                "job_id": job_id,
                "training_file_id": file_id,
                "training_examples": len(training_data)
            }
            
        except Exception as e:
            logger.error(f"Error in fine-tuning pipeline: {e}")
            return {"error": str(e)}
