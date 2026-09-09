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
    Routes user profile role and intent to the corresponding RoleAgent.
    Supports Farmer, Fisherman, Aviation, and Citizen with domain-specific grounding.
    """

    def __init__(self):
        self._agents: Dict[str, RoleAgent] = {}
        self._aliases: Dict[str, str] = {
            "farmer": "farmer",
            "agriculture": "farmer",
            "agri": "farmer",
            "farm": "farmer",
            "krishi": "farmer",
            "fisher": "fisherman",
            "fisherman": "fisherman",
            "marine": "fisherman",
            "sea": "fisherman",
            "matsya": "fisherman",
            "aviation": "aviation",
            "pilot": "aviation",
            "flight": "aviation",
            "dispatcher": "aviation",
            "airport": "aviation",
            "citizen": "citizen",
            "general": "citizen",
            "default": "citizen",
            "disaster_manager": "disaster_manager",
            "urban_planner": "urban_planner",
            "researcher": "researcher",
        }
        self._initialized: bool = False

    def register(self, role_name: str, agent: RoleAgent) -> None:
        key = role_name.lower().strip()
        self._agents[key] = agent

    def _ensure_registered(self) -> None:
        if self._initialized:
            return
        
        # 1. Citizen Agent
        if "citizen" not in self._agents:
            try:
                from backend.app.agents.citizen_agent import citizen_agent
                self.register("citizen", citizen_agent)
            except Exception as e:
                logger.warning(f"Could not load citizen agent: {e}")

        # 2. Farmer Agent
        if "farmer" not in self._agents:
            try:
                from backend.app.agents.farmer_agent import farmer_agent
                self.register("farmer", farmer_agent)
            except Exception as e:
                logger.warning(f"Could not load farmer agent: {e}")

        # 3. Fisherman Agent
        if "fisherman" not in self._agents:
            try:
                from backend.app.agents.fisherman_agent import fisherman_agent
                self.register("fisherman", fisherman_agent)
                self.register("fisher", fisherman_agent)
            except Exception as e:
                logger.warning(f"Could not load fisherman agent: {e}")

        # 4. Aviation Agent
        if "aviation" not in self._agents:
            try:
                from backend.app.agents.aviation_agent import aviation_agent
                self.register("aviation", aviation_agent)
                self.register("pilot", aviation_agent)
                self.register("dispatcher", aviation_agent)
            except Exception as e:
                logger.warning(f"Could not load aviation agent: {e}")

        # Stubs for remaining roadmap roles
        if "disaster_manager" not in self._agents:
            self.register("disaster_manager", StubRoleAgent("disaster_manager", "Emergency first-response and flood monitoring."))
        if "urban_planner" not in self._agents:
            self.register("urban_planner", StubRoleAgent("urban_planner", "City drainage and heat island mitigation."))
        if "researcher" not in self._agents:
            self.register("researcher", StubRoleAgent("researcher", "Atmospheric physics and historical observation analysis."))

        self._initialized = True

    def get_agent(self, role: Optional[str]) -> RoleAgent:
        self._ensure_registered()
        raw_role = (role or "citizen").lower().strip()
        canonical_role = self._aliases.get(raw_role, raw_role)
        
        agent = self._agents.get(canonical_role)
        if not agent:
            # Fallback to direct lookup or citizen
            agent = self._agents.get(raw_role) or self._agents.get("citizen") or StubRoleAgent("citizen", "Everyday citizen weather intelligence.")
        return agent

    def list_roles(self) -> List[Dict[str, str]]:
        self._ensure_registered()
        return [
            {"role": name, "description": agent.description}
            for name, agent in self._agents.items()
        ]

    def is_role_supported(self, role: str) -> bool:
        if not role:
            return False
        raw = role.lower().strip()
        canonical = self._aliases.get(raw, raw)
        return canonical in ["farmer", "fisherman", "aviation", "citizen"]


# Global Router Singleton
role_router = RoleRouter()

