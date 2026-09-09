from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class GeocodingProvider(ABC):
    """Abstract Base Class for Reverse Geocoding Providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Reverse geocode latitude and longitude into normalized address structure.
        """
        pass

class LocationSearchProvider(ABC):
    """Abstract Base Class for Manual Location Search Providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def search_location(self, query: str) -> List[Dict[str, Any]]:
        """
        Search places/cities/villages/PIN codes by text query.
        """
        pass
