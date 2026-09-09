from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.core.logging import logger
from backend.app.services.air_quality_service import air_quality_service
from backend.app.schemas.air_quality import (
    AirQualityCurrentResponse,
    AirQualityHourlyResponse,
)

router = APIRouter(prefix="/air-quality", tags=["Air Quality Intelligence"])

@router.get(
    "/current",
    response_model=AirQualityCurrentResponse,
    summary="Get Current Air Quality Observations & Health Advisory"
)
async def get_current_air_quality(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Exact latitude coordinate"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Exact longitude coordinate"),
    temperature: Optional[float] = Query(None, description="Current ambient temperature in °C"),
    humidity: Optional[float] = Query(None, description="Current relative humidity in %"),
    condition: Optional[str] = Query(None, description="Current weather condition description"),
    force_refresh: bool = Query(False, description="Bypass cache and force fresh data fetch"),
):
    """
    Fetch current live Air Quality measurements (PM2.5, PM10, NO2, O3, SO2, CO, European AQI),
    primary pollutant determination, and non-diagnostic citizen health advisories.
    """
    logger.info(f"[API] GET /api/air-quality/current lat={latitude}, lon={longitude}, refresh={force_refresh}")
    try:
        data = await air_quality_service.get_current_air_quality(
            latitude=latitude,
            longitude=longitude,
            temperature=temperature,
            humidity=humidity,
            condition=condition,
            force_refresh=force_refresh,
        )
        return AirQualityCurrentResponse(**data)
    except Exception as exc:
        logger.error(f"[API] Air quality fetch error for ({latitude}, {longitude}): {exc}")
        raise HTTPException(status_code=500, detail=f"Air quality evaluation failed: {str(exc)}")


@router.get(
    "/hourly",
    response_model=AirQualityHourlyResponse,
    summary="Get 24-Hour Air Quality Forecast & Trend"
)
async def get_hourly_air_quality(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Exact latitude coordinate"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Exact longitude coordinate"),
    hours: int = Query(24, ge=1, le=48, description="Number of forecast hours to retrieve"),
    force_refresh: bool = Query(False, description="Bypass cache and force fresh data fetch"),
):
    """
    Fetch sequential hourly air quality forecast (AQI, PM2.5, PM10, NO2, O3, SO2, CO)
    and computed direction trend (IMPROVING, STABLE, WORSENING).
    """
    logger.info(f"[API] GET /api/air-quality/hourly lat={latitude}, lon={longitude}, hours={hours}")
    try:
        data = await air_quality_service.get_hourly_air_quality(
            latitude=latitude,
            longitude=longitude,
            hours=hours,
            force_refresh=force_refresh,
        )
        return AirQualityHourlyResponse(**data)
    except Exception as exc:
        logger.error(f"[API] Hourly air quality error for ({latitude}, {longitude}): {exc}")
        raise HTTPException(status_code=500, detail=f"Hourly air quality fetch failed: {str(exc)}")
