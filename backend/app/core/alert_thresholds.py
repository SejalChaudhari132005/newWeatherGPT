"""
WeatherGPT Citizen Alert Engine Thresholds and Risk Configuration.
Provides configurable constants for multi-hazard weather risk detection.
Never hardcoded throughout logic.
"""

from typing import Dict, Any, List
from enum import Enum


class AlertType(str, Enum):
    RAIN = "RAIN"
    HEAVY_RAIN = "HEAVY_RAIN"
    EXTREME_RAIN = "EXTREME_RAIN"
    THUNDERSTORM = "THUNDERSTORM"
    LIGHTNING = "LIGHTNING"
    HEATWAVE = "HEATWAVE"
    STRONG_WIND = "STRONG_WIND"
    EXTREME_WIND = "EXTREME_WIND"
    FLOOD_RISK = "FLOOD_RISK"
    POOR_VISIBILITY = "POOR_VISIBILITY"
    EXTREME_TEMPERATURE = "EXTREME_TEMPERATURE"
    CYCLONE = "CYCLONE"
    FOG = "FOG"
    COLD_WAVE = "COLD_WAVE"
    DUST_STORM = "DUST_STORM"
    HAIL = "HAIL"
    COASTAL_WARNING = "COASTAL_WARNING"


class AlertSeverity(str, Enum):
    INFO = "INFO"
    ADVISORY = "ADVISORY"
    WATCH = "WATCH"
    WARNING = "WARNING"
    SEVERE = "SEVERE"
    EMERGENCY = "EMERGENCY"


# Visual Color and UI Palette Mapping per Section 12
SEVERITY_METADATA: Dict[AlertSeverity, Dict[str, Any]] = {
    AlertSeverity.INFO: {
        "color": "blue",
        "bg_color": "bg-blue-50",
        "border_color": "border-blue-200",
        "text_color": "text-blue-800",
        "badge_bg": "bg-blue-100",
        "badge_text": "text-blue-900",
        "icon": "Info",
        "priority": 1,
    },
    AlertSeverity.ADVISORY: {
        "color": "yellow",
        "bg_color": "bg-amber-50",
        "border_color": "border-amber-200",
        "text_color": "text-amber-800",
        "badge_bg": "bg-amber-100",
        "badge_text": "text-amber-900",
        "icon": "AlertCircle",
        "priority": 2,
    },
    AlertSeverity.WATCH: {
        "color": "orange",
        "bg_color": "bg-orange-50",
        "border_color": "border-orange-200",
        "text_color": "text-orange-800",
        "badge_bg": "bg-orange-100",
        "badge_text": "text-orange-900",
        "icon": "AlertTriangle",
        "priority": 3,
    },
    AlertSeverity.WARNING: {
        "color": "strong_orange",
        "bg_color": "bg-orange-100",
        "border_color": "border-orange-300",
        "text_color": "text-orange-950",
        "badge_bg": "bg-orange-200",
        "badge_text": "text-orange-950",
        "icon": "AlertTriangle",
        "priority": 4,
    },
    AlertSeverity.SEVERE: {
        "color": "red",
        "bg_color": "bg-rose-50",
        "border_color": "border-rose-300",
        "text_color": "text-rose-900",
        "badge_bg": "bg-rose-100",
        "badge_text": "text-rose-950",
        "icon": "ShieldAlert",
        "priority": 5,
    },
    AlertSeverity.EMERGENCY: {
        "color": "critical_red",
        "bg_color": "bg-red-100",
        "border_color": "border-red-500",
        "text_color": "text-red-950",
        "badge_bg": "bg-red-600",
        "badge_text": "text-white",
        "icon": "Siren",
        "priority": 6,
    },
}


class AlertThresholds:
    """
    Configurable meteorological thresholds for alert classification.
    """

    # --- Precipitation Thresholds ---
    RAIN_PROB_ADVISORY: float = 40.0       # % probability for light rain advisory
    RAIN_PROB_WATCH: float = 65.0          # % probability for watch
    RAIN_PROB_WARNING: float = 80.0        # % probability for warning
    
    RAIN_MODERATE_HOURLY_MM: float = 2.5   # mm/hr
    RAIN_HEAVY_HOURLY_MM: float = 7.5      # mm/hr (IMD Heavy Rain starts ~64.5mm/24hr or ~7.5mm/hr)
    RAIN_VERY_HEAVY_HOURLY_MM: float = 15.0 # mm/hr
    RAIN_EXTREME_HOURLY_MM: float = 30.0   # mm/hr (Cloudburst/Flash Flood risk)

    # --- Thermal Thresholds ---
    HEAT_ADVISORY_TEMP: float = 37.0       # °C
    HEAT_WARNING_TEMP: float = 40.0        # °C
    HEAT_SEVERE_TEMP: float = 43.0         # °C (IMD Heatwave definition)
    HEAT_EMERGENCY_TEMP: float = 46.0      # °C (IMD Severe Heatwave)

    HEAT_FEELS_LIKE_WARNING: float = 42.0  # °C Heat Index
    HEAT_FEELS_LIKE_SEVERE: float = 46.0   # °C

    COLD_WAVE_MIN_TEMP: float = 8.0        # °C
    COLD_SEVERE_MIN_TEMP: float = 4.0      # °C

    # --- Wind Thresholds ---
    WIND_BREEZY_KMH: float = 25.0          # km/h
    WIND_STRONG_KMH: float = 40.0          # km/h
    WIND_GALE_KMH: float = 60.0            # km/h (Gale force)
    WIND_STORM_KMH: float = 85.0           # km/h (Cyclonic storm intensity)
    WIND_HURRICANE_KMH: float = 115.0      # km/h (Severe Cyclonic Storm)

    # --- Visibility Thresholds ---
    VISIBILITY_MODERATE_KM: float = 4.0    # km
    VISIBILITY_POOR_KM: float = 1.5        # km (Fog / Haze advisory)
    VISIBILITY_DENSE_FOG_KM: float = 0.5   # km (Dense Fog warning)
    VISIBILITY_ZERO_KM: float = 0.15       # km (Extreme fog hazard)

    # --- Convective / Thunderstorm Thresholds ---
    THUNDERSTORM_CODES: List[int] = [95, 96, 99]
    DRIZZLE_CODES: List[int] = [51, 53, 55, 56, 57]
    RAIN_CODES: List[int] = [61, 63, 65, 66, 67, 80, 81, 82]
    SNOW_CODES: List[int] = [71, 73, 75, 77, 85, 86]

    # --- UV Thresholds ---
    UV_VERY_HIGH: float = 8.0
    UV_EXTREME: float = 11.0


alert_thresholds = AlertThresholds()
