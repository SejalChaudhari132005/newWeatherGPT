"""
RoleRouter & RoleAgent Abstraction for WeatherGPT Step 8.
Routes verified meteorological context to role-specific intelligence agents.
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData

logger = logging.getLogger("role_router")


class RoleAgent(ABC):
    """
    Abstract Base Interface for all role-specific weather intelligence agents.
    Enforces ONE WEATHER DATASET + ONE LOCATION + DIFFERENT ROLE = DIFFERENT INTELLIGENCE.
    """

    @property
    @abstractmethod
    def role_name(self) -> str:
        """Role identifier, e.g. 'citizen', 'farmer', 'fisherman'."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Brief summary of the role's advisory responsibilities."""
        pass

    @abstractmethod
    async def get_role_context(self) -> Dict[str, Any]:
        """Return role-specific contextual metadata."""
        pass

    @abstractmethod
    async def generate_advice(
        self,
        intelligence: WeatherIntelligenceData,
        query: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate structured role-specific intelligence and recommendations."""
        pass

    @abstractmethod
    async def generate_dashboard_insights(
        self,
        intelligence: WeatherIntelligenceData,
    ) -> Dict[str, Any]:
        """
        Generate structured cards for the live dashboard:
        Outdoor Plan, Commute Safety, Weather Advice, Official Warning, Outdoor Suitability.
        """
        pass

    @abstractmethod
    async def generate_chat_context(
        self,
        intelligence: WeatherIntelligenceData,
        query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        time_range: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synthesize natural language conversational response grounded in verified weather data.
        """
        pass


class StubRoleAgent(RoleAgent):
    """
    Extensible stub for future roles (Farmer, Fisherman, Disaster Manager, etc.).
    Architecture is prepared; specific intelligence will be implemented in subsequent steps.
    """

    def __init__(self, name: str, desc: str):
        self._name = name
        self._desc = desc

    @property
    def role_name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
        return self._desc

    async def get_role_context(self) -> Dict[str, Any]:
        return {"role": self._name, "status": "stub_prepared"}

    async def generate_advice(
        self,
        intelligence: WeatherIntelligenceData,
        query: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return {
            "role": self._name,
            "status": "prepared",
            "message": f"{self._name.capitalize()} intelligence agent is scheduled for upcoming release.",
        }

    async def generate_dashboard_insights(
        self,
        intelligence: WeatherIntelligenceData,
    ) -> Dict[str, Any]:
        return {
            "role": self._name,
            "status": "prepared",
            "cards": [],
        }

    async def generate_chat_context(
        self,
        intelligence: WeatherIntelligenceData,
        query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        time_range: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {
            "role": self._name,
            "content": f"I am preparing the specialized {self._name.replace('_', ' ')} intelligence module. In the meantime, here is your general weather summary for {intelligence.location.city or 'your area'}.",
            "sources": ["Open-Meteo"],
        }


class RoleRouter:
    """
    Routes user profile role to the corresponding RoleAgent.
    For Step 8: Only CITIZEN is fully implemented.
    Future roles are mapped to stubs.
    """

    def __init__(self):
        self._agents: Dict[str, RoleAgent] = {}

    def register(self, role_name: str, agent: RoleAgent) -> None:
        self._agents[role_name.lower().strip()] = agent

    def get_agent(self, role: Optional[str]) -> RoleAgent:
        normalized = (role or "citizen").lower().strip()
        # Direct lookup or fallback to citizen
        agent = self._agents.get(normalized)
        if not agent:
            if "citizen" not in self._agents:
                try:
                    from backend.app.agents.citizen_agent import citizen_agent
                    self.register("citizen", citizen_agent)
                except Exception as e:
                    logger.warning(f"Could not load citizen agent: {e}")
            agent = self._agents.get("citizen") or StubRoleAgent("citizen", "Everyday citizen weather intelligence.")
        return agent


# Global Router Singleton
role_router = RoleRouter()

# Register Future Stubs
role_router.register("farmer", StubRoleAgent("farmer", "Agricultural crop stage and soil moisture intelligence."))
role_router.register("fisherman", StubRoleAgent("fisherman", "Marine sea-state, wave height, and coastal wind intelligence."))
role_router.register("disaster_manager", StubRoleAgent("disaster_manager", "Emergency first-response, flood monitoring, and severe hazard triage."))
role_router.register("urban_planner", StubRoleAgent("urban_planner", "City drainage, heat island mitigation, and infrastructure resilience."))
role_router.register("researcher", StubRoleAgent("researcher", "Atmospheric physics, climate variability, and historical observation analysis."))
role_router.register("aviation", StubRoleAgent("aviation", "Runway crosswind, ceiling visibility, and METAR/TAF translation."))
