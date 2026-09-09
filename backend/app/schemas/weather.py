from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from backend.app.schemas.alerts import IMDAlert

class LocationMeta(BaseModel):
    latitude: float
    longitude: float
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    imd_station: Optional[str] = None
    imd_subdivision: Optional[str] = None

class CurrentWeather(BaseModel):
    temperature: Optional[float] = None
    feels_like: Optional[float] = None
    humidity: Optional[float] = None
    precipitation: Optional[float] = None
    rain_probability: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[Union[str, float]] = None
    pressure: Optional[float] = None
    visibility: Optional[float] = None
    uv_index: Optional[float] = None
    condition: str = "Clear Sky"
    icon: Optional[str] = "sun"
    weather_code: Optional[int] = 0
    observed_at: str
    source: str = "Open-Meteo"

class HourlyForecastItem(BaseModel):
    time: str
    iso_time: Optional[str] = None
    temp: Optional[float] = None
    condition: str
    icon: str
    rainProb: Optional[float] = 0
    highlight: Optional[bool] = False
    source: str = "Open-Meteo"
    weather_code: Optional[int] = None
    precipitation: Optional[float] = None
    wind_speed: Optional[float] = None

class DailyForecastItem(BaseModel):
    day: str
    date: str
    high: Optional[float] = None
    low: Optional[float] = None
    condition: str
    icon: str
    rainProbability: Optional[float] = 0
    humidity: Optional[float] = None
    source: str = "Open-Meteo"

class WeatherSource(BaseModel):
    provider: str = "Open-Meteo"
    retrieved_at: str
    is_cached: bool = False

class IMDOfficialInformation(BaseModel):
    source: str = "India Meteorological Department"
    status: str = "available"  # "available" | "unavailable"
    station_name: Optional[str] = None
    station_code: Optional[str] = None
    district: Optional[str] = None
    subdivision: Optional[str] = None
    observed_at: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall_past_24h: Optional[float] = None
    forecast_summary: Optional[str] = None
    attribution: str = "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India"
    message: Optional[str] = None

class WeatherData(BaseModel):
    location: LocationMeta
    current: CurrentWeather
    hourly: List[HourlyForecastItem] = []
    daily: List[DailyForecastItem] = []
    source: WeatherSource
    official_information: Optional[IMDOfficialInformation] = None
    alerts: List[IMDAlert] = []

class WeatherApiResponse(BaseModel):
    success: bool = True
    data: Optional[WeatherData] = None
    message: Optional[str] = None
