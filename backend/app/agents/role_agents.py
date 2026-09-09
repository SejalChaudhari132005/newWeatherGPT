from typing import Dict, Any, Optional
from backend.app.agents.base_agent import BaseAgent
from backend.app.agents.role_router import RoleAgent, role_router, StubRoleAgent
from backend.app.agents.citizen_agent import CitizenAgent, citizen_agent

class FarmerAgent(StubRoleAgent):
    def __init__(self):
        super().__init__("farmer", "Generates agricultural weather advisories, irrigation guidance, and crop protection intelligence.")

class FishermanAgent(StubRoleAgent):
    def __init__(self):
        super().__init__("fisherman", "Monitors coastal wave height, wind speeds, and marine safety advisories.")

class DisasterAgent(StubRoleAgent):
    def __init__(self):
        super().__init__("disaster_manager", "Provides actionable decision-support intelligence for disaster managers and first responders.")

class ResearchAgent(StubRoleAgent):
    def __init__(self):
        super().__init__("researcher", "Performs historical weather analysis and climate trend assessments.")

farmer_agent = FarmerAgent()
fisherman_agent = FishermanAgent()
disaster_agent = DisasterAgent()
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
    "DisasterAgent",
    "disaster_agent",
    "ResearchAgent",
    "research_agent",
]
