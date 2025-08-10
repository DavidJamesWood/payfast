"""
Example of how to use LLM configuration in your PayFast application.
"""

from config import settings
import httpx
import json

class LLMService:
    """Service for interacting with LLM providers."""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.model = settings.LLM_MODEL
        self.api_key = settings.OPENAI_API_KEY
        
        if not self.api_key:
            raise ValueError("OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.")
    
    async def generate_response(self, prompt: str) -> str:
        """Generate a response using the configured LLM."""
        if self.provider.lower() == "openai":
            return await self._call_openai(prompt)
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
    
    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]

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
