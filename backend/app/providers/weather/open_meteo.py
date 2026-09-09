import httpx
from typing import Dict, Any
from backend.app.providers.weather.base import BaseWeatherProvider

class OpenMeteoProvider(BaseWeatherProvider):
    def __init__(self, timeout: float = 10.0):
        self.endpoint = "https://api.open-meteo.com/v1/forecast"
        self.timeout = timeout

    @property
    def provider_name(self) -> str:
        return "Open-Meteo"

    async def fetch_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Fetch current weather, 24-hour hourly forecast, and 7-day daily forecast
        from Open-Meteo API using exact coordinates.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "rain",
                "showers",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "visibility",
                "uv_index",
            ],
            "hourly": [
                "temperature_2m",
                "apparent_temperature",
                "precipitation_probability",
                "precipitation",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
                "visibility",
                "uv_index",
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
                "uv_index_max",
            ],
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.endpoint, params=params)
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Open-Meteo service returned HTTP {response.status_code}"
                    )
                return response.json()
        except httpx.TimeoutException:
            raise RuntimeError("Open-Meteo request timed out")
        except httpx.RequestError as exc:
            raise RuntimeError(f"Open-Meteo connection error: {exc}")

from fastapi import HTTPException
