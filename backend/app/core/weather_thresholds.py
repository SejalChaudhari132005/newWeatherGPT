from dataclasses import dataclass
from typing import Dict, Any

@dataclass(frozen=True)
class WeatherThresholds:
    """
    Centralized configurable meteorological thresholds for WeatherGPT
    Risk Engine, Insight Engine, Confidence Engine, and Freshness.
    """

    # --- Precipitation Probabilities (%) ---
    RAIN_PROB_HIGH: float = 70.0
    RAIN_PROB_MODERATE: float = 40.0
    RAIN_PROB_LOW: float = 15.0

    # --- Precipitation Quantities (mm/h or mm/day) ---
    RAIN_HEAVY_MM: float = 15.0
    RAIN_MODERATE_MM: float = 5.0
    RAIN_LIGHT_MM: float = 0.5

    # --- Temperature Thresholds (°C) ---
    TEMP_EXTREME_HEAT: float = 40.0
    TEMP_VERY_HOT: float = 35.0
    TEMP_HOT: float = 30.0
    TEMP_MODERATE_LOW: float = 20.0
    TEMP_COOL: float = 15.0
    TEMP_COLD: float = 10.0
    TEMP_FREEZING: float = 4.0

    # --- Wind Speed Thresholds (km/h) ---
    WIND_EXTREME: float = 60.0
    WIND_HIGH: float = 40.0
    WIND_MODERATE: float = 20.0
    WIND_CALM: float = 5.0

    # --- Visibility Thresholds (km) ---
    VISIBILITY_NORMAL: float = 5.0
    VISIBILITY_REDUCED: float = 2.0
    VISIBILITY_VERY_LOW: float = 1.0

    # --- UV Index Thresholds ---
    UV_EXTREME: float = 11.0
    UV_VERY_HIGH: float = 8.0
    UV_HIGH: float = 6.0
    UV_MODERATE: float = 3.0
    UV_LOW: float = 0.0

    # --- Humidity (%) ---
    HUMIDITY_VERY_HIGH: float = 85.0
    HUMIDITY_HIGH: float = 70.0
    HUMIDITY_LOW: float = 30.0

    # --- Provider Conflict Tolerance (°C / %) ---
    TEMP_CONFLICT_DELTA_C: float = 4.0
    HUMIDITY_CONFLICT_DELTA_PCT: float = 25.0

    # --- Data Freshness Windows (Seconds) ---
    FRESHNESS_FRESH_SECS: int = 1800     # < 30 minutes
    FRESHNESS_RECENT_SECS: int = 7200    # < 2 hours
    FRESHNESS_STALE_SECS: int = 21600    # > 6 hours

weather_thresholds = WeatherThresholds()
