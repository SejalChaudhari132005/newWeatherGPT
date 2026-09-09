import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from backend.app.core.config import settings
from backend.app.providers.weather.base import BaseWeatherProvider
from backend.app.services.imd_location_mapper import imd_location_mapper, IMDLocationMapping
from backend.app.services.weather_cache import imd_cache_service

logger = logging.getLogger("imd_provider")

class IMDWeatherProvider(BaseWeatherProvider):
    """
    Official India Meteorological Department (IMD) Weather Provider.
    Communicates strictly with official IMD API endpoints.
    Handles location mapping, header authentication, parsing, and caching.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: Optional[float] = None
    ):
        self.base_url = (base_url or settings.IMD_API_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.IMD_API_KEY
        self.timeout = timeout or settings.IMD_TIMEOUT_SECONDS
        self.public_mausam_url = "https://mausam.imd.gov.in/api"

    @property
    def provider_name(self) -> str:
        return "India Meteorological Department"

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/json",
            "User-Agent": "WeatherGPT-India/1.0",
        }
        if self.api_key:
            headers["api_key"] = self.api_key
            headers["x-api-key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def get_current_observation(
        self,
        latitude: float,
        longitude: float,
        location_meta: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch official current observation from IMD for the mapped station.
        """
        mapping = imd_location_mapper.map_coordinates_to_imd(
            latitude=latitude,
            longitude=longitude,
            city_hint=(location_meta or {}).get("city"),
            district_hint=(location_meta or {}).get("district"),
            state_hint=(location_meta or {}).get("state"),
        )

        cache_key = f"obs:{mapping.station_code}"
        cached = imd_cache_service.get("observation", cache_key)
        if cached is not None:
            return cached

        # Attempt to query official IMD endpoints
        endpoints = [
            f"{self.base_url}/cityforecast?id={mapping.station_code}",
            f"{self.base_url}/current_wx_api?id={mapping.station_code}",
            f"{self.public_mausam_url}/current_wx_api.php?id={mapping.station_code}",
        ]

        raw_data = None
        for url in endpoints:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, headers=self._get_headers())
                    if resp.status_code == 200:
                        json_resp = resp.json()
                        if json_resp:
                            raw_data = json_resp
                            break
            except Exception as exc:
                logger.debug(f"[IMD] Observation endpoint {url} unavailable: {exc}")

        if not raw_data:
            return None

        # Normalize IMD raw observation data
        norm = self._normalize_observation(raw_data, mapping)
        if norm:
            imd_cache_service.set("observation", cache_key, norm)
        return norm

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        location_meta: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch official 7-day city weather forecast bulletin from IMD.
        """
        mapping = imd_location_mapper.map_coordinates_to_imd(
            latitude=latitude,
            longitude=longitude,
            city_hint=(location_meta or {}).get("city"),
            district_hint=(location_meta or {}).get("district"),
            state_hint=(location_meta or {}).get("state"),
        )

        cache_key = f"forecast:{mapping.station_code}"
        cached = imd_cache_service.get("forecast", cache_key)
        if cached is not None:
            return cached

        endpoints = [
            f"{self.base_url}/cityforecast?id={mapping.station_code}",
            f"{self.public_mausam_url}/cityforecast_api.php?id={mapping.station_code}",
        ]

        raw_data = None
        for url in endpoints:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, headers=self._get_headers())
                    if resp.status_code == 200:
                        raw_data = resp.json()
                        if raw_data:
                            break
            except Exception as exc:
                logger.debug(f"[IMD] Forecast endpoint {url} unavailable: {exc}")

        if not raw_data:
            return None

        norm = self._normalize_forecast(raw_data, mapping)
        if norm:
            imd_cache_service.set("forecast", cache_key, norm)
        return norm

    async def get_warnings(
        self,
        latitude: float,
        longitude: float,
        location_meta: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch official severe weather warnings & nowcasts from IMD
        for the given coordinates and administrative location.
        """
        mapping = imd_location_mapper.map_coordinates_to_imd(
            latitude=latitude,
            longitude=longitude,
            city_hint=(location_meta or {}).get("city"),
            district_hint=(location_meta or {}).get("district"),
            state_hint=(location_meta or {}).get("state"),
        )

        cache_key = f"warn:{mapping.district}:{mapping.state}"
        cached = imd_cache_service.get("warnings", cache_key)
        if cached is not None:
            return cached

        endpoints = [
            f"{self.base_url}/district_warning",
            f"{self.base_url}/districtnowcast",
            f"{self.public_mausam_url}/warnings_district_api.php",
        ]

        raw_warnings: List[Any] = []
        for url in endpoints:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, headers=self._get_headers())
                    if resp.status_code == 200:
                        json_resp = resp.json()
                        if isinstance(json_resp, list):
                            raw_warnings.extend(json_resp)
                        elif isinstance(json_resp, dict):
                            data_items = json_resp.get("data") or json_resp.get("warnings") or [json_resp]
                            if isinstance(data_items, list):
                                raw_warnings.extend(data_items)
                        if raw_warnings:
                            break
            except Exception as exc:
                logger.debug(f"[IMD] Warning endpoint {url} unavailable: {exc}")

        normalized_warnings = self._normalize_and_filter_warnings(raw_warnings, mapping)
        imd_cache_service.set("warnings", cache_key, normalized_warnings)
        return normalized_warnings

    async def get_advisories(
        self,
        latitude: float,
        longitude: float,
        location_meta: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch official Agromet or specialized advisories if available.
        """
        mapping = imd_location_mapper.map_coordinates_to_imd(
            latitude=latitude,
            longitude=longitude,
            city_hint=(location_meta or {}).get("city"),
            district_hint=(location_meta or {}).get("district"),
            state_hint=(location_meta or {}).get("state"),
        )
        return {
            "source": self.provider_name,
            "district": mapping.district,
            "subdivision": mapping.subdivision,
            "state": mapping.state,
            "status": "active",
        }

    async def fetch_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Unified IMD fetcher satisfying BaseWeatherProvider interface.
        """
        obs = await self.get_current_observation(latitude, longitude)
        warnings = await self.get_warnings(latitude, longitude)
        return {
            "provider": self.provider_name,
            "observation": obs,
            "warnings": warnings,
        }

    # --------------------------------------------------------------------------
    # Normalization Helpers
    # --------------------------------------------------------------------------

    def _normalize_observation(
        self,
        raw: Any,
        mapping: IMDLocationMapping
    ) -> Optional[Dict[str, Any]]:
        if not raw:
            return None

        item = raw[0] if isinstance(raw, list) and len(raw) > 0 else (raw if isinstance(raw, dict) else {})
        if not item:
            return None

        def safe_float(val: Any) -> Optional[float]:
            try:
                if val is None or val == "" or val == "-" or str(val).lower() == "na":
                    return None
                return float(val)
            except (ValueError, TypeError):
                return None

        temp = safe_float(item.get("Today_Max_temp") or item.get("temp") or item.get("temperature"))
        humidity = safe_float(item.get("Relative_Humidity_at_0830") or item.get("Relative_Humidity_at_1730") or item.get("humidity"))
        rainfall = safe_float(item.get("Past_24_hrs_Rainfall") or item.get("rainfall"))
        forecast_desc = item.get("Todays_Forecast") or item.get("weather_desc") or item.get("forecast")

        return {
            "source": self.provider_name,
            "station_name": mapping.station_name,
            "station_code": mapping.station_code,
            "district": mapping.district,
            "subdivision": mapping.subdivision,
            "state": mapping.state,
            "observed_at": item.get("Date") or datetime.now(timezone.utc).isoformat(),
            "temperature": temp,
            "humidity": humidity,
            "rainfall_past_24h": rainfall,
            "forecast_summary": str(forecast_desc) if forecast_desc else None,
            "attribution": "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India",
        }

    def _normalize_forecast(
        self,
        raw: Any,
        mapping: IMDLocationMapping
    ) -> Optional[Dict[str, Any]]:
        if not raw:
            return None
        return {
            "source": self.provider_name,
            "station_code": mapping.station_code,
            "station_name": mapping.station_name,
            "raw": raw,
        }

    def _normalize_and_filter_warnings(
        self,
        raw_list: List[Any],
        mapping: IMDLocationMapping
    ) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []

        if not raw_list:
            return results

        target_district = (mapping.district or "").lower().strip()
        target_state = (mapping.state or "").lower().strip()
        target_subdiv = (mapping.subdivision or "").lower().strip()

        for item in raw_list:
            if not isinstance(item, dict):
                continue

            # Extract location keys from IMD warning record
            item_district = str(item.get("district_name") or item.get("District") or item.get("district") or "").lower().strip()
            item_state = str(item.get("state_name") or item.get("State") or item.get("state") or "").lower().strip()
            item_subdiv = str(item.get("subdivision_name") or item.get("Subdivision") or "").lower().strip()

            # Location Relevance Filter: Only match if district, state, or subdivision aligns
            is_relevant = False
            if target_district and item_district and (target_district in item_district or item_district in target_district):
                is_relevant = True
            elif target_state and item_state and target_state == item_state:
                # If district specified in item, check if it matches
                if not item_district or (target_district and target_district in item_district):
                    is_relevant = True
            elif target_subdiv and item_subdiv and target_subdiv == item_subdiv:
                is_relevant = True

            if not is_relevant:
                continue

            # Classify Warning Type
            warning_text = str(
                item.get("warning_text")
                or item.get("warning")
                or item.get("description")
                or item.get("warn_msg")
                or ""
            )
            warn_lower = warning_text.lower()

            w_type = "other"
            if "rain" in warn_lower or "precipitation" in warn_lower or "flood" in warn_lower:
                w_type = "rainfall"
            elif "cyclone" in warn_lower or "depression" in warn_lower or "gale" in warn_lower:
                w_type = "cyclone"
            elif "thunder" in warn_lower or "lightning" in warn_lower or "squall" in warn_lower:
                w_type = "thunderstorm"
            elif "heat" in warn_lower:
                w_type = "heatwave"
            elif "cold" in warn_lower or "frost" in warn_lower:
                w_type = "coldwave"
            elif "fog" in warn_lower:
                w_type = "fog"
            elif "wind" in warn_lower or "gust" in warn_lower:
                w_type = "wind"

            # Classify Severity Level (Green / Yellow / Orange / Red)
            raw_color = str(
                item.get("colour_code")
                or item.get("color")
                or item.get("severity")
                or item.get("warning_color")
                or ""
            ).lower().strip()

            if "red" in raw_color or "warning" in raw_color or "take action" in raw_color:
                severity = "red"
                severity_label = "High Risk / Take Immediate Precautions"
            elif "orange" in raw_color or "amber" in raw_color or "alert" in raw_color or "be prepared" in raw_color:
                severity = "orange"
                severity_label = "Take Precautions (Alert)"
            elif "yellow" in raw_color or "watch" in raw_color or "be updated" in raw_color:
                severity = "yellow"
                severity_label = "Be Aware (Watch)"
            elif "green" in raw_color or "no warning" in raw_color:
                severity = "green"
                severity_label = "No Significant Warning"
            else:
                severity = "unknown"
                severity_label = "Official Advisory"

            # Build Normalized IMD Alert dictionary
            title = str(item.get("title") or item.get("warning_title") or f"IMD {w_type.title()} Warning").strip()
            affected_area = item.get("district_name") or mapping.district or mapping.state

            results.append({
                "id": str(item.get("id") or f"imd-alert-{len(results) + 1}"),
                "type": w_type,
                "severity": severity,
                "severity_label": severity_label,
                "title": title,
                "description": warning_text or f"Official IMD advisory issued for {affected_area}.",
                "valid_from": item.get("valid_from") or item.get("Date"),
                "valid_until": item.get("valid_until") or item.get("valid_to"),
                "affected_area": affected_area,
                "source": self.provider_name,
                "source_url": "https://mausam.imd.gov.in",
                "issued_at": item.get("issued_at") or item.get("issue_time") or datetime.now(timezone.utc).isoformat(),
            })

        return results

imd_weather_provider = IMDWeatherProvider()
