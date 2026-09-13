"""
Schemas for Real-Time Weather Events and Ingestion Pipeline
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime


class EventType(str, Enum):
    WEATHER_ALERT = "WEATHER_ALERT"
    RADAR_UPDATE = "RADAR_UPDATE"
    WEATHER_OBSERVATION = "WEATHER_OBSERVATION"
    SYSTEM_STATUS = "SYSTEM_STATUS"
    NWP_UPDATE = "NWP_UPDATE"
    MARINE_WARNING = "MARINE_WARNING"
    AVIATION_ALERT = "AVIATION_ALERT"
    AGRICULTURE_ALERT = "AGRICULTURE_ALERT"


class EventSeverity(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    ORANGE = "ORANGE"
    RED = "RED"
    INFO = "INFO"


class EventLocation(BaseModel):
    lat: float
    lon: float
    name: str
    district: Optional[str] = None
    state: Optional[str] = None


class BaseWeatherEvent(BaseModel):
    eventType: EventType
    eventId: str
    source: str = Field(default="IMD", description="Source provider: IMD, INCOIS, MOSDAC, DEMO_STREAM")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    receivedTimestamp: Optional[str] = None
    is_demo: bool = Field(default=False, description="Flag indicating if event is simulated/demonstration")
    severity: EventSeverity = Field(default=EventSeverity.INFO)
    title: str
    message: str
    location: Optional[EventLocation] = None
    validFrom: Optional[str] = None
    validUntil: Optional[str] = None
    targetRoles: List[str] = Field(
        default_factory=lambda: ["citizen", "farmer", "fisherman", "aviation", "disaster_manager", "urban_planner", "researcher"],
        description="Target stakeholder personas"
    )
    data: Dict[str, Any] = Field(default_factory=dict)


class DemoPublishEventRequest(BaseModel):
    eventType: EventType = Field(default=EventType.WEATHER_ALERT)
    severity: EventSeverity = Field(default=EventSeverity.ORANGE)
    title: str = Field(default="Heavy Rainfall Warning")
    message: str = Field(default="Severe convective storm cell detected over region with 45mm/h precipitation rate.")
    location: Optional[EventLocation] = Field(
        default_factory=lambda: EventLocation(lat=19.0760, lon=72.8777, name="Mumbai", district="Mumbai", state="Maharashtra")
    )
    source: str = Field(default="DEMO_SIMULATOR")
    is_demo: bool = Field(default=True)
    targetRoles: Optional[List[str]] = None
    data: Optional[Dict[str, Any]] = None


class RealtimeHealthStatus(BaseModel):
    websocket: str
    connected_clients: int
    total_events_broadcast: int
    last_event_timestamp: Optional[str]
    uptime_seconds: float
    status: str
    event_bus: str
