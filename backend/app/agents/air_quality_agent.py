from typing import Dict, Any, Optional
from backend.app.agents.base_agent import BaseAgent
from backend.app.services.air_quality_service import air_quality_service
from backend.app.core.logging import logger

class AirQualityAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "AirQualityAgent"

    @property
    def description(self) -> str:
        return "Fetches real atmospheric air quality, calculates factual pollutant categories, and provides non-diagnostic health advisories."

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        ctx = context or {}
        lat = float(ctx.get("latitude", 19.2598))
        lon = float(ctx.get("longitude", 73.1341))
        temp = ctx.get("temperature")
        hum = ctx.get("humidity")
        cond = ctx.get("condition")

        logger.info(f"[AirQualityAgent] Executing air quality analysis for lat={lat}, lon={lon}")
        current_aq = await air_quality_service.get_current_air_quality(
            latitude=lat,
            longitude=lon,
            temperature=temp,
            humidity=hum,
            condition=cond,
        )
        hourly_aq = await air_quality_service.get_hourly_air_quality(
            latitude=lat,
            longitude=lon,
            hours=24,
        )

        return {
            "current": current_aq,
            "hourly": hourly_aq,
        }

air_quality_agent = AirQualityAgent()
