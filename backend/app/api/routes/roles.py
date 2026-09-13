import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException

from backend.app.services.agri_weather_service import agri_weather_service
from backend.app.services.marine_weather_service import marine_weather_service
from backend.app.services.fish_finder_service import fish_finder_service
from backend.app.services.aviation_weather_service import aviation_weather_service, INDIAN_AIRPORTS_CATALOG
from backend.app.services.skyroute_service import skyroute_service
from backend.app.schemas.skyroute import SkyRouteResponse
from backend.app.schemas.role_intelligence import (
    FarmerDecisionResponse,
    MarineDecisionResponse,
    AviationBriefingResponse,
    AirportComparisonResponse,
    AirportCatalogResponse,
)

logger = logging.getLogger("roles_router")
router = APIRouter(prefix="/roles", tags=["Role Decision Intelligence"])


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.get("/airports", response_model=AirportCatalogResponse)
async def list_airports() -> AirportCatalogResponse:
    """List supported Indian airports with exact magnetic runway orientations."""
    airports = aviation_weather_service.get_airports_catalog()
    return AirportCatalogResponse(success=True, airports=airports)


@router.get("/farmer/decisions", response_model=FarmerDecisionResponse)
async def get_farmer_decisions(
    latitude: float = Query(..., ge=-90, le=90, description="Field latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Field longitude"),
    crop: str = Query("soybean", description="Crop name (e.g., soybean, cotton, wheat, rice)"),
    stage: str = Query("flowering", description="Crop growth stage (e.g., vegetative, flowering, pod_filling, maturity)"),
    planned_spray_hour: Optional[int] = Query(8, ge=0, le=23, description="Planned spray hour in 24h format"),
) -> FarmerDecisionResponse:
    """
    Decision Intelligence Engine for Farmers (🌾 MY FARM).
    Provides field soil state, Best Farming Windows, wash-off & drift spraying risks, and disease propensity.
    """
    try:
        decision_data = await agri_weather_service.generate_farmer_decision(
            latitude=latitude,
            longitude=longitude,
            crop=crop,
            stage=stage,
            planned_spray_hour=planned_spray_hour,
        )
        return FarmerDecisionResponse(success=True, data=decision_data)
    except Exception as exc:
        logger.error(f"Failed to generate farmer decisions: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to generate farmer decisions: {exc}")


@router.get("/fisher/decisions", response_model=MarineDecisionResponse)
async def get_marine_decisions(
    latitude: float = Query(..., ge=-90, le=90, description="Harbor / Sea latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Harbor / Sea longitude"),
    departure_time: str = Query("05:30", description="Planned departure time (e.g. 05:30 or 06:00)"),
) -> MarineDecisionResponse:
    """
    Decision Intelligence Engine for Fishermen (🎣 MY SEA).
    Evaluates wave heights, swell period, safe sailing clearance, zone-tiered risk, and return-time deadline.
    """
    try:
        decision_data = await marine_weather_service.generate_marine_decision(
            latitude=latitude,
            longitude=longitude,
            departure_time=departure_time,
        )
        return MarineDecisionResponse(success=True, data=decision_data)
    except Exception as exc:
        logger.error(f"Failed to generate marine decisions: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to generate marine decisions: {exc}")


@router.get("/fisher/fishfinder")
async def get_fishfinder_intelligence(
    latitude: float = Query(..., ge=-90, le=90, description="Harbor / Coastal latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Harbor / Coastal longitude"),
    harbor_name: Optional[str] = Query(None, description="Optional Harbor / Port name"),
    date_filter: str = Query("today", description="Date filter: today | tomorrow | 3days"),
    hour_offset: int = Query(0, ge=0, le=72, description="Hourly timeline offset"),
):
    """
    FishFinder Marine Opportunity & Fishing Intelligence Map Engine.
    Returns geographic GeoJSON coastal opportunity zones, SST, Chlorophyll-a, ocean currents,
    INCOIS PFZ status, wave heights, wind vectors, and independent marine safety ratings.
    """
    try:
        data = await fish_finder_service.get_fishfinder_data(
            latitude=latitude,
            longitude=longitude,
            harbor_name=harbor_name,
            date_filter=date_filter,
            hour_offset=hour_offset,
        )
        return data
    except Exception as exc:
        logger.error(f"Failed to generate fishfinder data: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to generate fishfinder data: {exc}")



@router.get("/aviation/briefing", response_model=AviationBriefingResponse)
async def get_aviation_briefing(
    icao: str = Query("VABB", description="ICAO airport code (e.g. VABB, VIDP, VOBL, VOMM, VAPO, VOHS, VECC, VOCI)"),
    active_runway_override: Optional[str] = Query(None, description="Optional override for active runway ID (e.g. 27, 28, 09L)"),
) -> AviationBriefingResponse:
    """
    Decision Intelligence Engine for Aviation Briefing (✈️ MY OPERATIONS).
    Computes Runway Crosswind/Headwind components, Flight Category (VFR/MVFR/IFR), and structured pilot briefing.
    """
    icao_upper = icao.upper().strip()
    if icao_upper not in INDIAN_AIRPORTS_CATALOG:
        raise HTTPException(
            status_code=404,
            detail=f"Airport '{icao}' not found in supported Indian airports catalog. Supported: {list(INDIAN_AIRPORTS_CATALOG.keys())}",
        )

    try:
        briefing_data = await aviation_weather_service.generate_aviation_briefing(
            icao=icao_upper,
            active_runway_override=active_runway_override,
        )
        return AviationBriefingResponse(success=True, data=briefing_data)
    except Exception as exc:
        logger.error(f"Failed to generate aviation briefing for {icao}: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to generate aviation briefing for {icao}: {exc}")


@router.get("/aviation/compare", response_model=AirportComparisonResponse)
async def compare_airports(
    icao1: str = Query("VABB", description="Origin airport ICAO code (e.g. VABB)"),
    icao2: str = Query("VAPO", description="Destination airport ICAO code (e.g. VAPO)"),
) -> AirportComparisonResponse:
    """
    Side-by-side Aviation Comparison Engine.
    Compares landing conditions, crosswinds, flight categories, and enroute hazards between two airports.
    """
    try:
        comp_data = await aviation_weather_service.compare_airports(
            icao1=icao1.upper().strip(),
            icao2=icao2.upper().strip(),
        )
        return AirportComparisonResponse(success=True, data=comp_data)
    except Exception as exc:
        logger.error(f"Failed to compare airports {icao1} vs {icao2}: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to compare airports {icao1} vs {icao2}: {exc}")


@router.get("/aviation/skyroute", response_model=SkyRouteResponse)
async def get_skyroute_corridor(
    origin: str = Query("VABB", description="Departure airport ICAO or city (e.g. VABB, BOM, Mumbai)"),
    destination: str = Query("VIDP", description="Arrival airport ICAO or city (e.g. VIDP, DEL, Delhi)"),
) -> SkyRouteResponse:
    """
    SkyRoute — Weather-Aware Flight Route Intelligence Engine.
    Generates geodesic flight corridor, detects hazard intersections, calculates Weather Risk Index,
    and returns 3-stage flight breakdown with factual meteorological briefing.
    """
    try:
        data = await skyroute_service.analyze_sky_route(
            origin_query=origin,
            dest_query=destination,
        )
        return SkyRouteResponse(success=True, data=data)
    except Exception as exc:
        logger.error(f"Failed to generate SkyRoute analysis: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to generate SkyRoute analysis: {exc}")

