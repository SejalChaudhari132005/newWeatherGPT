from typing import Dict, Any, Optional
from backend.app.agents.base_agent import BaseAgent
from backend.app.agents.role_router import RoleAgent, role_router, StubRoleAgent
from backend.app.agents.citizen_agent import CitizenAgent, citizen_agent
from backend.app.agents.farmer_agent import FarmerAgent, farmer_agent
from backend.app.agents.fisherman_agent import FishermanAgent, fisherman_agent
from backend.app.agents.aviation_agent import AviationAgent, aviation_agent

from backend.app.agents.disaster_agent import DisasterAgent, disaster_agent
from backend.app.agents.urban_agent import UrbanAgent, urban_agent

class ResearchAgent(StubRoleAgent):
    def __init__(self):
        super().__init__("researcher", "Performs historical weather analysis and climate trend assessments.")

research_agent = ResearchAgent()

__all__ = [
    "RoleAgent",
    "role_router",
    "CitizenAgent",
    "citizen_agent",
    "FarmerAgent",
    "farmer_agent",
    "FishermanAgent",
    "fisherman_agent",
    "AviationAgent",
    "aviation_agent",
    "DisasterAgent",
    "disaster_agent",
    "UrbanAgent",
    "urban_agent",
    "ResearchAgent",
    "research_agent",
]

