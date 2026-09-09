import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from backend.app.providers.air_quality.base import AirQualityProvider

logger = logging.getLogger("open_meteo_air_quality")

class OpenMeteoAirQualityProvider(AirQualityProvider):
    """
    Open-Meteo Air Quality API integration.
    Queries CAMS / ECMWF global atmospheric composition models by exact latitude & longitude.
    """

    BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

    @property
    def provider_name(self) -> str:
        return "Open-Meteo / CAMS European Model"

    async def get_current_air_quality(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Fetch current air quality data by exact coordinates.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone",
            "timezone": "auto",
            "forecast_days": 1,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                logger.info(f"[OpenMeteoAirQuality] Querying current AQ for lat={latitude}, lon={longitude}")
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    current = data.get("current", {})
                    return {
                        "success": True,
                        "provider": self.provider_name,
                        "latitude": latitude,
                        "longitude": longitude,
                        "timestamp": current.get("time") or datetime.now(timezone.utc).isoformat(),
                        "european_aqi": current.get("european_aqi"),
                        "us_aqi": current.get("us_aqi"),
                        "pm2_5": current.get("pm2_5"),
                        "pm10": current.get("pm10"),
                        "co": current.get("carbon_monoxide"),
                        "no2": current.get("nitrogen_dioxide"),
                        "so2": current.get("sulphur_dioxide"),
                        "o3": current.get("ozone"),
                    }
                else:
                    logger.error(f"[OpenMeteoAirQuality] HTTP {resp.status_code} error: {resp.text}")
                    return {
                        "success": False,
                        "provider": self.provider_name,
                        "error": f"HTTP {resp.status_code}",
                    }
        except Exception as exc:
            logger.error(f"[OpenMeteoAirQuality] Exception fetching current AQ: {type(exc).__name__}: {exc}")
            return {
                "success": False,
                "provider": self.provider_name,
                "error": str(exc),
            }

    async def get_hourly_air_quality(self, latitude: float, longitude: float, hours: int = 24) -> Dict[str, Any]:
        """
        Fetch hourly air quality forecast by exact coordinates.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone",
            "timezone": "auto",
            "forecast_days": 2,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                logger.info(f"[OpenMeteoAirQuality] Querying hourly AQ for lat={latitude}, lon={longitude}")
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    hourly = data.get("hourly", {})
                    times = hourly.get("time", [])
                    eaqi = hourly.get("european_aqi", [])
                    pm25 = hourly.get("pm2_5", [])
                    pm10 = hourly.get("pm10", [])
                    no2 = hourly.get("nitrogen_dioxide", [])
                    o3 = hourly.get("ozone", [])
                    so2 = hourly.get("sulphur_dioxide", [])
                    co = hourly.get("carbon_monoxide", [])

                    # Find index corresponding to current hour or slice the next N hours
                    now_iso = datetime.now().strftime("%Y-%m-%dT%H:00")
                    start_idx = 0
                    for i, t in enumerate(times):
                        if t >= now_iso:
                            start_idx = i
                            break

                    end_idx = min(start_idx + hours, len(times))
                    slice_indices = range(start_idx, end_idx) if start_idx < len(times) else range(0, min(hours, len(times)))

                    hour_items = []
                    for i in slice_indices:
                        hour_items.append({
                            "time": times[i],
                            "european_aqi": eaqi[i] if i < len(eaqi) else None,
                            "pm2_5": pm25[i] if i < len(pm25) else None,
                            "pm10": pm10[i] if i < len(pm10) else None,
                            "no2": no2[i] if i < len(no2) else None,
                            "o3": o3[i] if i < len(o3) else None,
                            "so2": so2[i] if i < len(so2) else None,
                            "co": co[i] if i < len(co) else None,
                        })

                    return {
                        "success": True,
                        "provider": self.provider_name,
                        "latitude": latitude,
                        "longitude": longitude,
                        "hours": hour_items,
                    }
                else:
                    logger.error(f"[OpenMeteoAirQuality] Hourly HTTP {resp.status_code} error: {resp.text}")
                    return {
                        "success": False,
                        "provider": self.provider_name,
                        "error": f"HTTP {resp.status_code}",
                        "hours": [],
                    }
        except Exception as exc:
            logger.error(f"[OpenMeteoAirQuality] Exception fetching hourly AQ: {type(exc).__name__}: {exc}")
            return {
                "success": False,
                "provider": self.provider_name,
                "error": str(exc),
                "hours": [],
            }

open_meteo_air_quality_provider = OpenMeteoAirQualityProvider()
