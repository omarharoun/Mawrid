"""
Data collection utilities for fine-tuning
"""
import json
import asyncio
import aiohttp
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.web_crawler import WebCrawler
from app.models.search import WebPage
import logging

logger = logging.getLogger(__name__)


class DataCollector:
    """Collect data for fine-tuning the AI agent"""
    
    def __init__(self, output_dir: str = "./data/fine_tuning"):
        self.output_dir = output_dir
        self.collected_data = []
    
    async def collect_search_data(self, queries: List[str], max_pages_per_query: int = 10) -> List[Dict[str, Any]]:
        """Collect search data for fine-tuning"""
        training_data = []
        
        for query in queries:
            logger.info(f"Collecting data for query: {query}")
            
            try:
                # Generate search URLs
                search_urls = self._generate_search_urls(query)
                
                # Crawl pages
                async with WebCrawler() as crawler:
                    webpages = await crawler.crawl_multiple_urls(search_urls[:max_pages_per_query])
                
                # Create training examples
                for webpage in webpages:
                    if webpage and webpage.content:
                        training_example = self._create_training_example(query, webpage)
                        training_data.append(training_example)
                
            except Exception as e:
                logger.error(f"Error collecting data for query '{query}': {e}")
        
        return training_data
    
    async def collect_conversation_data(self, conversations: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Collect conversation data for fine-tuning"""
        training_data = []
        
        for conversation in conversations:
            try:
                # Create training example from conversation
                training_example = {
                    "messages": [
                        {"role": "system", "content": "You are a helpful search assistant."},
                        {"role": "user", "content": conversation["user"]},
                        {"role": "assistant", "content": conversation["assistant"]}
                    ],
                    "metadata": {
                        "source": "conversation",
                        "timestamp": datetime.now().isoformat(),
                        "quality": conversation.get("quality", "good")
                    }
                }
                training_data.append(training_example)
                
            except Exception as e:
                logger.error(f"Error processing conversation: {e}")
        
        return training_data
    
    async def collect_qa_pairs(self, qa_pairs: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Collect Q&A pairs for fine-tuning"""
        training_data = []
        
        for qa in qa_pairs:
            try:
                training_example = {
                    "messages": [
                        {"role": "system", "content": "You are a helpful search assistant that provides accurate answers."},
                        {"role": "user", "content": qa["question"]},
                        {"role": "assistant", "content": qa["answer"]}
                    ],
                    "metadata": {
                        "source": "qa_pairs",
                        "timestamp": datetime.now().isoformat(),
                        "category": qa.get("category", "general")
                    }
                }
                training_data.append(training_example)
                
            except Exception as e:
                logger.error(f"Error processing Q&A pair: {e}")
        
        return training_data
    
    def _create_training_example(self, query: str, webpage: WebPage) -> Dict[str, Any]:
        """Create a training example from search query and webpage"""
        # Extract relevant content
        content = webpage.content[:2000]  # Limit content length
        
        # Create a hypothetical answer based on the content
        answer = self._generate_answer_from_content(query, content)
        
        return {
            "messages": [
                {"role": "system", "content": "You are a helpful search assistant that provides accurate information based on web content."},
                {"role": "user", "content": f"Search: {query}"},
                {"role": "assistant", "content": answer}
            ],
            "metadata": {
                "source": "web_crawl",
                "url": webpage.url,
                "title": webpage.title,
                "domain": webpage.domain,
                "timestamp": datetime.now().isoformat(),
                "content_length": len(content)
            }
        }
    
    def _generate_answer_from_content(self, query: str, content: str) -> str:
        """Generate a simple answer from content (placeholder for more sophisticated extraction)"""
        # This is a simplified version - in production, you'd use more sophisticated NLP
        sentences = content.split('.')
        relevant_sentences = []
        
        query_words = query.lower().split()
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(word in sentence_lower for word in query_words):
                relevant_sentences.append(sentence.strip())
                if len(relevant_sentences) >= 3:
                    break
        
        if relevant_sentences:
            return '. '.join(relevant_sentences) + '.'
        else:
            return content[:500] + "..." if len(content) > 500 else content
    
    def _generate_search_urls(self, query: str) -> List[str]:
        """Generate search URLs based on query"""
        # This is a simplified version - in production, you'd use actual search APIs
        base_urls = [
            f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}",
            f"https://www.britannica.com/search?query={query.replace(' ', '+')}",
            f"https://www.merriam-webster.com/dictionary/{query.replace(' ', '%20')}",
        ]
        return base_urls
    
    def save_training_data(self, training_data: List[Dict[str, Any]], filename: str = None) -> str:
        """Save training data to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"training_data_{timestamp}.json"
        
        filepath = f"{self.output_dir}/{filename}"
        
        # Ensure directory exists
        import os
        os.makedirs(self.output_dir, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(training_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(training_data)} training examples to {filepath}")
        return filepath
    
    def load_training_data(self, filepath: str) -> List[Dict[str, Any]]:
        """Load training data from JSON file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"Loaded {len(data)} training examples from {filepath}")
        return data
    
    def format_for_openai_fine_tuning(self, training_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format training data for OpenAI fine-tuning"""
        formatted_data = []
        
        for example in training_data:
            formatted_example = {
                "messages": example["messages"]
            }
            formatted_data.append(formatted_example)
        
        return formatted_data
    
    async def collect_comprehensive_dataset(self) -> str:
        """Collect a comprehensive dataset for fine-tuning"""
        logger.info("Starting comprehensive data collection...")
        
        # Sample queries for data collection
        sample_queries = [
            "artificial intelligence",
            "machine learning",
            "python programming",
            "web development",
            "data science",
            "cloud computing",
            "cybersecurity",
            "blockchain technology",
            "quantum computing",
            "renewable energy"
        ]
        
        # Sample Q&A pairs
        sample_qa_pairs = [
            {
                "question": "What is machine learning?",
                "answer": "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.",
                "category": "technology"
            },
            {
                "question": "How does Python work?",
                "answer": "Python is an interpreted, high-level programming language that uses an interpreter to execute code line by line, making it easy to learn and use.",
                "category": "programming"
            },
            {
                "question": "What is cloud computing?",
                "answer": "Cloud computing is the delivery of computing services including servers, storage, databases, networking, software, and analytics over the internet.",
                "category": "technology"
            }
        ]
        
        # Collect data from multiple sources
        all_training_data = []
        
        # Collect search data
        search_data = await self.collect_search_data(sample_queries)
        all_training_data.extend(search_data)
        
        # Collect Q&A data
        qa_data = await self.collect_qa_pairs(sample_qa_pairs)
        all_training_data.extend(qa_data)
        
        # Save the comprehensive dataset
        filepath = self.save_training_data(all_training_data, "comprehensive_dataset.json")
        
        # Also save in OpenAI format
        openai_format = self.format_for_openai_fine_tuning(all_training_data)
        openai_filepath = self.save_training_data(openai_format, "openai_fine_tuning_dataset.json")
        
        logger.info(f"Data collection complete. Saved {len(all_training_data)} examples.")
        return filepath

