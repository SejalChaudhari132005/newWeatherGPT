from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseGeolocationProvider(ABC):
    """
    Abstract interface for geolocation data providers.
    Actual implementations (Nominatim, IP-API, etc.) will inherit from this class.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def search_location(self, query: str) -> List[Dict[str, Any]]:
        pass
