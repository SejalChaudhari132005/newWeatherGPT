"""
FastAPI REST endpoints for Disaster Management Situational Intelligence (Theme 8).
Provides live situational risk metrics, active alerts stream, vulnerable zones triage, and EOC briefings.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException

from backend.app.services.disaster_weather_service import disaster_weather_service
from backend.app.schemas.disaster import (
    SituationalRiskData,
    ActiveAlertItem,
    VulnerableZoneItem,
    DisasterBriefingResponse,
)

router = APIRouter(prefix="/roles/disaster", tags=["Disaster Management Intelligence"])


@router.get("/situational-risk", response_model=SituationalRiskData)
async def get_situational_risk(
    lat: float = Query(18.5204, description="Latitude (default: Pune)"),
    lon: float = Query(73.8567, description="Longitude (default: Pune)"),
    location_name: str = Query("Pune District", description="District or Region name"),
):
    """
    Returns real-time situational weather intelligence:
    Composite risk level, active alerts count, rainfall intensity, flood vulnerability score,
    wind gusts, and convective lightning strike density.
    """
    try:
        return await disaster_weather_service.get_situational_risk(lat, lon, location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate situational risk: {str(e)}")


@router.get("/alerts-stream", response_model=List[ActiveAlertItem])
async def get_active_alerts_stream(
    lat: float = Query(18.5204, description="Latitude"),
    lon: float = Query(73.8567, description="Longitude"),
    location_name: str = Query("Pune District", description="District or Region name"),
):
    """
    Returns live feed of active IMD severe alerts (Red/Orange/Yellow) with validity windows
    and emergency action recommendations.
    """
    try:
        return await disaster_weather_service.get_active_alerts_stream(lat, lon, location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream active alerts: {str(e)}")


@router.get("/vulnerable-zones", response_model=List[VulnerableZoneItem])
async def get_vulnerable_zones(
    location_name: str = Query("Pune District", description="District or Region name"),
    flood_score: int = Query(45, description="Flood score (0-100)"),
):
    """
    Returns triage matrix of administrative talukas/wards with exposed populations,
    critical infrastructure (hospitals, bridges, power grids), and evacuation readiness.
    """
    try:
        return await disaster_weather_service.get_vulnerable_zones(location_name, flood_score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve vulnerable zones: {str(e)}")


@router.get("/briefing", response_model=DisasterBriefingResponse)
async def get_disaster_briefing(
    lat: float = Query(18.5204, description="Latitude"),
    lon: float = Query(73.8567, description="Longitude"),
    location_name: str = Query("Pune District", description="District or Region name"),
):
    """
    Returns complete situational intelligence package including risk assessment,
    active alerts stream, vulnerable zones, emergency helplines, and narrative EOC briefing.
    """
    try:
        return await disaster_weather_service.generate_disaster_briefing(lat, lon, location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate disaster briefing: {str(e)}")
