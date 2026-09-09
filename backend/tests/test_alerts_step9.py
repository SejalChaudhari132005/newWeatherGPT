"""
Unit and Integration Tests for Step 9: Citizen Alert & Early Warning Engine.
"""

import pytest
from datetime import datetime, timezone
from backend.app.core.alert_thresholds import (
    alert_thresholds,
    AlertType,
    AlertSeverity,
)
from backend.app.services.citizen_alert_engine import citizen_alert_engine
from backend.app.schemas.weather import LocationMeta, HourlyForecastItem, DailyForecastItem
from backend.app.schemas.weather_intelligence import (
    WeatherIntelligenceData,
    CurrentIntelligence,
    ForecastIntelligence,
    ProvenanceValue,
    ConfidenceAssessment,
    DataFreshness,
    RiskAssessment,
    OfficialIntelligence,
)
from backend.app.schemas.alerts import IMDAlert, CitizenAlert, UserAlertPreferences


def build_mock_intelligence(
    temp: float = 28.0,
    rain_prob: float = 20.0,
    precipitation_mm: float = 0.0,
    wind_spd: float = 12.0,
    visibility_km: float = 10.0,
    weather_code: int = 1,
    alerts: list = None,
) -> WeatherIntelligenceData:
    now_iso = datetime.now(timezone.utc).isoformat()
    return WeatherIntelligenceData(
        location=LocationMeta(
            latitude=19.2437,
            longitude=73.1355,
            city="Kalyan-Dombivli",
            district="Thane",
            state="Maharashtra",
            country="India",
        ),
        current=CurrentIntelligence(
            temperature=ProvenanceValue(value=temp, unit="°C", source="Open-Meteo"),
            feels_like=ProvenanceValue(value=temp + 2.0, unit="°C", source="Open-Meteo"),
            humidity=ProvenanceValue(value=75.0, unit="%", source="Open-Meteo"),
            wind_speed=ProvenanceValue(value=wind_spd, unit="km/h", source="Open-Meteo"),
            wind_direction=ProvenanceValue(value="SW", unit="°", source="Open-Meteo"),
            pressure=ProvenanceValue(value=1010.0, unit="hPa", source="Open-Meteo"),
            visibility=ProvenanceValue(value=visibility_km, unit="km", source="Open-Meteo"),
            uv_index=ProvenanceValue(value=4.0, unit="index", source="Open-Meteo"),
            precipitation=ProvenanceValue(value=precipitation_mm, unit="mm", source="Open-Meteo"),
            rain_probability=ProvenanceValue(value=rain_prob, unit="%", source="Open-Meteo"),
            condition="Partly Cloudy",
            weather_code=weather_code,
            observed_at=now_iso,
        ),
        forecast=ForecastIntelligence(
            daily=[
                DailyForecastItem(
                    date="2026-09-09",
                    day="Today",
                    condition="Scattered Clouds",
                    icon="cloud",
                    high=32.0,
                    low=24.0,
                    rainProbability=rain_prob,
                )
            ],
            hourly=[
                HourlyForecastItem(
                    time="14:00",
                    temp=temp,
                    condition="Cloudy",
                    icon="cloud-rain",
                    rainProb=rain_prob,
                )
            ],
        ),
        official_information=OfficialIntelligence(status="available", observations=[], advisories=[]),
        alerts=alerts or [],
        risks=RiskAssessment(overall_level="low", summary="Normal conditions"),
        confidence=ConfidenceAssessment(score=85, level="high"),
        data_freshness=DataFreshness(retrieved_at=now_iso, status="fresh", age_minutes=0),
        source_status={},
        insights=[],
        generated_at=now_iso,
    )


import asyncio


def test_normal_weather_no_alerts():
    """Verify that calm weather generates no active alerts."""
    async def _run():
        intel = build_mock_intelligence(temp=28.0, rain_prob=15.0, wind_spd=10.0)
        alerts = await citizen_alert_engine.evaluate_weather(intel)
        assert len(alerts) == 0
    asyncio.run(_run())


