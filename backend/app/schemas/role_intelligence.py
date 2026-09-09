from datetime import datetime
from typing import Optional, List, Dict, Any, Literal, Union
from pydantic import BaseModel, Field
from backend.app.schemas.weather import LocationMeta

# ---------------------------------------------------------------------------
# Common / Shared Types
# ---------------------------------------------------------------------------

DecisionBadgeColor = Literal["green", "yellow", "orange", "red"]

class DecisionProvenance(BaseModel):
    source: str = "Open-Meteo & IMD Decision Fusion"
    evaluated_at: str
    confidence_score: int = Field(default=90, ge=0, le=100)
    disclaimer: str = "WeatherGPT decision assistance. Always adhere to official IMD/INCOIS/DGCA advisories."


# ---------------------------------------------------------------------------
# 🌾 Farmer (My Farm) Contracts
# ---------------------------------------------------------------------------

class SoilStateData(BaseModel):
    moisture_surface_0_to_7cm: Optional[float] = Field(None, description="Soil moisture 0-7cm in m³/m³")
    moisture_rootzone_7_to_28cm: Optional[float] = Field(None, description="Soil moisture 7-28cm in m³/m³")
    soil_temperature_surface_c: Optional[float] = Field(None, description="Surface soil temperature in °C")
    et0_evapotranspiration_mm: Optional[float] = Field(None, description="Reference FAO-56 evapotranspiration (ET0) in mm")
    moisture_status: Literal["deficit", "optimal", "saturated", "waterlogged"] = "optimal"
    irrigation_urgency: Literal["none", "low", "moderate", "critical"] = "none"

class FarmingWindowSlot(BaseModel):
    start_time: str
    end_time: str
    activity: Literal["spraying", "irrigation", "harvesting", "sowing", "field_work"]
    suitability: Literal["optimal", "moderate", "unfavorable"]
    score: int = Field(..., ge=0, le=100, description="Suitability score (0-100)")
    rationale: str
    limiting_factor: Optional[str] = None

class SprayingRiskAssessment(BaseModel):
    overall_risk: Literal["LOW", "MODERATE", "HIGH"]
    badge_color: DecisionBadgeColor
    wash_off_risk: Literal["NONE", "LOW", "MODERATE", "HIGH"]
    drift_risk: Literal["LOW", "MODERATE", "HIGH"]
    optimal_window: Optional[str] = None
    rain_expected_hours_after: Optional[float] = None
    wind_speed_kmh: float
    recommendations: List[str] = []

class PestDiseaseRisk(BaseModel):
    crop: str
    disease_or_pest_name: str
    risk_level: Literal["low", "moderate", "high"]
    favorable_conditions: str
    preventive_action: str

class FarmerDecisionData(BaseModel):
    location: LocationMeta
    crop: str
    phenological_stage: str
    current_temp_c: float
    current_humidity_pct: float
    current_rain_prob_pct: float
    soil_state: SoilStateData
    best_farming_windows: List[FarmingWindowSlot] = []
    spraying_suitability: SprayingRiskAssessment
    pest_disease_risks: List[PestDiseaseRisk] = []
    executive_summary: str
    regional_advisory_text: str
    provenance: DecisionProvenance
    generated_at: str

class FarmerDecisionResponse(BaseModel):
    success: bool = True
    data: Optional[FarmerDecisionData] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# 🎣 Fisherman (My Sea) Contracts
# ---------------------------------------------------------------------------

class SailingClearance(BaseModel):
    status: Literal["favorable", "caution", "no_departure"]
    badge_color: DecisionBadgeColor
    primary_reason: str
    max_wave_height_m: float
    max_wind_speed_kts: float
    squall_risk: bool = False
    clearance_window: Optional[str] = None

class TemporalMarineSlot(BaseModel):
    time_slot: str
    status: Literal["favorable", "caution", "dangerous"]
    badge_color: DecisionBadgeColor
    wave_height_m: float
    wind_speed_kts: float
    swell_period_s: float
    wind_direction_deg: Optional[int] = None
    notes: str

class ReturnTimeAnalysis(BaseModel):
    departure_time: str
    recommended_return_time: str
    cutoff_hour: str
    safe_duration_hours: float
    deterioration_reason: str
    alert_level: Literal["normal", "warning", "critical"] = "normal"

class TideExtrema(BaseModel):
    tide_type: Literal["high", "low"]
    time: str
    height_m: float

