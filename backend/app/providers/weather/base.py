from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseWeatherProvider(ABC):
    """
    Abstract interface for weather providers.
    Every provider must implement fetch_weather(latitude, longitude).
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def fetch_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch raw current, hourly, and daily weather data for exact coordinates."""
        pass
