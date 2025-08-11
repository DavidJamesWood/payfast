"""
Example of how to use LLM configuration in your PayFast application.
"""

from config import settings
from openai import AsyncOpenAI

class LLMService:
    """Service for interacting with LLM providers."""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.model = settings.LLM_MODEL
        self.api_key = settings.OPENAI_API_KEY
        
        if not self.api_key:
            raise ValueError("OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.")
        
        # Initialize OpenAI client
        if self.provider.lower() == "openai":
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
    
    async def generate_response(self, prompt: str) -> str:
        """Generate a response using the configured LLM."""
        if self.provider.lower() == "openai":
            return await self._call_openai(prompt)
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
    
    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API using the official client."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            raise ValueError(f"OpenAI API error: {str(e)}")

# Example usage in your FastAPI endpoints:
"""
from fastapi import APIRouter, HTTPException
from llm_example import LLMService

router = APIRouter()

@router.post("/analyze-payroll")
async def analyze_payroll(payroll_data: dict):
    try:
        llm = LLMService()
        prompt = f"Analyze this payroll data and identify any anomalies: {payroll_data}"
        analysis = await llm.generate_response(prompt)
        return {"analysis": analysis}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="LLM service error")
"""
