"""
Pydantic schemas for Urban Planner / Urban Weather Intelligence (Theme 9).
Covers urban flood risk, rainfall & peak runoff windows, waterlogging hotspots,
drainage surcharge dynamics, Urban Heat Island (UHI) delta, and infrastructure exposure.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class WaterloggingHotspot(BaseModel):
    hotspot_name: str
    ward_name: str
    elevation_dip_m: float
    predicted_water_depth_cm: int
    drainage_status: str  # OPERATIONAL, AT CAPACITY, SURCHARGED, CRITICAL
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    mitigation_action: str


class DrainageRunoffMetric(BaseModel):
    time_window: str
    projected_rainfall_mm: float
    runoff_volume_m3_per_hr: float
    drainage_capacity_m3_per_hr: float
    capacity_status: str  # CLEAR, NEAR CAPACITY, SURCHARGED


class HeatIslandMetric(BaseModel):
    zone_name: str
    canopy_cover_pct: float
    impervious_surface_pct: float
    ambient_temp_c: float
    surface_temp_c: float
    uhi_delta_c: float
    vulnerability_rating: str  # LOW, MODERATE, HIGH, CRITICAL


class InfrastructureExposureItem(BaseModel):
    facility_name: str
    facility_type: str  # METRO_STATION, HOSPITAL_ACCESS, UNDERPASS, PRIMARY_ARTERIAL, POWER_SUBSTATION
    location_ward: str
    exposure_level: str  # LOW, MODERATE, HIGH, CRITICAL
    operational_impact: str
    recommended_action: str


class UrbanWeatherIntelligenceData(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    urban_flood_risk: str  # LOW, MODERATE, HIGH, CRITICAL
    rainfall_24h_mm: float
    peak_rainfall_window: str  # e.g., "4:00 PM – 7:00 PM"
    peak_intensity_mmh: float
    critical_infrastructure_risk_count: int  # e.g., 3 zones
    surface_runoff_coefficient: float  # Rational method C-factor (0.0 to 1.0)
    drainage_capacity_utilization_pct: int  # 0 to 100+ %
    urban_heat_island_delta_c: float  # Difference between urban core and rural baseline
    surface_temperature_c: float
    heat_stress_category: str  # LOW, MODERATE, HIGH, EXTREME
    air_ventilation_index: str  # GOOD, MODERATE, STAGNANT
    updated_at: str


class UrbanPlannerBriefingResponse(BaseModel):
    success: bool
    location_name: str
    timestamp: str
    urban_intelligence: UrbanWeatherIntelligenceData
    waterlogging_hotspots: List[WaterloggingHotspot]
    drainage_timeline: List[DrainageRunoffMetric]
    heat_island_zones: List[HeatIslandMetric]
    infrastructure_exposure: List[InfrastructureExposureItem]
    planning_recommendations: List[str]
