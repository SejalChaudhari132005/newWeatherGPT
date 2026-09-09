"""
IMD Service Package for WeatherGPT.
Centralized package for official India Meteorological Department API integration.
"""

from backend.app.services.imd.imd_client import imd_client, IMDClient, IMDErrorCategory
from backend.app.services.imd.imd_endpoints import IMD_ENDPOINTS, DEFAULT_IMD_BASE_URL
from backend.app.services.imd.imd_normalizer import (
    normalize_current_weather,
    normalize_forecast,
    normalize_nowcast,
    normalize_warnings,
)
from backend.app.services.imd.imd_diagnostics import imd_diagnostic_service, IMDDiagnosticService

__all__ = [
    "imd_client",
    "IMDClient",
    "IMDErrorCategory",
    "IMD_ENDPOINTS",
    "DEFAULT_IMD_BASE_URL",
    "normalize_current_weather",
    "normalize_forecast",
    "normalize_nowcast",
    "normalize_warnings",
    "imd_diagnostic_service",
    "IMDDiagnosticService",
]