class ZoneRisk(BaseModel):
    zone_name: Literal["Near-Shore (0-5 nm)", "Coastal (5-20 nm)", "Deep-Sea (>20 nm)"]
    risk_level: Literal["low", "moderate", "high", "severe"]
    max_wave_height_m: float
    advisory: str

class SeaStateSummary(BaseModel):
    wave_height_m: float
    wave_period_s: float
    wave_direction_deg: int
    swell_height_m: float
    swell_period_s: float
    ocean_current_knots: Optional[float] = None
    sea_surface_temp_c: Optional[float] = None
    beaufort_scale: int = 2
    beaufort_description: str = "Light Breeze"

class MarineDecisionData(BaseModel):
    location: LocationMeta
    departure_time: str
    sailing_clearance: SailingClearance
    return_time_intelligence: ReturnTimeAnalysis
    sea_state: SeaStateSummary
    temporal_curve: List[TemporalMarineSlot] = []
    zone_risks: List[ZoneRisk] = []
    tide_schedule: List[TideExtrema] = []
    official_bulletin: Optional[str] = "IMD/INCOIS Coastal Warning: Regular seasonal sea conditions."
    sos_emergency_contact: str = "Indian Coast Guard SOS: 1554"
    vernacular_advisory_text: str
    provenance: DecisionProvenance
    generated_at: str

class MarineDecisionResponse(BaseModel):
    success: bool = True
    data: Optional[MarineDecisionData] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# ✈️ Aviation (My Operations) Contracts
# ---------------------------------------------------------------------------

class FlightRules(BaseModel):
    category: Literal["VFR", "MVFR", "IFR", "LVP"]
    ceiling_ft_agl: Optional[int] = None
    visibility_meters: float
    rationale: str

class RunwayWindComponent(BaseModel):
    runway_id: str
    runway_heading_deg: int
    wind_speed_kts: float
    wind_direction_deg: int
    wind_gusts_kts: Optional[float] = None
    headwind_kts: float
    crosswind_kts: float
    crosswind_direction: Literal["left", "right", "head", "tail"] = "head"
    is_crosswind_exceeded: bool = False
    max_demonstrated_crosswind_kts: float = 25.0
    operational_status: Literal["normal", "caution", "exceeded"] = "normal"

class PeriodRequiringAttention(BaseModel):
    time_window: str
    hazard_type: Literal["crosswind", "gust", "convective_storm", "low_visibility", "wind_shear", "icing"]
    severity: Literal["caution", "warning", "critical"]
    operational_impact: str
    suggested_action: str

class DecodedMetarToken(BaseModel):
    token: str
    meaning: str
    category: Literal["station", "time", "wind", "visibility", "weather", "clouds", "temp_dew", "altimeter", "remark"]
    is_hazard: bool = False

class DecodedMetarTaf(BaseModel):
    raw_metar: Optional[str] = None
    raw_taf: Optional[str] = None
    plain_english_briefing: str
    tokens: List[DecodedMetarToken] = []

class AviationBriefingData(BaseModel):
    icao: str
    iata: Optional[str] = None
    airport_name: str
    city: str
    coordinates: Dict[str, float]
    flight_rules: FlightRules
    active_runway: RunwayWindComponent
    alternate_runways: List[RunwayWindComponent] = []
    conversational_briefing: str
    period_requiring_attention: Optional[PeriodRequiringAttention] = None
    decoded_metar_taf: DecodedMetarTaf
    temperature_c: float
    dew_point_c: float
    surface_pressure_hpa: float
    cloud_cover_pct: int
    convective_risk: Literal["none", "low", "moderate", "high"] = "low"
    cape_j_kg: Optional[float] = None
    provenance: DecisionProvenance
    generated_at: str

class AviationBriefingResponse(BaseModel):
    success: bool = True
    data: Optional[AviationBriefingData] = None
    message: Optional[str] = None

class AirportComparisonData(BaseModel):
    origin: AviationBriefingData
    destination: AviationBriefingData
    comparative_summary: str
    favorable_airport: str
    enroute_risk_level: Literal["low", "moderate", "high"] = "low"
    generated_at: str

class AirportComparisonResponse(BaseModel):
    success: bool = True
    data: Optional[AirportComparisonData] = None
    message: Optional[str] = None

class AirportCatalogItem(BaseModel):
    icao: str
    iata: str
    name: str
    city: str
    state: str
    latitude: float
    longitude: float
    elevation_ft: int
    runways: List[Dict[str, Any]]

class AirportCatalogResponse(BaseModel):
    success: bool = True
    airports: List[AirportCatalogItem] = []
