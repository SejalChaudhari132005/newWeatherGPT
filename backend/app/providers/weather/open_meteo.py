from typing import Dict, Any, Optional
from fastapi import HTTPException
import httpx
from backend.app.providers.weather.base import BaseWeatherProvider

class OpenMeteoProvider(BaseWeatherProvider):
    def __init__(self, timeout: float = 10.0):
        self.endpoint = "https://api.open-meteo.com/v1/forecast"
        self.marine_endpoint = "https://marine-api.open-meteo.com/v1/marine"
        self.timeout = timeout

    @property
    def provider_name(self) -> str:
        return "Open-Meteo"

    async def fetch_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Fetch current weather, 24-hour/7-day hourly forecast, and 7-day daily forecast
        from Open-Meteo API using exact coordinates, including agricultural and aviation telemetry.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "dew_point_2m",
                "precipitation",
                "rain",
                "showers",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "wind_gusts_10m",
                "visibility",
                "uv_index",
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "dew_point_2m",
                "precipitation_probability",
                "precipitation",
                "rain",
                "showers",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "wind_gusts_10m",
                "visibility",
                "uv_index",
                # Agricultural variables
                "soil_moisture_0_to_7cm",
                "soil_moisture_7_to_28cm",
                "et0_fao_evapotranspiration",
                "soil_temperature_0cm",
                "vapour_pressure_deficit",
                # Aviation & atmospheric variables
                "cloud_cover",
                "cloud_cover_low",
                "cloud_cover_mid",
                "cloud_cover_high",
                "cape",
            ],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_probability_max",
                "precipitation_sum",
                "weather_code",
                "sunrise",
                "sunset",
                "wind_speed_10m_max",
                "wind_gusts_10m_max",
                "wind_direction_10m_dominant",
                "et0_fao_evapotranspiration",
                "uv_index_max",
            ],
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
                response = await client.get(self.endpoint, params=params)
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Open-Meteo weather service returned HTTP {response.status_code}: {response.text}"
                    )
                return response.json()
        except HTTPException:
            raise
        except httpx.TimeoutException:
            raise RuntimeError("Open-Meteo weather request timed out")
        except httpx.RequestError as exc:
            raise RuntimeError(f"Open-Meteo connection error: {exc}")

    async def fetch_marine_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Fetch marine hydrodynamic weather forecast from Open-Meteo Marine API
        including wave height, swell, period, and ocean currents.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": [
                "wave_height",
                "wave_direction",
                "wave_period",
                "wind_wave_height",
                "wind_wave_direction",
                "wind_wave_period",
                "swell_wave_height",
                "swell_wave_direction",
                "swell_wave_period",
            ],
            "hourly": [
                "wave_height",
                "wave_direction",
                "wave_period",
                "wind_wave_height",
                "wind_wave_direction",
                "wind_wave_period",
                "swell_wave_height",
                "swell_wave_direction",
                "swell_wave_period",
                "ocean_current_velocity",
                "ocean_current_direction",
            ],
            "daily": [
                "wave_height_max",
                "wave_direction_dominant",
                "wave_period_max",
                "wind_wave_height_max",
                "swell_wave_height_max",
            ],
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
                response = await client.get(self.marine_endpoint, params=params)
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Open-Meteo marine service returned HTTP {response.status_code}: {response.text}"
                    )
                return response.json()
        except HTTPException:
            raise
        except httpx.TimeoutException:
            raise RuntimeError("Open-Meteo marine request timed out")
        except httpx.RequestError as exc:
            raise RuntimeError(f"Open-Meteo marine connection error: {exc}")

