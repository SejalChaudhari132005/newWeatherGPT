from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class BaseLLMProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name, e.g. 'openai', 'gemini', 'mock'."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Model name, e.g. 'gpt-4o-mini', 'gemini-1.5-flash'."""
        pass

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 600,
        **kwargs: Any
    ) -> str:
        """Generates a text completion based on prompt, system instruction, and history."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Checks whether this provider has valid configuration and is operational."""
        pass
