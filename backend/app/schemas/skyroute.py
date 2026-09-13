"""
Pydantic Schemas for SkyRoute - Weather-Aware Flight Route Intelligence
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

class AirportEndpoint(BaseModel):
    icao: str
    iata: str
    name: str
    city: str
    state: str
    latitude: float
    longitude: float
    elevation_ft: Optional[int] = None

class RouteGeometry(BaseModel):
    type: Literal["LineString"] = "LineString"
    coordinates: List[List[float]]  # [[lon, lat], ...]

class CorridorGeometry(BaseModel):
    type: Literal["Polygon"] = "Polygon"
    coordinates: List[List[List[float]]]  # [[[lon, lat], ...]]

class RouteStageInfo(BaseModel):
    title: str
    location_name: str
    risk_level: Literal["LOW", "MODERATE", "HIGH", "SEVERE"]
    weather_condition: str
    temperature_c: float
    visibility_km: float
    wind_kts: float
    summary: str
    concerns: List[str] = []

class WeatherHazardFeature(BaseModel):
    hazard_id: str
    type: Literal["thunderstorm", "rain", "wind", "turbulence", "visibility", "warning"]
    title: str
    severity: Literal["LOW", "MODERATE", "HIGH", "SEVERE"]
    location_description: str
    coordinates_center: List[float]  # [lat, lon]
    geometry: Dict[str, Any]  # GeoJSON Polygon / MultiPolygon / Point
    distance_from_corridor_km: float
    route_impact: Literal["INTERSECTION", "NEAR ROUTE", "OFF ROUTE"]
    expected_time_window: str
    operational_impact: str
    source: str = "IMD"
    updated_at: str
    valid_until: Optional[str] = None
    parameters: Dict[str, Any] = {}

class RouteRiskSummary(BaseModel):
    score: int = Field(ge=0, le=100, description="0=low concern, 100=severe concern")
    level: Literal["LOW", "MODERATE", "HIGH", "SEVERE"]
    confidence: Literal["HIGH", "MODERATE", "LIMITED"]
    available_parameters_count: int
    total_parameters_count: int = 6
    total_hazards: int
    route_intersections: int
    near_route_hazards: int
    major_concern: str
    rationale: str

class SkyRouteData(BaseModel):
    origin: AirportEndpoint
    destination: AirportEndpoint
    distance_nm: int
    distance_km: int
    estimated_flight_time: str
    route_linestring: RouteGeometry
    corridor_polygon: CorridorGeometry
    risk_summary: RouteRiskSummary
    stages: Dict[str, RouteStageInfo]  # departure, enroute, arrival
    hazards: List[WeatherHazardFeature]
    ai_weather_brief: str
    sources: List[Dict[str, str]]
    disclaimer: str
    generated_at: str

class SkyRouteResponse(BaseModel):
    success: bool
    data: Optional[SkyRouteData] = None
    message: Optional[str] = None
