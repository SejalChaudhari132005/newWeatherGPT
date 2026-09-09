"""
IMD API Diagnostics & Health Routes.
Provides internal verification of configured IMD API credentials and capability coverage.
Safe for admin/developer inspection; never exposes secrets or raw keys.
"""

from fastapi import APIRouter, Query
from typing import Optional, Dict, Any

from backend.app.services.imd.imd_diagnostics import imd_diagnostic_service
from backend.app.services.imd.imd_client import imd_client

router = APIRouter(prefix="/api/imd", tags=["IMD Diagnostics"])


@router.get("/status")
async def get_imd_status() -> Dict[str, Any]:
    """
    Get lightweight IMD API configuration and gateway status.
    """
    key_info = imd_client.get_masked_key_info()
    return {
        "provider": "India Meteorological Department (IMD)",
        "base_url": imd_client.base_url,
        "is_configured": key_info["configured"],
        "key_length": key_info["length"],
        "masked_key": key_info["masked"],
        "status": "configured" if key_info["configured"] else "missing_key",
    }


@router.get("/diagnostics")
async def run_imd_diagnostics(
    latitude: float = Query(19.2597, description="Latitude for location-specific testing"),
    longitude: float = Query(73.1339, description="Longitude for location-specific testing"),
    city: Optional[str] = Query(None, description="City hint"),
    district: Optional[str] = Query(None, description="District hint"),
    state: Optional[str] = Query(None, description="State hint"),
) -> Dict[str, Any]:
    """
    Run comprehensive diagnostic test suite across all 10 official IMD capabilities.
    Evaluates Current Weather, Lat/Lon Weather, Forecast, Nowcast, Warnings, Rainfall,
    Cyclone, Fishermen Warning, Radar, and Lightning.
    """
    report = await imd_diagnostic_service.run_diagnostics(
        latitude=latitude,
        longitude=longitude,
        city_hint=city,
        district_hint=district,
        state_hint=state,
    )
    return report
