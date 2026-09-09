"""
Weather-Aware Route Intelligence API for WeatherGPT Step 10.
Provides endpoints for:
- Road route weather analysis & waypoint hazard sampling
- Multi-departure time comparison
- Proactive route alert subscription
- Stored trip retrieval
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, HTTPException, status
from backend.app.services.route_weather_service import route_weather_service
from backend.app.services.travel_alert_service import travel_alert_service
from backend.app.core.logging import logger

router = APIRouter(prefix="/route", tags=["Weather-Aware Route Intelligence"])


class RouteAnalyzeRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lon: float = Field(..., ge=-180.0, le=180.0)
    destination_lat: float = Field(..., ge=-90.0, le=90.0)
    destination_lon: float = Field(..., ge=-180.0, le=180.0)
    origin_name: str = Field(default="Origin")
    destination_name: str = Field(default="Destination")
    departure_time: str = Field(default="08:00")
    travel_date: Optional[str] = None
    language: Optional[str] = Field(default="en")
    user_id: Optional[str] = None


class CompareTimesRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lon: float = Field(..., ge=-180.0, le=180.0)
    destination_lat: float = Field(..., ge=-90.0, le=90.0)
    destination_lon: float = Field(..., ge=-180.0, le=180.0)
    origin_name: str = Field(default="Origin")
    destination_name: str = Field(default="Destination")
    travel_date: Optional[str] = None
    candidate_times: Optional[List[str]] = Field(default=["06:00", "09:00", "12:00", "16:00"])
    language: Optional[str] = Field(default="en")


class RouteAlertRequest(BaseModel):
    user_id: str = Field(default="anonymous")
    plan_id: Optional[str] = None
    origin_name: str
    destination_name: str
    alert_on_rain: bool = True
    alert_on_thunderstorm: bool = True
    alert_on_fog: bool = True
    alert_on_severe: bool = True
    notify_window_hours: int = 3


@router.post("/analyze", summary="Analyze weather along transit route")
async def analyze_route(payload: RouteAnalyzeRequest):
    try:
        result = await route_weather_service.analyze_route(
            origin_lat=payload.origin_lat,
            origin_lon=payload.origin_lon,
            dest_lat=payload.destination_lat,
            dest_lon=payload.destination_lon,
            origin_name=payload.origin_name,
            dest_name=payload.destination_name,
            departure_time=payload.departure_time,
            travel_date=payload.travel_date,
            language=payload.language or "en",
        )

        # Optionally persist plan if user_id provided
        if payload.user_id:
            await travel_alert_service.save_travel_plan({
                "user_id": payload.user_id,
                "origin_lat": payload.origin_lat,
                "origin_lon": payload.origin_lon,
                "origin_name": payload.origin_name,
                "destination_lat": payload.destination_lat,
                "destination_lon": payload.destination_lon,
                "destination_name": payload.destination_name,
                "travel_date": payload.travel_date,
                "departure_time": payload.departure_time,
                "distance_km": result.get("distance_km"),
                "duration_minutes": result.get("duration_minutes"),
                "overall_risk": result.get("overall_risk"),
                "route_summary": {
                    "formatted_duration": result.get("formatted_duration"),
                    "hazards": result.get("hazards"),
                }
            })

        return result
    except Exception as exc:
        logger.error(f"[RouteAPI] Error analyzing route: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route weather analysis failed: {str(exc)}"
        )


@router.post("/compare-times", summary="Compare departure times for route")
async def compare_departure_times(payload: CompareTimesRequest):
    try:
        return await route_weather_service.compare_departure_times(
            origin_lat=payload.origin_lat,
            origin_lon=payload.origin_lon,
            dest_lat=payload.destination_lat,
            dest_lon=payload.destination_lon,
            origin_name=payload.origin_name,
            dest_name=payload.destination_name,
            travel_date=payload.travel_date,
            candidate_times=payload.candidate_times,
            language=payload.language or "en",
        )
    except Exception as exc:
        logger.error(f"[RouteAPI] Error comparing departure times: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Departure time comparison failed: {str(exc)}"
        )


@router.post("/alert", summary="Set proactive weather alert for a route")
async def set_route_alert(payload: RouteAlertRequest):
    try:
        saved = await travel_alert_service.set_route_alert(payload.model_dump())
        return {
            "success": True,
            "message": f"Proactive route weather alerts set for {payload.origin_name} → {payload.destination_name}.",
            "data": saved,
        }
    except Exception as exc:
        logger.error(f"[RouteAPI] Error setting route alert: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/alerts", summary="Get active saved travel plans & alerts for user")
async def get_user_route_alerts(user_id: str = Query(..., description="User UUID")):
    try:
        plans = await travel_alert_service.get_user_travel_plans(user_id)
        return {
            "success": True,
            "user_id": user_id,
            "plans": plans,
        }
    except Exception as exc:
        logger.error(f"[RouteAPI] Error fetching route alerts: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
