from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from backend.app.services.weather_fusion_service import weather_fusion_service
from backend.app.services.imd_weather_service import imd_weather_service
from backend.app.services.radar_service import imd_radar_service
from backend.app.schemas.weather import WeatherApiResponse, WeatherData

router = APIRouter()


@router.get("/weather", response_model=WeatherApiResponse)
async def get_weather(
    latitude: float = Query(..., description="Exact GPS or manual latitude", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Exact GPS longitude", ge=-180.0, le=180.0),
    city: Optional[str] = Query(None, description="Optional city metadata"),
    district: Optional[str] = Query(None, description="Optional district metadata"),
    state: Optional[str] = Query(None, description="Optional state metadata"),
    country: Optional[str] = Query("India", description="Optional country metadata"),
):
    """
    Retrieve real-time fused weather intelligence:
    - Numerical forecast timeline (Open-Meteo)
    - Official meteorological intelligence & observation (IMD)
    - Active location-specific warnings (IMD)
    """
    location_meta = {
        "city": city,
        "district": district,
        "state": state,
        "country": country,
    }

    try:
        data_dict = await weather_fusion_service.get_fused_weather(
            latitude=latitude,
            longitude=longitude,
            location_meta=location_meta
        )
        return WeatherApiResponse(success=True, data=WeatherData(**data_dict))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch fused weather data: {str(exc)}"
        )


@router.get("/weather/current", summary="Get current weather with IMD primary source priority")
async def get_current_weather(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    city: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    loc_meta = {"city": city, "district": district, "state": state}
    try:
        res = await imd_weather_service.get_current_weather(latitude, longitude, loc_meta)
        return {"success": True, "data": res}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/weather/forecast", summary="Get 7-day forecast with IMD bulletin priority")
async def get_weather_forecast(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    city: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    loc_meta = {"city": city, "district": district, "state": state}
    try:
        res = await imd_weather_service.get_forecast(latitude, longitude, loc_meta)
        return {"success": True, "data": res}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/weather/warnings", summary="Get active IMD official warnings")
async def get_weather_warnings(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    city: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    loc_meta = {"city": city, "district": district, "state": state}
    try:
        res = await imd_weather_service.get_warnings(latitude, longitude, loc_meta)
        return {"success": True, "warnings": res, "count": len(res)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/weather/nowcast", summary="Get short-range IMD nowcast")
async def get_weather_nowcast(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    city: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    loc_meta = {"city": city, "district": district, "state": state}
    try:
        res = await imd_weather_service.get_nowcast(latitude, longitude, loc_meta)
        return {"success": True, "data": res}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/weather/radar", summary="Get nearest IMD Doppler Weather Radar station metadata & imagery")
async def get_weather_radar(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
):
    try:
        return imd_radar_service.get_radar_for_location(latitude, longitude)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
