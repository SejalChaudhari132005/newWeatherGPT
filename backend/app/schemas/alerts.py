"""
Alert Schemas for WeatherGPT Citizen Early Warning Engine.
Provides standard structured data models for alerts, preferences, and API endpoints.
"""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime


WarningType = Literal[
    "rainfall",
    "heavy_rain",
    "extreme_rain",
    "cyclone",
    "thunderstorm",
    "lightning",
    "heatwave",
    "coldwave",
    "fog",
    "wind",
    "flood_risk",
    "poor_visibility",
    "extreme_temperature",
    "dust_storm",
    "hail",
    "coastal_warning",
    "other"
]

SeverityLevel = Literal[
    "INFO",
    "ADVISORY",
    "WATCH",
    "WARNING",
    "SEVERE",
    "EMERGENCY"
]


class IMDAlert(BaseModel):
    id: Optional[str] = None
    type: str = "other"
    severity: str = "unknown"
    severity_label: Optional[str] = None
    title: str
    description: str
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    affected_area: str
    source: str = "India Meteorological Department"
    source_url: Optional[str] = "https://mausam.imd.gov.in"
    issued_at: Optional[str] = None


class CitizenAlert(BaseModel):
    id: str = Field(..., description="Unique Alert UUID")
    user_id: Optional[str] = Field(None, description="User UUID or anonymous")
    fingerprint: str = Field(..., description="Deduplication hash")
    type: str = Field(..., description="Alert hazard type (e.g. HEAVY_RAIN, HEATWAVE)")
    severity: str = Field(..., description="INFO, ADVISORY, WATCH, WARNING, SEVERE, EMERGENCY")
    severity_label: Optional[str] = Field(None, description="Localized/Friendly severity name")
    title: str = Field(..., description="Headline of the alert")
    description: str = Field(..., description="Detailed explanation of the meteorological hazard")
    location_name: str = Field(..., description="City or place name (e.g. Kalyan-Dombivli)")
    district: Optional[str] = Field(None, description="Administrative District")
    state: Optional[str] = Field(None, description="State (e.g. Maharashtra)")
    latitude: float = Field(..., description="Exact GPS latitude")
    longitude: float = Field(..., description="Exact GPS longitude")
    valid_from: str = Field(..., description="ISO timestamp start")
    valid_until: str = Field(..., description="ISO timestamp expiry")
    source: str = Field(..., description="Authoritative source (IMD or WeatherGPT Early Warning Engine)")
    source_url: Optional[str] = Field(None, description="Official citation URL")
    confidence: Optional[float] = Field(None, description="Confidence score (0.0 to 1.0 or None)")
    recommended_actions: List[str] = Field(default_factory=list, description="Practical citizen safety actions")
    what_to_avoid: List[str] = Field(default_factory=list, description="High-risk behaviors to avoid")
    is_read: bool = Field(False, description="Whether alert has been viewed by user")
    is_active: bool = Field(True, description="Whether alert is currently active")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Creation timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic and trigger telemetry")


class UserAlertPreferences(BaseModel):
    user_id: str
    severe_weather: bool = True
    heavy_rain: bool = True
    heatwave: bool = True
    cyclone: bool = True
    flood: bool = True
    strong_wind: bool = True
    thunderstorm: bool = True
    push_enabled: bool = False
    updated_at: Optional[str] = None


class UserAlertPreferencesUpdate(BaseModel):
    user_id: Optional[str] = None
    severe_weather: Optional[bool] = None
    heavy_rain: Optional[bool] = None
    heatwave: Optional[bool] = None
    cyclone: Optional[bool] = None
    flood: Optional[bool] = None
    strong_wind: Optional[bool] = None
    thunderstorm: Optional[bool] = None
    push_enabled: Optional[bool] = None


class CurrentAlertsResponse(BaseModel):
    success: bool = True
    location: Dict[str, Any]
    active_count: int
    alerts: List[CitizenAlert] = []
    top_alert: Optional[CitizenAlert] = None
    summary_message: str
    evaluated_at: str


class AlertHistoryResponse(BaseModel):
    success: bool = True
    location: Dict[str, Any]
    history: List[CitizenAlert] = []
    total: int


class SingleAlertResponse(BaseModel):
    success: bool = True
    alert: CitizenAlert


class AlertsApiResponse(BaseModel):
    success: bool = True
    alerts: List[IMDAlert] = []
    location_mapped: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    message: Optional[str] = None
