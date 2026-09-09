from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseAgent(ABC):
    """
    Abstract Base Agent Interface for WeatherGPT Agent Architecture.
    All specialized agents (LocationAgent, WeatherAgent, AlertAgent, Role Agents) inherit from BaseAgent.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Name identifier of the agent."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Brief summary of agent responsibilities."""
        pass

    @abstractmethod
    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute agent workflow for a given query and context."""
        pass

    async def health_check(self) -> Dict[str, Any]:
        """Verify agent status and readiness."""
        return {
            "agent": self.name,
            "status": "ready",
            "description": self.description
        }
