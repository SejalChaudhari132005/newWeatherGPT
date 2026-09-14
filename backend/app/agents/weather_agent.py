from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException

from backend.app.providers.weather.base import BaseWeatherProvider
from backend.app.providers.weather.open_meteo import OpenMeteoProvider
from backend.app.services.weather_code_service import decode_weather_code
from backend.app.services.weather_cache import weather_cache_service

class WeatherAgent:
    """
    Autonomous agent responsible for retrieving, normalizing, caching,
    and validating weather data from underlying weather providers.
    """
    def __init__(self, provider: Optional[BaseWeatherProvider] = None):
        self.provider = provider or OpenMeteoProvider()

    async def get_weather(
        self,
        latitude: float,
        longitude: float,
        location_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # 1. Coordinate Validation
        if latitude is None or longitude is None:
            raise HTTPException(status_code=400, detail="Latitude and longitude parameters are required.")

        if not (-90.0 <= latitude <= 90.0):
            raise HTTPException(status_code=400, detail=f"Latitude out of bounds [-90, 90]: {latitude}")

        if not (-180.0 <= longitude <= 180.0):
            raise HTTPException(status_code=400, detail=f"Longitude out of bounds [-180, 180]: {longitude}")

        # 2. Check 5-Minute Backend Cache
        cached_data = weather_cache_service.get(latitude, longitude)
        if cached_data:
            # Update location metadata if passed in current request
            if location_meta:
                cached_data["location"] = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "city": location_meta.get("city"),
                    "district": location_meta.get("district"),
                    "state": location_meta.get("state"),
                    "country": location_meta.get("country", "India"),
                }
            cached_data["source"]["is_cached"] = True
            return cached_data

        # 3. Fetch Raw Data from Provider
        try:
            raw = await self.provider.fetch_weather(latitude, longitude)
        except Exception as err:
            raise HTTPException(status_code=502, detail=f"Weather service unavailable: {str(err)}")

        now_iso = datetime.now(timezone.utc).isoformat()

        # 4. Parse Current Weather
        current_raw = raw.get("current", {})
        weather_code = current_raw.get("weather_code", 0)
        decoded_condition = decode_weather_code(weather_code)

        def get_wind_direction_label(deg: Optional[float]) -> str:
            if deg is None:
                return "N"
            val = int((deg / 22.5) + 0.5)
            directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
            return directions[(val % 16)]

        wind_deg = current_raw.get("wind_direction_10m")
        wind_dir = get_wind_direction_label(wind_deg)

        # Visibility conversion from meters to kilometers
        raw_vis_m = current_raw.get("visibility")
        vis_km = round(raw_vis_m / 1000.0, 1) if raw_vis_m is not None else None

        current_norm = {
            "temperature": round(current_raw.get("temperature_2m"), 1) if current_raw.get("temperature_2m") is not None else None,
            "feels_like": round(current_raw.get("apparent_temperature"), 1) if current_raw.get("apparent_temperature") is not None else None,
            "humidity": round(current_raw.get("relative_humidity_2m"), 1) if current_raw.get("relative_humidity_2m") is not None else None,
            "precipitation": current_raw.get("precipitation"),
            "rain_probability": None,  # Will be populated from current hour forecast
            "wind_speed": round(current_raw.get("wind_speed_10m"), 1) if current_raw.get("wind_speed_10m") is not None else None,
            "wind_direction": wind_dir,
            "pressure": round(current_raw.get("surface_pressure"), 1) if current_raw.get("surface_pressure") is not None else None,
            "visibility": vis_km,
            "uv_index": round(current_raw.get("uv_index"), 1) if current_raw.get("uv_index") is not None else None,
            "condition": decoded_condition["condition"],
            "icon": decoded_condition["icon"],
            "weather_code": weather_code,
            "observed_at": now_iso,
        }

        # 5. Parse 24-Hour Forecast Timeline (Starting from CURRENT HOUR)
        hourly_raw = raw.get("hourly", {})
        times = hourly_raw.get("time", [])
        temps = hourly_raw.get("temperature_2m", [])
        rain_probs = hourly_raw.get("precipitation_probability", [])
        codes = hourly_raw.get("weather_code", [])
        precips = hourly_raw.get("precipitation", [])

        # Locate index of current hour
        now_local = datetime.now()
        start_idx = 0
        min_diff = float("inf")
        for idx, t_str in enumerate(times):
            try:
                dt = datetime.fromisoformat(t_str)
                diff = abs((dt.replace(tzinfo=None) - now_local.replace(tzinfo=None)).total_seconds())
                if diff < min_diff:
                    min_diff = diff
                    start_idx = idx
            except Exception:
                pass

        hourly_norm: List[Dict[str, Any]] = []
        for step, i in enumerate(range(start_idx, min(start_idx + 24, len(times)))):
            t_str = times[i]
            try:
                dt = datetime.fromisoformat(t_str)
                time_label = "NOW" if step == 0 else dt.strftime("%I %p").lstrip("0")
            except Exception:
                time_label = t_str

            code = codes[i] if i < len(codes) else 0
            cond = decode_weather_code(code)
            prob = rain_probs[i] if i < len(rain_probs) else 0
            temp = round(temps[i], 1) if i < len(temps) and temps[i] is not None else None
            precip = precips[i] if i < len(precips) and precips[i] is not None else 0.0

            if step == 0:
                current_norm["rain_probability"] = prob or 0

            hourly_norm.append({
                "time": time_label,
                "iso_time": t_str,
                "temp": temp,
                "condition": cond["condition"],
                "icon": cond["icon"],
                "weatherCode": code,
                "rainProb": prob,
                "precipitation": precip,
                "highlight": (prob or 0) >= 60,
            })

        # 6. Parse 7-Day Forecast Timeline
        daily_raw = raw.get("daily", {})
        d_times = daily_raw.get("time", [])
        d_maxs = daily_raw.get("temperature_2m_max", [])
        d_mins = daily_raw.get("temperature_2m_min", [])
        d_probs = daily_raw.get("precipitation_probability_max", [])
        d_codes = daily_raw.get("weather_code", [])

        daily_norm: List[Dict[str, Any]] = []
        for i in range(min(7, len(d_times))):
            d_str = d_times[i]
            try:
                dt = datetime.fromisoformat(d_str)
                day_label = "Today" if i == 0 else ("Tomorrow" if i == 1 else dt.strftime("%a"))
                date_label = dt.strftime("%b %d")
            except Exception:
                day_label = f"Day {i+1}"
                date_label = d_str

            code = d_codes[i] if i < len(d_codes) else 0
            cond = decode_weather_code(code)
            high = round(d_maxs[i], 1) if i < len(d_maxs) and d_maxs[i] is not None else None
            low = round(d_mins[i], 1) if i < len(d_mins) and d_mins[i] is not None else None
            prob = d_probs[i] if i < len(d_probs) and d_probs[i] is not None else 0

            daily_norm.append({
                "day": day_label,
                "date": d_str,
                "formatted_date": date_label,
                "high": high,
                "low": low,
                "condition": cond["condition"],
                "icon": cond["icon"],
                "rainProbability": prob,
                "humidity": current_norm["humidity"],
            })

        # Assemble normalized response matching WeatherData schema
        normalized_data = {
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "city": (location_meta or {}).get("city"),
                "district": (location_meta or {}).get("district"),
                "state": (location_meta or {}).get("state"),
                "country": (location_meta or {}).get("country", "India"),
            },
            "current": current_norm,
            "hourly": hourly_norm,
            "daily": daily_norm,
            "source": {
                "provider": self.provider.provider_name,
                "retrieved_at": now_iso,
                "is_cached": False,
            },
        }

        # 7. Store in 5-minute backend cache
        weather_cache_service.set(latitude, longitude, normalized_data)
        return normalized_data

weather_agent = WeatherAgent()
