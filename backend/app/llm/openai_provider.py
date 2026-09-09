import httpx
from typing import Dict, Any, Optional, List
from backend.app.llm.base import BaseLLMProvider
from backend.app.core.config import settings
from backend.app.core.logging import logger

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL or "gpt-4o-mini"

    @property
    def name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self.model

    async def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 600,
        **kwargs: Any
    ) -> str:
        if not await self.is_available():
            raise ValueError("OpenAI API key is missing or invalid.")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        if chat_history:
            for msg in chat_history[-6:]:  # Keep recent history for cost control
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ["user", "assistant", "system"] and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"[OpenAIProvider] HTTP error {resp.status_code}: {resp.text}")
                raise RuntimeError(f"OpenAI API error: {resp.status_code} {resp.text}")

            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
