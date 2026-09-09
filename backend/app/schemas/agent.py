from typing import Optional, Dict, Any
from pydantic import BaseModel

class AgentRequest(BaseModel):
    agent_name: str
    query: str
    context: Optional[Dict[str, Any]] = None

class AgentResponse(BaseModel):
    agent_name: str
    success: bool
    result: Optional[Dict[str, Any]] = None
    message: str
