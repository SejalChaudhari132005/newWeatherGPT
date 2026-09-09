import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from backend.app.core.logging import logger
from backend.app.providers.air_quality import AirQualityProvider, open_meteo_air_quality_provider
from backend.app.services.air_quality_engine import air_quality_engine
from backend.app.services.location_service import location_service
from backend.app.services.weather_cache import weather_cache_service

class AirQualityService:
    """
    Service layer coordinating Air Quality fetching, caching, and deterministic evaluation.
    """

    CACHE_TTL = 900  # 15 minutes cache TTL

    def __init__(self, provider: Optional[AirQualityProvider] = None):
        self.provider = provider or open_meteo_air_quality_provider
        self._current_cache: Dict[str, Dict[str, Any]] = {}
        self._hourly_cache: Dict[str, Dict[str, Any]] = {}

    def _get_cache_key(self, latitude: float, longitude: float) -> str:
        return f"air_quality:{round(latitude, 3)}:{round(longitude, 3)}"

    async def get_current_air_quality(
        self,
        latitude: float,
        longitude: float,
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        condition: Optional[str] = None,
        force_refresh: bool = False,
    ) -> Dict[str, Any]:
        """
        Get current normalized air quality for exact coordinates.
        Uses in-memory / cache with TTL check.
        """
        cache_key = self._get_cache_key(latitude, longitude)
        now = time.time()

        if not force_refresh and cache_key in self._current_cache:
            cached = self._current_cache[cache_key]
            if (now - cached["cached_at"]) < self.CACHE_TTL:
                logger.info(f"[AirQualityService] Returning cached air quality for {cache_key}")
                return cached["data"]

        # Fetch live data from provider
        raw = await self.provider.get_current_air_quality(latitude, longitude)

        # Also get hourly PM2.5 sample for trend calculation
        hourly_raw = await self.provider.get_hourly_air_quality(latitude, longitude, hours=12)
        hourly_pm25 = []
        if hourly_raw.get("success"):
            hourly_pm25 = [h.get("pm2_5") for h in hourly_raw.get("hours", [])]

        # Reverse-geocode location metadata if needed
        loc_meta = await location_service.reverse_geocode(latitude, longitude)

        if not raw.get("success"):
            # Return safe fallback structure with real location details
            fallback_res = {
                "success": False,
                "location": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "city": loc_meta.get("city") or "Local Area",
                    "district": loc_meta.get("district") or loc_meta.get("city"),
                    "state": loc_meta.get("state") or "",
                    "country": loc_meta.get("country") or "India",
                },
                "air_quality": {
                    "aqi": None,
                    "aqi_scale": "European AQI (CAMS)",
                    "category": "UNKNOWN",
                    "category_label": "Temporarily Unavailable",
                    "primary_pollutant": None,
                    "primary_pollutant_name": None,
                    "pm2_5": None,
                    "pm10": None,
                    "co": None,
                    "no2": None,
                    "so2": None,
                    "o3": None,
                    "timestamp": None,
                    "pollutants": [],
                },
                "interpretation": {
                    "category": "UNKNOWN",
                    "category_label": "Temporarily Unavailable",
                    "primary_pollutant": None,
                    "primary_pollutant_name": None,
                    "outdoor_advisory": "Air quality data is temporarily unavailable for this area.",
                    "sensitive_group_advisory": "Check back shortly for updated environmental observations.",
                    "combined_weather_note": None,
                    "trend": "UNKNOWN",
                    "trend_description": "Data updating in progress.",
                    "confidence": "LOW",
                    "data_timestamp": None,
                },
                "source": self.provider.provider_name,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            return fallback_res

        # Process through deterministic engine
        processed = air_quality_engine.process_current_air_quality(
            raw,
            temperature=temperature,
            humidity=humidity,
            condition=condition,
            hourly_pm25=hourly_pm25,
        )

        response_payload = {
            "success": True,
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "city": loc_meta.get("city") or "Local Area",
                "district": loc_meta.get("district") or loc_meta.get("city"),
                "state": loc_meta.get("state") or "",
                "country": loc_meta.get("country") or "India",
            },
            "air_quality": {
                "aqi": processed["aqi"],
                "aqi_scale": processed["aqi_scale"],
                "category": processed["category"],
                "category_label": processed["category_label"],
                "primary_pollutant": processed["primary_pollutant"],
                "primary_pollutant_name": processed["primary_pollutant_name"],
                "pm2_5": processed["pm2_5"],
                "pm10": processed["pm10"],
                "co": processed["co"],
                "no2": processed["no2"],
                "so2": processed["so2"],
                "o3": processed["o3"],
                "timestamp": processed["timestamp"],
                "pollutants": processed["pollutants"],
            },
            "interpretation": processed["interpretation"],
            "source": self.provider.provider_name,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        self._current_cache[cache_key] = {"cached_at": now, "data": response_payload}
        return response_payload

    async def get_hourly_air_quality(
        self,
        latitude: float,
        longitude: float,
        hours: int = 24,
        force_refresh: bool = False,
    ) -> Dict[str, Any]:
        """
        Get 24-hour hourly air quality forecast.
        """
        cache_key = f"hourly_{self._get_cache_key(latitude, longitude)}"
        now = time.time()

        if not force_refresh and cache_key in self._hourly_cache:
            cached = self._hourly_cache[cache_key]
            if (now - cached["cached_at"]) < self.CACHE_TTL:
                return cached["data"]

        raw = await self.provider.get_hourly_air_quality(latitude, longitude, hours=hours)
        loc_meta = await location_service.reverse_geocode(latitude, longitude)

        if not raw.get("success"):
            return {
                "success": False,
                "location": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "city": loc_meta.get("city") or "Local Area",
                    "district": loc_meta.get("district") or loc_meta.get("city"),
                    "state": loc_meta.get("state") or "",
                    "country": loc_meta.get("country") or "India",
                },
                "scale": "European AQI (CAMS)",
                "trend": "UNKNOWN",
                "trend_summary": "Hourly trend unavailable.",
                "hours": [],
                "source": self.provider.provider_name,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

        hour_items = []
        pm25_vals = []
        for h in raw.get("hours", []):
            time_str = h.get("time", "")
            aqi_val = h.get("european_aqi")
            cat_info = air_quality_engine.evaluate_aqi_category(aqi_val)
            pm25 = h.get("pm2_5")
            if pm25 is not None:
                pm25_vals.append(pm25)

            # Format hour label e.g. "14:00" or "2 PM"
            hour_label = time_str.split("T")[-1][:5] if "T" in time_str else time_str
            dt_ts = int(time.time())
            try:
                dt_ts = int(datetime.fromisoformat(time_str).timestamp())
            except Exception:
                pass

            hour_items.append({
                "time": time_str,
                "timestamp": dt_ts,
                "hour_label": hour_label,
                "aqi": aqi_val,
                "category": cat_info["category"],
                "category_label": cat_info["label"],
                "pm2_5": pm25,
                "pm10": h.get("pm10"),
                "no2": h.get("no2"),
                "o3": h.get("o3"),
                "so2": h.get("so2"),
                "co": h.get("co"),
            })

        trend_info = air_quality_engine.evaluate_trend(pm25_vals)

        response_payload = {
            "success": True,
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "city": loc_meta.get("city") or "Local Area",
                "district": loc_meta.get("district") or loc_meta.get("city"),
                "state": loc_meta.get("state") or "",
                "country": loc_meta.get("country") or "India",
            },
            "scale": "European AQI (CAMS)",
            "trend": trend_info["trend"],
            "trend_summary": trend_info["description"],
            "hours": hour_items,
            "source": self.provider.provider_name,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        self._hourly_cache[cache_key] = {"cached_at": now, "data": response_payload}
        return response_payload

air_quality_service = AirQualityService()
