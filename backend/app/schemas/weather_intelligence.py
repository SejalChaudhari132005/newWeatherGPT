from datetime import datetime
from typing import Optional, List, Dict, Any, Union, Literal, Generic, TypeVar
from pydantic import BaseModel, Field

from backend.app.schemas.weather import LocationMeta, HourlyForecastItem, DailyForecastItem
from backend.app.schemas.alerts import IMDAlert

T = TypeVar("T")

class ProvenanceValue(BaseModel, Generic[T]):
    value: Optional[T] = None
    unit: Optional[str] = None
    source: str = "Unknown"
    observed_at: Optional[str] = None
    retrieved_at: Optional[str] = None

class CurrentIntelligence(BaseModel):
    temperature: ProvenanceValue[float]
    feels_like: ProvenanceValue[float]
    humidity: ProvenanceValue[float]
    wind_speed: ProvenanceValue[float]
    wind_direction: ProvenanceValue[Union[str, float]]
    pressure: ProvenanceValue[float]
    visibility: ProvenanceValue[float]
    uv_index: ProvenanceValue[float]
    precipitation: ProvenanceValue[float]
    rain_probability: ProvenanceValue[float]
    condition: str = "Clear Sky"
    icon: str = "sun"
    weather_code: Optional[int] = 0
    observed_at: str

class ForecastIntelligence(BaseModel):
    hourly: List[HourlyForecastItem] = []
    daily: List[DailyForecastItem] = []
    source: str = "Open-Meteo"

class OfficialObservation(BaseModel):
    source: str = "India Meteorological Department"
    station_name: Optional[str] = None
    station_code: Optional[str] = None
    district: Optional[str] = None
    subdivision: Optional[str] = None
    state: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall_past_24h: Optional[float] = None
    forecast_summary: Optional[str] = None
    observed_at: Optional[str] = None
    attribution: str = "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India"

class OfficialIntelligence(BaseModel):
    status: Literal["available", "unavailable", "partial"] = "available"
    observations: List[OfficialObservation] = []
    advisories: List[Dict[str, Any]] = []
    message: Optional[str] = None
    attribution: str = "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India"

RiskLevel = Literal["low", "moderate", "high", "extreme"]

class RiskItem(BaseModel):
    category: str
    level: RiskLevel
    score: int = Field(..., ge=0, le=100)
    reason: str
    icon: Optional[str] = None

class RiskAssessment(BaseModel):
    overall_level: RiskLevel = "low"
    items: Dict[str, RiskItem] = {}
    summary: str
    disclaimer: str = "WeatherGPT algorithmic risk assessment. Official safety directives are provided exclusively via IMD warnings."

InsightCategory = Literal[
    "rain",
    "temperature",
    "wind",
    "uv",
    "visibility",
    "comfort",
    "advisory",
    "general"
]

class WeatherInsight(BaseModel):
    id: str
    category: InsightCategory
    headline: str
    detail: str
    icon: str
    is_advisory: bool = False

class ConfidenceAssessment(BaseModel):
    score: int = Field(..., ge=0, le=100)
    level: Literal["low", "moderate", "high"] = "high"
    agreement_level: Literal["good", "moderate", "low", "unverified"] = "good"
    conflict_warnings: List[str] = []
    factors: List[str] = []
    note: str = "WeatherGPT algorithmic data confidence score"

class ProviderStatusItem(BaseModel):
    provider: str
    status: Literal["available", "degraded", "unavailable"] = "available"
    latency_ms: Optional[float] = None
    last_success: Optional[str] = None
    error: Optional[str] = None

class DataFreshness(BaseModel):
    observed_at: Optional[str] = None
    retrieved_at: str
    status: Literal["fresh", "recent", "stale"] = "fresh"
    age_minutes: int = 0

class WeatherIntelligenceData(BaseModel):
    location: LocationMeta
    current: CurrentIntelligence
    forecast: ForecastIntelligence
    official_information: OfficialIntelligence
    alerts: List[IMDAlert] = []
    risks: RiskAssessment
    insights: List[WeatherInsight] = []
    confidence: ConfidenceAssessment
    source_status: Dict[str, ProviderStatusItem] = {}
    data_freshness: DataFreshness
    generated_at: str

class WeatherIntelligenceResponse(BaseModel):
    success: bool = True
    data: Optional[WeatherIntelligenceData] = None
    message: Optional[str] = None
