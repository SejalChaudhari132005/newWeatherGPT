"""
Unit and Integration Tests for IMD Diagnostic and Normalization Engine.
"""

import asyncio
from backend.app.services.imd.imd_client import imd_client, IMDErrorCategory
from backend.app.services.imd.imd_normalizer import (
    normalize_current_weather,
    normalize_forecast,
    normalize_nowcast,
    normalize_warnings,
)
from backend.app.services.imd.imd_diagnostics import imd_diagnostic_service
from backend.app.services.imd.imd_endpoints import IMD_ENDPOINTS


def test_imd_endpoints_catalog():
    """Verify all 10 capabilities exist in the catalog."""
    expected_caps = [
        "current_weather",
        "lat_lon_weather",
        "forecast",
        "nowcast",
        "warnings",
        "rainfall",
        "cyclone",
        "fishermen_warning",
        "radar",
        "lightning",
    ]
    for cap in expected_caps:
        assert cap in IMD_ENDPOINTS
        assert "endpoints" in IMD_ENDPOINTS[cap]
        assert len(IMD_ENDPOINTS[cap]["endpoints"]) > 0


def test_imd_client_safe_masked_key():
    """Ensure key is never leaked in plaintext."""
    info = imd_client.get_masked_key_info()
    assert "configured" in info
    if info["configured"]:
        assert "masked" in info
        assert "..." in info["masked"]


def test_imd_normalizer_current_weather():
    """Test normalizing raw observation payload."""
    raw_obs = {
        "Date": "2026-09-09",
        "Station_Code": "43003",
        "Station_Name": "Mumbai (Santacruz)",
        "Today_Max_temp": "31.2",
        "Today_Min_temp": "25.4",
        "Relative_Humidity_at_1730": "78",
        "Past_24_hrs_Rainfall": "14.5",
        "Todays_Forecast": "Generally cloudy sky with light to moderate rain",
    }
    meta = {"district": "Mumbai Suburban", "state": "Maharashtra"}
    norm = normalize_current_weather(raw_obs, meta)

    assert norm["source"] == "India Meteorological Department (IMD)"
    assert norm["temperature"] == 31.2
    assert norm["humidity"] == 78.0
    assert norm["rainfall_24h"] == 14.5
    assert norm["station"]["code"] == "43003"
    assert norm["forecast_summary"] == "Generally cloudy sky with light to moderate rain"


def test_imd_normalizer_warnings():
    """Test normalizing official warnings."""
    raw_warnings = [
        {
            "district_name": "Thane",
            "state_name": "Maharashtra",
            "colour_code": "Orange",
            "warning_type": "Heavy Rain",
            "warning_text": "Heavy to very heavy rainfall likely at isolated places.",
            "valid_from": "2026-09-09",
            "valid_to": "2026-09-10",
        },
        {
            "district_name": "Nagpur",
            "state_name": "Maharashtra",
            "colour_code": "Green",
            "warning_text": "No warning.",
        }
    ]
    norm = normalize_warnings(raw_warnings, filter_district="Thane")
    assert len(norm) == 1
    assert norm[0]["district"] == "Thane"
    assert norm[0]["severity"] == "orange"
    assert norm[0]["severity_label"] == "Alert / Be Prepared"


def test_imd_diagnostic_run():
    """Test diagnostic evaluation returns all 10 capability keys."""
    report = asyncio.run(imd_diagnostic_service.run_diagnostics(
        latitude=19.2597,
        longitude=73.1339,
        city_hint="Kalyan",
        district_hint="Thane",
        state_hint="Maharashtra",
    ))
    assert report["provider"] == "India Meteorological Department (IMD)"
    assert "services" in report
    services = report["services"]
    assert len(services) == 10
    assert "radar_specific_assessment" in report
    assert "1_radar_product_retrieval" in report["radar_specific_assessment"]
