"""
OpenAI service for AI-powered search responses
"""
import openai
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.models.search import SearchResult, AIResponse


class OpenAIService:
    """Service for OpenAI API interactions"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        self.max_tokens = settings.openai_max_tokens
    
    async def generate_search_summary(self, query: str, results: List[SearchResult]) -> str:
        """Generate AI summary of search results"""
        try:
            # Prepare context from search results
            context = self._prepare_context(results)
            
            prompt = f"""
            Based on the following search results for the query "{query}", 
            provide a comprehensive and accurate summary that directly answers the user's question.
            
            Search Results:
            {context}
            
            Please provide a clear, informative summary that:
            1. Directly addresses the search query
            2. Synthesizes information from multiple sources
            3. Is factual and well-structured
            4. Includes relevant details and context
            
            Summary:
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful search assistant that provides accurate, comprehensive summaries based on search results."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating AI summary: {e}")
            return "Unable to generate AI summary at this time."
    
    async def generate_answer(self, query: str, results: List[SearchResult]) -> AIResponse:
        """Generate AI-powered answer with sources"""
        try:
            context = self._prepare_context(results)
            
            prompt = f"""
            Based on the search results below, provide a direct answer to the query: "{query}"
            
            Search Results:
            {context}
            
            Please provide:
            1. A direct answer to the question
            2. Supporting evidence from the sources
            3. Confidence level (0-1)
            4. Brief reasoning for your answer
            
            Format your response as:
            ANSWER: [your direct answer]
            EVIDENCE: [supporting evidence]
            CONFIDENCE: [0.0-1.0]
            REASONING: [brief explanation]
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert research assistant that provides accurate, evidence-based answers."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.2
            )
            
            content = response.choices[0].message.content.strip()
            return self._parse_ai_response(content, results)
            
        except Exception as e:
            print(f"Error generating AI answer: {e}")
            return AIResponse(
                summary="Unable to generate answer",
                answer="Error occurred while processing your request.",
                sources=[],
                confidence=0.0
            )
    
    async def generate_suggestions(self, query: str) -> List[str]:
        """Generate search suggestions based on query"""
        try:
            prompt = f"""
            Based on the search query "{query}", suggest 5 related search queries that might be helpful.
            Make them specific, relevant, and different from the original query.
            
            Suggestions:
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a search assistant that provides helpful query suggestions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            suggestions_text = response.choices[0].message.content.strip()
            suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]
            return suggestions[:5]
            
        except Exception as e:
            print(f"Error generating suggestions: {e}")
            return []
    
    def _prepare_context(self, results: List[SearchResult]) -> str:
        """Prepare context from search results"""
        context_parts = []
        for i, result in enumerate(results[:5], 1):  # Use top 5 results
            context_parts.append(f"""
            Result {i}:
            Title: {result.title}
            URL: {result.url}
            Content: {result.snippet}
            """)
        
        return "\n".join(context_parts)
    
    def _parse_ai_response(self, content: str, results: List[SearchResult]) -> AIResponse:
        """Parse AI response into structured format"""
        lines = content.split('\n')
        answer = ""
        evidence = ""
        confidence = 0.0
        reasoning = ""
        
        for line in lines:
            if line.startswith("ANSWER:"):
                answer = line.replace("ANSWER:", "").strip()
            elif line.startswith("EVIDENCE:"):
                evidence = line.replace("EVIDENCE:", "").strip()
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.replace("CONFIDENCE:", "").strip())
                except ValueError:
                    confidence = 0.5
            elif line.startswith("REASONING:"):
                reasoning = line.replace("REASONING:", "").strip()
        
        # Extract sources from results
        sources = [result.url for result in results[:3]]
        
        return AIResponse(
            summary=answer,
            answer=answer,
            sources=sources,
            confidence=confidence,
            reasoning=reasoning
        )

