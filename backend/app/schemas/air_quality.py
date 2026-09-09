from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AirQualityLocation(BaseModel):
    latitude: float
    longitude: float
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"

class PollutantItem(BaseModel):
    code: str
    name: str
    value: Optional[float] = None
    unit: str = "μg/m³"
    category: str = "UNKNOWN"
    category_label: str = "Unknown"
    is_primary: bool = False
    description: str = ""

class AirQualityData(BaseModel):
    aqi: Optional[int] = None
    aqi_scale: str = "European AQI (CAMS)"
    category: str = "UNKNOWN"
    category_label: str = "Unknown"
    primary_pollutant: Optional[str] = None
    primary_pollutant_name: Optional[str] = None
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    co: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    o3: Optional[float] = None
    timestamp: Optional[str] = None
    pollutants: List[PollutantItem] = Field(default_factory=list)

class AirQualityInterpretation(BaseModel):
    category: str
    category_label: str
    primary_pollutant: Optional[str] = None
    primary_pollutant_name: Optional[str] = None
    outdoor_advisory: str
    sensitive_group_advisory: str
    combined_weather_note: Optional[str] = None
    trend: str = "UNKNOWN"  # IMPROVING, STABLE, WORSENING, UNKNOWN
    trend_description: str = ""
    confidence: str = "HIGH"
    data_timestamp: Optional[str] = None

class AirQualityCurrentResponse(BaseModel):
    success: bool
    location: AirQualityLocation
    air_quality: AirQualityData
    interpretation: AirQualityInterpretation
    source: str = "Open-Meteo / CAMS European Model"
    updated_at: str

class HourlyAirQualityItem(BaseModel):
    time: str
    timestamp: int
    hour_label: str
    aqi: Optional[int] = None
    category: str = "UNKNOWN"
    category_label: str = "Unknown"
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None

class AirQualityHourlyResponse(BaseModel):
    success: bool
    location: AirQualityLocation
    scale: str = "European AQI (CAMS)"
    trend: str = "UNKNOWN"
    trend_summary: str = ""
    hours: List[HourlyAirQualityItem] = Field(default_factory=list)
    source: str = "Open-Meteo / CAMS European Model"
    updated_at: str
