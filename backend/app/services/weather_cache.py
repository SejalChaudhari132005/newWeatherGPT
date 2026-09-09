import time
from typing import Dict, Any, Optional

class WeatherCacheService:
    """
    In-memory weather cache using rounded coordinate keys.
    Supports namespaced keys for Open-Meteo and IMD resources.
    """
    def __init__(self, ttl_seconds: int = 300):
        self.ttl = ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _make_key(self, latitude: float, longitude: float) -> str:
        lat_r = round(latitude, 4)
        lon_r = round(longitude, 4)
        return f"weather:{lat_r}:{lon_r}"

    def get(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        key = self._make_key(latitude, longitude)
        return self.get_by_key(key, self.ttl)

    def set(self, latitude: float, longitude: float, data: Dict[str, Any]) -> None:
        key = self._make_key(latitude, longitude)
        self.set_by_key(key, data)

    # --- Namespaced Cache for IMD and other services ---
    def get_by_key(self, key: str, custom_ttl: Optional[int] = None) -> Optional[Dict[str, Any]]:
        ttl = custom_ttl if custom_ttl is not None else self.ttl
        entry = self._cache.get(key)
        if not entry:
            return None

        if time.time() - entry["timestamp"] > ttl:
            del self._cache[key]
            return None

        return entry["data"]

    def set_by_key(self, key: str, data: Dict[str, Any]) -> None:
        self._cache[key] = {
            "timestamp": time.time(),
            "data": data
        }

    def clear(self) -> None:
        self._cache.clear()

weather_cache_service = WeatherCacheService(ttl_seconds=300)

class IMDCacheService:
    """
    Dedicated cache for IMD products (observations, warnings, nowcasts).
    Namespace: imd:{resource}:{location_key}
    """
    def __init__(self, default_ttl_seconds: int = 900):
        self.default_ttl = default_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _make_key(self, resource: str, location_key: str) -> str:
        clean_res = resource.strip().lower()
        clean_loc = location_key.strip().lower().replace(" ", "_")
        return f"imd:{clean_res}:{clean_loc}"

    def get(self, resource: str, location_key: str, ttl_seconds: Optional[int] = None) -> Optional[Any]:
        key = self._make_key(resource, location_key)
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        entry = self._cache.get(key)
        if not entry:
            return None

        if time.time() - entry["timestamp"] > ttl:
            del self._cache[key]
            return None

        return entry["data"]

    def set(self, resource: str, location_key: str, data: Any) -> None:
        key = self._make_key(resource, location_key)
        self._cache[key] = {
            "timestamp": time.time(),
            "data": data
        }

    def clear(self) -> None:
        self._cache.clear()

imd_cache_service = IMDCacheService(default_ttl_seconds=900)
