"""
Map & Radar Layer API for WeatherGPT Step 10.
Exposes available georeferenced layers, active Doppler radars, satellite, and coverage statuses.
"""

from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException
from backend.app.services.radar_service import imd_radar_service, IMD_RADAR_STATIONS
from backend.app.services.imd_weather_service import imd_weather_service

router = APIRouter(prefix="/map", tags=["Weather Map & Radar Layers"])


@router.get("/layers", summary="Get active map layers and nearest IMD radar station")
async def get_map_layers(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
):
    try:
        radar_info = imd_radar_service.get_radar_for_location(latitude, longitude)
        return {
            "success": True,
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "radar": radar_info.get("radar"),
            "all_radar_stations": [
                {
                    "id": s["id"],
                    "name": s["name"],
                    "city": s["city"],
                    "state": s["state"],
                    "latitude": s["latitude"],
                    "longitude": s["longitude"],
                    "status": s["status"],
                }
                for s in IMD_RADAR_STATIONS
            ],
            "supported_layers": [
                {"id": "radar", "name": "IMD Radar", "enabled": True, "source": "India Meteorological Department (IMD)"},
                {"id": "rainfall", "name": "Rainfall Intensity", "enabled": True, "source": "IMD + ECMWF Model"},
                {"id": "temperature", "name": "Surface Temperature", "enabled": True, "source": "IMD + ECMWF Model"},
                {"id": "wind", "name": "Wind Vector", "enabled": True, "source": "ECMWF / GFS Model"},
                {"id": "satellite", "name": "INSAT Satellite", "enabled": True, "source": "IMD INSAT-3DR / 3D"},
                {"id": "alerts", "name": "Severe Warnings", "enabled": True, "source": "IMD National Weather Forecasting Centre"},
            ]
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/radar-frames", summary="Get real-time radar timeline frames and tile URLs")
async def get_radar_frames():
    try:
        frames = await imd_radar_service.get_live_radar_frames()
        return frames
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/satellite", summary="Get INSAT-3DR meteorological satellite imagery")
async def get_satellite_imagery(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
):
    try:
        now_utc = datetime.now(timezone.utc)
        return {
            "success": True,
            "satellite": {
                "name": "INSAT-3DR / INSAT-3D Multi-Spectral Imager",
                "sector": "Indian Subcontinent & Arabian Sea / Bay of Bengal",
                "product": "Infrared (IR1) & RGB Composite Cloud Dynamics",
                "imagery_url": "https://mausam.imd.gov.in/Satellite/3Dasiasec_ir1.jpg",
                "rgb_url": "https://mausam.imd.gov.in/Satellite/3Dasiasec_rgb.jpg",
                "source": "India Meteorological Department (IMD) / ISRO",
                "timestamp": now_utc.strftime("%Y-%m-%d %H:%M UTC"),
                "status": "OPERATIONAL",
                "is_live": True,
            }
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


