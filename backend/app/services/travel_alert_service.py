"""
Travel Alert Service for WeatherGPT Step 10.
Manages persistent upcoming travel plans and route alert preferences in Supabase,
enabling proactive travel weather notifications.
"""

import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.services.supabase_service import get_supabase_client

logger = logging.getLogger("travel_alert_service")


class TravelAlertService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def save_travel_plan(self, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Saves an upcoming travel journey to Supabase.
        """
        plan_id = str(uuid.uuid4())
        record = {
            "id": plan_id,
            "user_id": plan_data.get("user_id") or "anonymous",
            "origin_lat": float(plan_data["origin_lat"]),
            "origin_lon": float(plan_data["origin_lon"]),
            "origin_name": plan_data.get("origin_name", "Origin"),
            "destination_lat": float(plan_data["destination_lat"]),
            "destination_lon": float(plan_data["destination_lon"]),
            "destination_name": plan_data.get("destination_name", "Destination"),
            "travel_date": plan_data.get("travel_date") or datetime.now().strftime("%Y-%m-%d"),
            "departure_time": plan_data.get("departure_time") or "08:00",
            "distance_km": float(plan_data.get("distance_km") or 0.0),
            "duration_minutes": int(plan_data.get("duration_minutes") or 0),
            "overall_risk": plan_data.get("overall_risk", "low"),
            "route_summary": plan_data.get("route_summary") or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if self.supabase:
            try:
                res = self.supabase.table("travel_plans").insert(record).execute()
                if res.data:
                    return res.data[0]
            except Exception as exc:
                logger.warning(f"[TravelAlertService] Supabase insert failed: {exc}")

        return record

    async def set_route_alert(self, alert_prefs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Subscribes a user to proactive weather hazard alerts along a specific route.
        """
        pref_id = str(uuid.uuid4())
        record = {
            "id": pref_id,
            "user_id": alert_prefs.get("user_id") or "anonymous",
            "plan_id": alert_prefs.get("plan_id"),
            "origin_name": alert_prefs.get("origin_name", "Origin"),
            "destination_name": alert_prefs.get("destination_name", "Destination"),
            "alert_on_rain": bool(alert_prefs.get("alert_on_rain", True)),
            "alert_on_thunderstorm": bool(alert_prefs.get("alert_on_thunderstorm", True)),
            "alert_on_fog": bool(alert_prefs.get("alert_on_fog", True)),
            "alert_on_severe": bool(alert_prefs.get("alert_on_severe", True)),
            "notify_window_hours": int(alert_prefs.get("notify_window_hours", 3)),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if self.supabase:
            try:
                res = self.supabase.table("route_alert_preferences").insert(record).execute()
                if res.data:
                    return res.data[0]
            except Exception as exc:
                logger.warning(f"[TravelAlertService] Supabase route_alert insert failed: {exc}")

        return record

    async def get_user_travel_plans(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves active travel plans for a user.
        """
        if self.supabase:
            try:
                res = (
                    self.supabase.table("travel_plans")
                    .select("*")
                    .eq("user_id", user_id)
                    .order("travel_date", desc=False)
                    .limit(20)
                    .execute()
                )
                return res.data or []
            except Exception as exc:
                logger.warning(f"[TravelAlertService] Supabase query failed: {exc}")
        return []


travel_alert_service = TravelAlertService()
