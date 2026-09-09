"""
Alerts & Early Warning Endpoints for WeatherGPT.
Provides location-specific multi-hazard active alerts, alert history,
read confirmations, and user alert preferences.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException, status, Body
from backend.app.services.citizen_alert_engine import citizen_alert_engine
from backend.app.agents.fusion_agent import weather_fusion_agent
from backend.app.services.imd_location_mapper import imd_location_mapper
from backend.app.agents.alert_agent import alert_agent
from backend.app.schemas.alerts import (
    CitizenAlert,
    CurrentAlertsResponse,
    AlertHistoryResponse,
    SingleAlertResponse,
    UserAlertPreferences,
    UserAlertPreferencesUpdate,
    AlertsApiResponse,
    IMDAlert,
)
from backend.app.core.logging import logger

router = APIRouter(tags=["Alerts & Early Warnings"])


@router.get("/alerts/current", response_model=CurrentAlertsResponse, summary="Get active weather alerts for user location")
async def get_current_alerts(
    latitude: float = Query(..., description="Exact GPS latitude", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Exact GPS longitude", ge=-180.0, le=180.0),
    city: Optional[str] = Query(None, description="City name"),
    district: Optional[str] = Query(None, description="District name"),
    state: Optional[str] = Query(None, description="State name"),
    user_id: Optional[str] = Query(None, description="User UUID"),
    language: Optional[str] = Query(default="en", description="Preferred language code (en, mr, hi, etc.)"),
):
    """
    Evaluates real-time weather observations, forecast models, and official IMD warnings
    to generate grounded, deduplicated active alerts for the user's exact coordinates.
    """
    try:
        loc_meta = {"city": city, "district": district, "state": state}

        # 1. Fetch live weather intelligence
        intelligence = await weather_fusion_agent.build_weather_intelligence(
            latitude=latitude,
            longitude=longitude,
            location_meta=loc_meta,
        )

        # 2. Evaluate citizen alerts through CitizenAlertEngine
        prefs = await citizen_alert_engine.get_user_preferences(user_id) if user_id else None
        active_alerts = await citizen_alert_engine.evaluate_weather(
            intelligence=intelligence,
            user_id=user_id,
            preferences=prefs,
            language=language or "en",
        )

        top_alert = active_alerts[0] if active_alerts else None
        summary_msg = (
            "✓ No active severe weather warnings for your location."
            if not active_alerts
            else f"{len(active_alerts)} active weather advisory/warning detected."
        )

        return CurrentAlertsResponse(
            success=True,
            location={
                "city": intelligence.location.city,
                "district": intelligence.location.district,
                "state": intelligence.location.state,
                "latitude": latitude,
                "longitude": longitude,
            },
            active_count=len(active_alerts),
            alerts=active_alerts,
            top_alert=top_alert,
            summary_message=summary_msg,
            evaluated_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as exc:
        logger.error(f"[AlertsAPI] Current alerts error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate weather alerts: {str(exc)}",
        )


@router.get("/alerts/history", response_model=AlertHistoryResponse, summary="Get historical and recent alerts for location")
async def get_alerts_history(
    latitude: float = Query(..., description="Exact GPS latitude", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Exact GPS longitude", ge=-180.0, le=180.0),
    city: Optional[str] = Query(None, description="City name"),
    user_id: Optional[str] = Query(None, description="User UUID"),
    limit: int = Query(20, ge=1, le=50),
):
    try:
        history = await citizen_alert_engine.get_alert_history(
            latitude=latitude,
            longitude=longitude,
            user_id=user_id,
            limit=limit,
        )
        return AlertHistoryResponse(
            success=True,
            location={"latitude": latitude, "longitude": longitude, "city": city},
            history=history,
            total=len(history),
        )
    except Exception as exc:
        logger.error(f"[AlertsAPI] History error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/alerts/{alert_id}", response_model=SingleAlertResponse, summary="Get single alert detail")
async def get_single_alert(alert_id: str):
    try:
        history = await citizen_alert_engine.get_alert_history(latitude=0, longitude=0, limit=100)
        found = next((a for a in history if a.id == alert_id), None)
        if not found:
            raise HTTPException(status_code=404, detail="Alert not found")
        return SingleAlertResponse(success=True, alert=found)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/alerts/refresh", response_model=CurrentAlertsResponse, summary="Force refresh alerts evaluation")
async def refresh_alerts(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    city: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
):
    return await get_current_alerts(
        latitude=latitude,
        longitude=longitude,
        city=city,
        district=district,
        state=state,
        user_id=user_id,
    )


@router.patch("/alerts/{alert_id}/read", summary="Mark an alert as read")
async def mark_alert_read(alert_id: str, user_id: Optional[str] = Query(None)):
    try:
        ok = await citizen_alert_engine.mark_alert_as_read(alert_id, user_id)
        return {"success": ok, "message": f"Alert {alert_id} marked as read."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/user/alert-preferences", response_model=UserAlertPreferences, summary="Get user alert preferences")
async def get_user_preferences(user_id: str = Query("anonymous", description="User UUID")):
    try:
        return await citizen_alert_engine.get_user_preferences(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/user/alert-preferences", response_model=UserAlertPreferences, summary="Update user alert preferences")
async def update_user_preferences(payload: UserAlertPreferencesUpdate):
    try:
        uid = payload.user_id or "anonymous"
        return await citizen_alert_engine.update_user_preferences(
            user_id=uid,
            updates=payload.model_dump(exclude_unset=True),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# Legacy compatibility endpoint for GET /api/alerts
@router.get("/alerts", response_model=AlertsApiResponse, summary="Legacy IMD alerts endpoint")
async def get_alerts_legacy(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    city: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    location_meta = {"city": city, "district": district, "state": state}
    try:
        mapping = imd_location_mapper.map_coordinates_to_imd(
            latitude=latitude,
            longitude=longitude,
            city_hint=city,
            district_hint=district,
            state_hint=state,
        )
        alerts_list = await alert_agent.get_active_alerts(
            latitude=latitude,
            longitude=longitude,
            location_meta=location_meta,
        )
        normalized_alerts = [IMDAlert(**item) for item in alerts_list]
        return AlertsApiResponse(
            success=True,
            alerts=normalized_alerts,
            location_mapped=mapping.station_name,
            district=mapping.district,
            state=mapping.state,
            message="No active warnings" if not normalized_alerts else f"{len(normalized_alerts)} active alerts",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(exc)}")
