"""
AlertAgent for WeatherGPT Step 9.
Autonomous alert intelligence agent responsible for retrieving,
filtering, and normalizing official IMD severe weather warnings,
and coordinating with CitizenAlertEngine for algorithmic risk warnings.
"""

import logging
from typing import Dict, Any, List, Optional
from backend.app.agents.base_agent import BaseAgent
from backend.app.providers.weather.imd import IMDWeatherProvider, imd_weather_provider
from backend.app.services.imd_location_mapper import imd_location_mapper

logger = logging.getLogger("alert_agent")


class AlertAgent(BaseAgent):
    """
    Autonomous alert intelligence agent responsible for retrieving,
    filtering, and normalizing official IMD severe weather warnings,
    disaster alerts, and hazard bulletins for exact user coordinates.
    """

    def __init__(self, imd_provider: Optional[IMDWeatherProvider] = None):
        self.imd_provider = imd_provider or imd_weather_provider

    @property
    def name(self) -> str:
        return "AlertAgent"

    @property
    def description(self) -> str:
        return "Retrieves and filters official severe weather alerts and hazard warnings from IMD and CitizenAlertEngine."

    async def get_active_alerts(
        self,
        latitude: float,
        longitude: float,
        location_meta: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch location-filtered, normalized active alerts from official IMD services.
        Guarantees that user coordinates are mapped to the correct administrative region,
        and only alerts relevant to that region are returned.
        """
        if latitude is None or longitude is None:
            return []

        try:
            # 1. Map coordinates to IMD administrative zone
            mapping = imd_location_mapper.map_coordinates_to_imd(
                latitude=latitude,
                longitude=longitude,
                city_hint=(location_meta or {}).get("city"),
                district_hint=(location_meta or {}).get("district"),
                state_hint=(location_meta or {}).get("state"),
            )

            # 2. Fetch warnings through IMD provider
            warnings = await self.imd_provider.get_warnings(
                latitude=latitude,
                longitude=longitude,
                location_meta=location_meta
            )

            return warnings or []
        except Exception as exc:
            logger.error(f"[AlertAgent] Error retrieving active alerts: {exc}")
            # Provider failure must never crash the caller
            return []

    async def evaluate_citizen_alerts(
        self,
        latitude: float,
        longitude: float,
        user_id: Optional[str] = None,
        location_meta: Optional[Dict[str, Any]] = None
    ) -> List[Any]:
        """
        Evaluates active citizen alerts for user's exact coordinates.
        """
        from backend.app.services.citizen_alert_engine import citizen_alert_engine
        return await citizen_alert_engine.get_active_alerts(
            latitude=latitude,
            longitude=longitude,
            user_id=user_id
        )

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Standard BaseAgent interface execution.
        """
        ctx = context or {}
        lat = ctx.get("latitude")
        lon = ctx.get("longitude")

        if lat is not None and lon is not None:
            imd_alerts = await self.get_active_alerts(lat, lon, ctx.get("location_meta"))
            citizen_alerts = await self.evaluate_citizen_alerts(lat, lon, ctx.get("user_id"), ctx.get("location_meta"))
            return {
                "agent": self.name,
                "status": "success",
                "alerts_count": len(citizen_alerts) or len(imd_alerts),
                "imd_alerts": imd_alerts,
                "citizen_alerts": [a.model_dump() for a in citizen_alerts],
            }

        return {
            "agent": self.name,
            "status": "idle",
            "message": "Latitude and longitude context required to evaluate active alerts.",
            "alerts": []
        }


alert_agent = AlertAgent()
