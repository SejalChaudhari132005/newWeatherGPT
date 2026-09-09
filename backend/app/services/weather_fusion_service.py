import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from fastapi import HTTPException

from backend.app.agents.weather_agent import weather_agent, WeatherAgent
from backend.app.agents.alert_agent import alert_agent, AlertAgent
from backend.app.providers.weather.imd import imd_weather_provider, IMDWeatherProvider
from backend.app.services.imd_location_mapper import imd_location_mapper

logger = logging.getLogger("weather_fusion_service")

class WeatherFusionService:
    """
    Combines structured numerical weather model data (Open-Meteo)
    with official Indian meteorological intelligence (IMD observations & warnings)
    into a unified, provenance-aware WeatherData structure.
    
    Principles:
    1. Zero synthetic averaging (never mix or average values between providers).
    2. Explicit provenance for all metrics and warnings.
    3. Independent provider fault tolerance (IMD outage does not affect Open-Meteo).
    """

    def __init__(
        self,
        weather_agent_inst: Optional[WeatherAgent] = None,
        alert_agent_inst: Optional[AlertAgent] = None,
        imd_provider: Optional[IMDWeatherProvider] = None,
    ):
        self.weather_agent = weather_agent_inst or weather_agent
        self.alert_agent = alert_agent_inst or alert_agent
        self.imd_provider = imd_provider or imd_weather_provider

    async def get_fused_weather(
        self,
        latitude: float,
        longitude: float,
        location_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Fetch and fuse weather data from Open-Meteo and IMD.
        """
        # 1. Map Coordinates to IMD Zone for administrative context
        imd_mapping = imd_location_mapper.map_coordinates_to_imd(
            latitude=latitude,
            longitude=longitude,
            city_hint=(location_meta or {}).get("city"),
            district_hint=(location_meta or {}).get("district"),
            state_hint=(location_meta or {}).get("state"),
        )

        open_meteo_data: Optional[Dict[str, Any]] = None
        open_meteo_error: Optional[str] = None

        imd_obs: Optional[Dict[str, Any]] = None
        imd_alerts: List[Dict[str, Any]] = []
        imd_error: Optional[str] = None

        # 2. Fetch Open-Meteo Data
        try:
            open_meteo_data = await self.weather_agent.get_weather(
                latitude=latitude,
                longitude=longitude,
                location_meta=location_meta
            )
        except Exception as exc:
            logger.warning(f"[WeatherFusion] Open-Meteo fetch failed: {exc}")
            open_meteo_error = str(exc)

        # 3. Fetch IMD Intelligence (Observations & Alerts)
        try:
            imd_obs = await self.imd_provider.get_current_observation(
                latitude=latitude,
                longitude=longitude,
                location_meta=location_meta
            )
            imd_alerts = await self.alert_agent.get_active_alerts(
                latitude=latitude,
                longitude=longitude,
                location_meta=location_meta
            )
        except Exception as exc:
            logger.warning(f"[WeatherFusion] IMD fetch failed: {exc}")
            imd_error = str(exc)

        # 4. Handle Complete Failure (Both Providers Unavailable)
        if not open_meteo_data and not imd_obs and not imd_alerts:
            raise HTTPException(
                status_code=503,
                detail="Weather information is temporarily unavailable. Please retry shortly."
            )

        # 5. Handle Open-Meteo Available (Primary Case)
        now_iso = datetime.now(timezone.utc).isoformat()
        if open_meteo_data:
            # Build IMD Official Information block
            if imd_obs:
                official_info = {
                    "source": "India Meteorological Department",
                    "status": "available",
                    "station_name": imd_obs.get("station_name", imd_mapping.station_name),
                    "station_code": imd_obs.get("station_code", imd_mapping.station_code),
                    "district": imd_obs.get("district", imd_mapping.district),
                    "subdivision": imd_obs.get("subdivision", imd_mapping.subdivision),
                    "observed_at": imd_obs.get("observed_at"),
                    "temperature": imd_obs.get("temperature"),
                    "humidity": imd_obs.get("humidity"),
                    "rainfall_past_24h": imd_obs.get("rainfall_past_24h"),
                    "forecast_summary": imd_obs.get("forecast_summary"),
                    "attribution": "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India",
                    "message": None,
                }
            else:
                official_info = {
                    "source": "India Meteorological Department",
                    "status": "unavailable",
                    "station_name": imd_mapping.station_name,
                    "station_code": imd_mapping.station_code,
                    "district": imd_mapping.district,
                    "subdivision": imd_mapping.subdivision,
                    "observed_at": None,
                    "temperature": None,
                    "humidity": None,
                    "rainfall_past_24h": None,
                    "forecast_summary": None,
                    "attribution": "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India",
                    "message": "Official IMD observation bulletin is currently unavailable for this station.",
                }

            # Augment location metadata with IMD administrative info
            location_dict = dict(open_meteo_data.get("location", {}))
            location_dict["imd_station"] = imd_mapping.station_name
            location_dict["imd_subdivision"] = imd_mapping.subdivision

            return {
                "location": location_dict,
                "current": open_meteo_data.get("current"),
                "hourly": open_meteo_data.get("hourly", []),
                "daily": open_meteo_data.get("daily", []),
                "source": open_meteo_data.get("source"),
                "official_information": official_info,
                "alerts": imd_alerts,
            }

        # 6. Fallback: IMD Available, Open-Meteo Unavailable
        # Synthesize fallback response with IMD observation and empty forecast
        return {
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "city": (location_meta or {}).get("city") or imd_mapping.district,
                "district": (location_meta or {}).get("district") or imd_mapping.district,
                "state": (location_meta or {}).get("state") or imd_mapping.state,
                "country": "India",
                "imd_station": imd_mapping.station_name,
                "imd_subdivision": imd_mapping.subdivision,
            },
            "current": {
                "temperature": imd_obs.get("temperature") if imd_obs else None,
                "feels_like": None,
                "humidity": imd_obs.get("humidity") if imd_obs else None,
                "precipitation": imd_obs.get("rainfall_past_24h") if imd_obs else None,
                "rain_probability": None,
                "wind_speed": None,
                "wind_direction": None,
                "pressure": None,
                "visibility": None,
                "uv_index": None,
                "condition": imd_obs.get("forecast_summary") or "Observation Available",
                "icon": "cloud-sun",
                "weather_code": 1,
                "observed_at": (imd_obs or {}).get("observed_at") or now_iso,
                "source": "India Meteorological Department",
            },
            "hourly": [],
            "daily": [],
            "source": {
                "provider": "India Meteorological Department",
                "retrieved_at": now_iso,
                "is_cached": False,
            },
            "official_information": {
                "source": "India Meteorological Department",
                "status": "available",
                "station_name": imd_mapping.station_name,
                "station_code": imd_mapping.station_code,
                "district": imd_mapping.district,
                "subdivision": imd_mapping.subdivision,
                "observed_at": (imd_obs or {}).get("observed_at"),
                "temperature": (imd_obs or {}).get("temperature"),
                "humidity": (imd_obs or {}).get("humidity"),
                "rainfall_past_24h": (imd_obs or {}).get("rainfall_past_24h"),
                "forecast_summary": (imd_obs or {}).get("forecast_summary"),
                "attribution": "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India",
                "message": "Open-Meteo numerical forecast is temporarily unavailable.",
            },
            "alerts": imd_alerts,
        }

weather_fusion_service = WeatherFusionService()
