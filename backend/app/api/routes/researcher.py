"""
API endpoints for Researcher Intelligence & WeatherLab workspace.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from backend.app.services.researcher_service import researcher_service
from backend.app.schemas.researcher import (
    NWPComparisonResponse,
    ClimateAnomalyMetrics,
    DatasetItem,
    ResearchReportRequest,
    ResearchReportData,
    WeatherLabSummaryResponse,
)

router = APIRouter(prefix="/roles/researcher", tags=["Researcher Intelligence / WeatherLab"])


@router.get("/summary")
async def get_weatherlab_summary(
    lat: float = Query(19.0760, description="Latitude"),
    lon: float = Query(72.8777, description="Longitude"),
    location_name: str = Query("Mumbai, Maharashtra", description="Location name"),
):
    """Returns complete WeatherLab workspace summary (NWP consensus, climate anomalies, datasets, recent reports)."""
    try:
        nwp = await researcher_service.get_nwp_model_comparison(lat, lon, location_name)
        anomalies = researcher_service.get_climate_anomalies(location_name)
        datasets = researcher_service.get_available_datasets()

        recent_reports = [
            {
                "id": "REP-20250912-1102",
                "title": "Monsoon 2025 - Rainfall Analysis",
                "date": "12 Sep 2025",
                "format": "PDF",
                "size": "2.4 MB",
            },
            {
                "id": "REP-20250910-0941",
                "title": "Cyclone Impact Assessment - Bay of Bengal",
                "date": "10 Sep 2025",
                "format": "PDF",
                "size": "3.8 MB",
            },
            {
                "id": "REP-20250908-0814",
                "title": "Temperature Anomaly Report - India",
                "date": "08 Sep 2025",
                "format": "PDF",
                "size": "1.9 MB",
            },
        ]

        active_layers = [
            "Rainfall (24h)",
            "Radar Reflectivity",
            "Wind Vectors",
            "Temperature",
            "Cyclone Track",
            "Country Boundaries",
            "District Boundaries",
        ]

        return {
            "success": True,
            "location_name": location_name,
            "timestamp": nwp.generated_at,
            "nwp_comparison": nwp,
            "climate_anomalies": anomalies,
            "available_datasets": datasets,
            "recent_reports": recent_reports,
            "active_layers": active_layers,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nwp-comparison", response_model=NWPComparisonResponse)
async def get_nwp_comparison(
    lat: float = Query(19.0760, description="Latitude"),
    lon: float = Query(72.8777, description="Longitude"),
    location_name: str = Query("Mumbai, Maharashtra", description="Location name"),
):
    """Returns multi-model NWP forecast intercomparison (GFS vs ECMWF vs IMD/WRF)."""
    return await researcher_service.get_nwp_model_comparison(lat, lon, location_name)


@router.get("/climate-anomalies", response_model=ClimateAnomalyMetrics)
async def get_climate_anomalies(
    location_name: str = Query("Mumbai, Maharashtra", description="Location name"),
):
    """Returns 30-year climatological baseline (1991–2020) anomalies."""
    return researcher_service.get_climate_anomalies(location_name)


@router.get("/datasets")
async def get_datasets():
    """Returns catalog of authentic meteorological datasets available for researcher download."""
    return {"success": True, "datasets": researcher_service.get_available_datasets()}


@router.post("/reports/generate", response_model=ResearchReportData)
async def generate_report(req: ResearchReportRequest):
    """Generates a structured academic research report from real data calculations and citations."""
    return researcher_service.generate_research_report(req)


@router.get("/query")
async def query_research_assistant(
    q: str = Query(..., description="Research query"),
    location: str = Query("Mumbai, Maharashtra", description="Location"),
):
    """Answers natural-language research questions strictly grounded in meteorological telemetry."""
    return researcher_service.answer_research_query(q, location)
