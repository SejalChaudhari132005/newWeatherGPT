import httpx
from typing import Dict, Any, Optional, List
from backend.app.llm.base import BaseLLMProvider
from backend.app.core.config import settings
from backend.app.core.logging import logger

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL or "gemini-1.5-flash"

    @property
    def name(self) -> str:
        return "gemini"

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
            raise ValueError("Gemini API key is missing or invalid.")

        contents = []

        if chat_history:
            for msg in chat_history[-6:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                gemini_role = "model" if role == "assistant" else "user"
                if content:
                    contents.append({"role": gemini_role, "parts": [{"text": content}]})

        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }

        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.error(f"[GeminiProvider] HTTP error {resp.status_code}: {resp.text}")
                raise RuntimeError(f"Gemini API error: {resp.status_code} {resp.text}")

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError("Gemini returned empty candidate response")

            parts = candidates[0].get("content", {}).get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"].strip()
            return ""