def test_heavy_rain_warning_evaluation():
    """Verify that heavy precipitation triggers a HEAVY_RAIN alert with actionable advice."""
    async def _run():
        intel = build_mock_intelligence(
            temp=26.0,
            rain_prob=90.0,
            precipitation_mm=12.5,  # > 7.5 mm/hr
            weather_code=65,
        )
        alerts = await citizen_alert_engine.evaluate_weather(intel)
        assert len(alerts) >= 1
        rain_alert = next((a for a in alerts if "RAIN" in a.type), None)
        assert rain_alert is not None
        assert rain_alert.severity in [AlertSeverity.WATCH.value, AlertSeverity.WARNING.value, AlertSeverity.SEVERE.value]
        assert "Kalyan-Dombivli" in rain_alert.location_name
        assert len(rain_alert.recommended_actions) > 0
        assert len(rain_alert.what_to_avoid) > 0
        assert any("umbrella" in act.lower() or "rain" in act.lower() for act in rain_alert.recommended_actions)
    asyncio.run(_run())


def test_heatwave_warning_evaluation():
    """Verify that extreme heat generates HEATWAVE alert."""
    async def _run():
        intel = build_mock_intelligence(
            temp=41.5,
            rain_prob=0.0,
            wind_spd=8.0,
        )
        alerts = await citizen_alert_engine.evaluate_weather(intel)
        assert len(alerts) >= 1
        heat_alert = next((a for a in alerts if a.type == AlertType.HEATWAVE.value), None)
        assert heat_alert is not None
        assert heat_alert.severity in [AlertSeverity.WARNING.value, AlertSeverity.SEVERE.value]
        assert any("hydration" in act.lower() or "water" in act.lower() for act in heat_alert.recommended_actions)
    asyncio.run(_run())


def test_thunderstorm_and_lightning_evaluation():
    """Verify thunderstorm WMO code generates THUNDERSTORM alert."""
    async def _run():
        intel = build_mock_intelligence(
            temp=29.0,
            rain_prob=70.0,
            weather_code=95,  # Thunderstorm
        )
        alerts = await citizen_alert_engine.evaluate_weather(intel)
        storm_alert = next((a for a in alerts if a.type == AlertType.THUNDERSTORM.value), None)
        assert storm_alert is not None
        assert storm_alert.severity == AlertSeverity.WATCH.value
        assert any("tree" in av.lower() or "metal" in av.lower() for av in storm_alert.what_to_avoid)
    asyncio.run(_run())


def test_official_imd_priority():
    """Verify that official IMD warnings take top priority and are preserved."""
    async def _run():
        official = IMDAlert(
            id="imd_alert_001",
            title="Heavy Rainfall and Squall Warning",
            description="Very heavy rainfall likely over Thane and coastal Maharashtra.",
            severity="orange",
            severity_label="WARNING",
            source="IMD",
            affected_area="Thane, Maharashtra",
        )
        intel = build_mock_intelligence(temp=27.0, rain_prob=60.0, alerts=[official])
        alerts = await citizen_alert_engine.evaluate_weather(intel)
        assert len(alerts) >= 1
        top = alerts[0]
        assert top.source == "IMD"
        assert top.confidence == 0.95
        assert top.metadata.get("is_official_imd") is True
    asyncio.run(_run())


def test_alert_deduplication_fingerprinting():
    """Verify that identical conditions create the same fingerprint and do not duplicate."""
    async def _run():
        intel = build_mock_intelligence(temp=41.0, rain_prob=0.0)
        alerts1 = await citizen_alert_engine.evaluate_weather(intel)
        alerts2 = await citizen_alert_engine.evaluate_weather(intel)

        assert len(alerts1) == len(alerts2)
        assert alerts1[0].fingerprint == alerts2[0].fingerprint
    asyncio.run(_run())


def test_mark_alert_read_and_preferences():
    """Verify marking alert as read and user preferences update."""
    async def _run():
        intel = build_mock_intelligence(temp=41.0)
        alerts = await citizen_alert_engine.evaluate_weather(intel)
        alert_id = alerts[0].id

        # Mark read
        ok = await citizen_alert_engine.mark_alert_as_read(alert_id, "user_123")
        assert ok is True

        # Check user preferences
        prefs = await citizen_alert_engine.get_user_preferences("user_123")
        assert prefs.severe_weather is True

        # Update preferences
        updated = await citizen_alert_engine.update_user_preferences("user_123", {"heavy_rain": False})
        assert updated.heavy_rain is False
        # severe_weather must remain protected
        assert updated.severe_weather is True
    asyncio.run(_run())
