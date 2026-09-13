"""
Pydantic schemas for Disaster Management / Situational Weather Intelligence (Theme 8).
Covers situational risk assessment, active alerts stream, rainfall intensity/flood gauge,
lightning & squall wind hazards, vulnerable zones triage, and emergency briefings.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ActiveAlertItem(BaseModel):
    id: str
    severity: str  # RED, ORANGE, YELLOW, GREEN
    hazard_type: str  # Heavy Rain, Cloudburst, Flash Flood, Thunderstorm, High Wind, Cyclone
    headline: str
    affected_areas: List[str] = []
    issued_at: str
    valid_until: str
    action_advisory: str
    source: str = "IMD Official"


class VulnerableZoneItem(BaseModel):
    zone_name: str
    taluka_or_ward: str
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    exposed_population: int
    critical_infrastructure: List[str] = []
    waterlogging_propensity: str  # LOW, MEDIUM, HIGH, SEVERE
    evacuation_readiness: str  # STANDBY, ALERT, ACTIVE


class SituationalRiskData(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    risk_headline: str
    active_alerts_count: int
    rainfall_intensity_mmh: float
    rainfall_24h_mm: float
    flood_risk_level: str  # LOW, MODERATE, HIGH, SEVERE
    flood_risk_score: int  # 0 - 100
    wind_speed_kmh: float
    wind_gust_kmh: float
    lightning_strike_density: int  # strikes / 10km radius proxy
    convective_cape_index: float  # J/kg
    primary_hazard: str
    affected_area_summary: str
    updated_at: str
    is_emergency_active: bool = False


class DisasterBriefingResponse(BaseModel):
    success: bool
    location_name: str
    timestamp: str
    situational_risk: SituationalRiskData
    active_alerts: List[ActiveAlertItem]
    vulnerable_zones: List[VulnerableZoneItem]
    emergency_contacts: List[Dict[str, str]]
    narrative_briefing: str
