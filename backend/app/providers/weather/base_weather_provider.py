from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseWeatherProvider(ABC):
    """
    Abstract interface for external weather data providers.
    Actual implementations (Open-Meteo, IMD, GFS, WRF, etc.) will inherit from this class.
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_forecast(self, latitude: float, longitude: float, days: int = 7) -> Dict[str, Any]:
        pass
