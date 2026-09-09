from typing import Optional
from backend.app.llm.base import BaseLLMProvider
from backend.app.llm.groq_provider import GroqProvider
from backend.app.llm.openai_provider import OpenAIProvider
from backend.app.llm.gemini_provider import GeminiProvider
from backend.app.llm.mock_provider import MockDeterministicLLMProvider
from backend.app.core.config import settings
from backend.app.core.logging import logger

def get_llm_provider(preferred_provider: Optional[str] = None) -> BaseLLMProvider:
    """
    Resolves the active LLM Provider based on application settings and key availability.
    Supported: 'groq', 'openai', 'gemini', 'mock', 'auto'.
    """
    prov = (preferred_provider or settings.LLM_PROVIDER or "auto").lower().strip()

    if prov == "groq":
        if settings.GROQ_API_KEY:
            return GroqProvider()
        logger.warning("[LLMFactory] Groq requested but GROQ_API_KEY is empty. Falling back to deterministic provider.")
        return MockDeterministicLLMProvider()

    if prov == "openai":
        if settings.OPENAI_API_KEY:
            return OpenAIProvider()
        logger.warning("[LLMFactory] OpenAI requested but OPENAI_API_KEY is empty. Falling back to deterministic provider.")
        return MockDeterministicLLMProvider()

    if prov == "gemini":
        if settings.GEMINI_API_KEY:
            return GeminiProvider()
        logger.warning("[LLMFactory] Gemini requested but GEMINI_API_KEY is empty. Falling back to deterministic provider.")
        return MockDeterministicLLMProvider()

    if prov == "mock":
        return MockDeterministicLLMProvider()

    # Auto resolution: Check Groq first, then OpenAI, then Gemini, then Fallback
    if settings.GROQ_API_KEY:
        return GroqProvider()
    if settings.OPENAI_API_KEY:
        return OpenAIProvider()
    if settings.GEMINI_API_KEY:
        return GeminiProvider()

    return MockDeterministicLLMProvider()
