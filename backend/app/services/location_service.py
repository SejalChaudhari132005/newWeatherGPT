from typing import Dict, Any, List, Optional
from backend.app.core.logging import logger
from backend.app.services.base_service import BaseService
from backend.app.providers.geolocation import (
    google_geocoding_provider,
    google_location_search_provider,
    GeocodingProvider,
    LocationSearchProvider
)

class LocationService(BaseService):
    def __init__(
        self,
        geocoding_provider: Optional[GeocodingProvider] = None,
        search_provider: Optional[LocationSearchProvider] = None,
    ):
        self.geocoding_provider = geocoding_provider or google_geocoding_provider
        self.search_provider = search_provider or google_location_search_provider

    async def reverse_geocode(self, latitude: float, longitude: float, source: str = "gps") -> Dict[str, Any]:
        """
        Reverse geocode latitude and longitude into normalized address structure.
        Coordinates are logged and preserved with zero rounding or alteration.
        """
        logger.info(f"[LocationService] Executing reverse geocode for lat={latitude}, lng={longitude}, source={source}")
        
        result = await self.geocoding_provider.reverse_geocode(latitude, longitude)
        result["source"] = source
        return result

    async def search_location(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for places/cities/villages/PIN codes matching text query.
        """
        logger.info(f"[LocationService] Executing location search for query: '{query}'")
        return await self.search_provider.search_location(query)

location_service = LocationService()
