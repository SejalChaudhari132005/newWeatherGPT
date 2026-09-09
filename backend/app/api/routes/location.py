from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.core.logging import logger
from backend.app.agents.location_agent import location_agent
from backend.app.schemas.location import (
    LocationResolveRequest,
    LocationResolveResponse,
    LocationSearchResponse,
    NormalizedLocationResponse,
)

router = APIRouter(prefix="/location", tags=["Location"])

@router.get("/reverse-geocode", response_model=LocationResolveResponse, summary="Google Reverse Geocode Coordinates")
async def reverse_geocode(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate between -90 and 90"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate between -180 and 180"),
    source: Optional[str] = Query("gps")
):
    """
    Reverse geocode exact GPS coordinates into normalized location metadata.
    Exact coordinates are logged and preserved without rounding.
    """
    logger.info(f"[API] GET /api/location/reverse-geocode received: lat={latitude}, lng={longitude}, source={source}")
    try:
        resolved = await location_agent.resolve_location(latitude=latitude, longitude=longitude, source=source)
        return LocationResolveResponse(
            success=True,
            location=NormalizedLocationResponse(**resolved)
        )
    except Exception as e:
        logger.error(f"[API] Reverse geocoding failed for lat={latitude}, lng={longitude}: {str(e)}")
        # Failure payload retaining exact coordinates
        return LocationResolveResponse(
            success=False,
            location=NormalizedLocationResponse(
                latitude=latitude,
                longitude=longitude,
                source=source,
                provider="fallback"
            )
        )

@router.post("/resolve", response_model=LocationResolveResponse, summary="Resolve Coordinates (POST)")
async def resolve_location(req: LocationResolveRequest):
    """POST Endpoint for location resolution."""
    logger.info(f"[API] POST /api/location/resolve received: lat={req.latitude}, lng={req.longitude}, source={req.source}")
    try:
        resolved = await location_agent.resolve_location(
            latitude=req.latitude,
            longitude=req.longitude,
            source=req.source or "gps"
        )
        return LocationResolveResponse(
            success=True,
            location=NormalizedLocationResponse(**resolved)
        )
    except Exception as e:
        logger.error(f"[API] Location resolution failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/search", response_model=LocationSearchResponse, summary="Manual Location Search")
async def search_location(q: str = Query(..., min_length=1, description="Location search query")):
    """
    Search places/cities/villages/PIN codes across India for manual location selection.
    """
    logger.info(f"[API] GET /api/location/search query: '{q}'")
    try:
        data = await location_agent.search_location(q)
        return LocationSearchResponse(
            success=True,
            results=data.get("results", [])
        )
    except Exception as e:
        logger.error(f"[API] Location search failed for query '{q}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Location search failed: {str(e)}")
