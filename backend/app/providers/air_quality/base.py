from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class AirQualityProvider(ABC):
    """
    Abstract Base Class for Air Quality data providers.
    Enables pluggable integration of Open-Meteo, CPCB, or other national networks.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def get_current_air_quality(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch current air quality observations by exact coordinates."""
        pass

    @abstractmethod
    async def get_hourly_air_quality(self, latitude: float, longitude: float, hours: int = 24) -> Dict[str, Any]:
        """Fetch hourly air quality forecast by exact coordinates."""
        pass
