"""
FastAPI REST endpoints for Urban Planning & City Infrastructure Intelligence (Theme 9).
Provides live urban flood risk, runoff timeline, waterlogging hotspots triage,
Urban Heat Island (UHI) vulnerability, and infrastructure exposure.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException

from backend.app.services.urban_planner_service import urban_planner_service
from backend.app.schemas.urban_planner import (
    UrbanWeatherIntelligenceData,
    WaterloggingHotspot,
    DrainageRunoffMetric,
    HeatIslandMetric,
    InfrastructureExposureItem,
    UrbanPlannerBriefingResponse,
)

router = APIRouter(prefix="/roles/urban", tags=["Urban Planner Intelligence"])


@router.get("/intelligence", response_model=UrbanWeatherIntelligenceData)
async def get_urban_intelligence(
    lat: float = Query(18.5204, description="Latitude (default: Pune)"),
    lon: float = Query(73.8567, description="Longitude (default: Pune)"),
    location_name: str = Query("Pune Urban Core", description="City or Urban Center name"),
):
    """
    Returns real-time urban weather intelligence:
    Urban flood risk, 24h precipitation, peak rainfall window, storm drain surcharge %,
    and Urban Heat Island (UHI) delta.
    """
    try:
        return await urban_planner_service.get_urban_intelligence(lat, lon, location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate urban weather intelligence: {str(e)}")


@router.get("/waterlogging-hotspots", response_model=List[WaterloggingHotspot])
async def get_waterlogging_hotspots(
    location_name: str = Query("Pune Urban Core", description="City or Urban Center name"),
    flood_risk: str = Query("MODERATE", description="Flood risk level"),
):
    """
    Returns waterlogging hotspots, predicted inundation depth (cm), and municipal pumping directives.
    """
    try:
        return await urban_planner_service.get_waterlogging_hotspots(location_name, flood_risk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve waterlogging hotspots: {str(e)}")


@router.get("/drainage-timeline", response_model=List[DrainageRunoffMetric])
async def get_drainage_timeline(
    lat: float = Query(18.5204, description="Latitude"),
    lon: float = Query(73.8567, description="Longitude"),
):
    """
    Returns Rational Method drainage runoff vs sump design capacity timeline.
    """
    try:
        return await urban_planner_service.get_drainage_timeline(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate drainage timeline: {str(e)}")


@router.get("/heat-island-zones", response_model=List[HeatIslandMetric])
async def get_heat_island_zones(
    location_name: str = Query("Pune Urban Core", description="City or Urban Center name"),
    ambient_temp: float = Query(30.5, description="Current ambient temperature °C"),
):
    """
    Returns microclimate zones with Urban Heat Island (UHI) delta, surface temperature, and canopy cover.
    """
    try:
        return await urban_planner_service.get_heat_island_zones(location_name, ambient_temp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve heat island zones: {str(e)}")


@router.get("/infrastructure-exposure", response_model=List[InfrastructureExposureItem])
async def get_infrastructure_exposure(
    location_name: str = Query("Pune Urban Core", description="City or Urban Center name"),
):
    """
    Returns critical municipal infrastructure assets at risk (metro stations, hospital access, underpasses).
    """
    try:
        return await urban_planner_service.get_infrastructure_exposure(location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve infrastructure exposure: {str(e)}")


@router.get("/briefing", response_model=UrbanPlannerBriefingResponse)
async def get_urban_briefing(
    lat: float = Query(18.5204, description="Latitude"),
    lon: float = Query(73.8567, description="Longitude"),
    location_name: str = Query("Pune Urban Core", description="City or Urban Center name"),
):
    """
    Returns full briefing package for Urban Planners and Municipal Civil Engineers.
    """
    try:
        return await urban_planner_service.generate_urban_briefing(lat, lon, location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate urban briefing: {str(e)}")
