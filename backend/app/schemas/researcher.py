"""
Pydantic schemas for WeatherLab / Researcher Intelligence.
Covers NWP model comparison (GFS, ECMWF, IMD/WRF), consensus, climate anomalies,
scientific datasets, research reports, and AI research assistant.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class NWPModelData(BaseModel):
    model_name: str  # GFS, ECMWF, IMD/WRF, ICON
    temperature_c: float
    rainfall_prob_pct: int
    rainfall_mm_24h: float
    wind_speed_kmh: float
    humidity_pct: int
    pressure_hpa: float
    hourly_series: List[Dict[str, Any]] = []


class NWPComparisonResponse(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    forecast_period: str
    models: Dict[str, NWPModelData]
    consensus_level: str  # HIGH, MODERATE, LOW
    consensus_summary: str
    disagreement_analysis: str
    uncertainty_rating: str  # Low, Moderate, High
    uncertainty_explanation: str
    timeline_dates: List[str] = []
    generated_at: str


class ClimateAnomalyMetrics(BaseModel):
    location_name: str
    baseline_period: str  # "1991–2020"
    current_temp_c: float
    current_temp_anomaly_c: float  # e.g. +1.2
    rainfall_season_mm: float
    rainfall_anomaly_pct: float  # e.g. +14.5%
    extreme_events_count_ytd: int
    historical_trend_points: List[Dict[str, Any]] = []
    summary: str


class DatasetItem(BaseModel):
    id: str
    name: str
    coverage: str
    resolution: str
    period: str
    format: str
    source: str
    file_size_mb: Optional[float] = None
    download_url: Optional[str] = None
    parameters: List[str] = []


class ResearchReportRequest(BaseModel):
    title: str
    report_type: str  # Weather Trend Analysis, Rainfall Analysis, Extreme Events, Climate Impact, NWP Intercomparison
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    period: str
    parameters: List[str] = ["temperature", "rainfall", "wind"]
    include_maps: bool = True
    include_charts: bool = True
    include_nwp: bool = True
    include_findings: bool = True
    custom_notes: Optional[str] = None


class ResearchReportData(BaseModel):
    report_id: str
    title: str
    report_type: str
    location_name: str
    generated_at: str
    executive_summary: str
    study_area: str
    data_sources: List[Dict[str, str]]
    methodology: str
    statistical_summary: Dict[str, Any]
    nwp_intercomparison: Optional[Dict[str, Any]] = None
    climate_trends: Optional[Dict[str, Any]] = None
    key_findings: List[str]
    limitations: List[str]
    citations: List[str]


class WeatherLabSummaryResponse(BaseModel):
    success: bool
    location_name: str
    timestamp: str
    nwp_comparison: NWPComparisonResponse
    climate_anomalies: ClimateAnomalyMetrics
    available_datasets: List[DatasetItem]
    recent_reports: List[Dict[str, Any]]
    active_layers: List[str]
