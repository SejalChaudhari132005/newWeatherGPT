"""
Automated unit and integration test suite for Disaster Management Situational Intelligence (Phase 1).
Tests situational risk evaluation, active alerts stream, flood scores, lightning proxies,
DisasterAgent registration, and FastAPI REST endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.app.services.disaster_weather_service import disaster_weather_service
from backend.app.agents.role_router import role_router
from backend.app.agents.disaster_agent import disaster_agent


@pytest.mark.asyncio
async def test_disaster_service_situational_risk():
    # Test for Pune District (18.5204, 73.8567)
    risk = await disaster_weather_service.get_situational_risk(18.5204, 73.8567, "Pune District")
    assert risk.location_name == "Pune District"
    assert risk.risk_level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert risk.flood_risk_level in ["LOW", "MODERATE", "HIGH", "CRITICAL", "SEVERE"]
    assert 0 <= risk.flood_risk_score <= 100
    assert risk.rainfall_intensity_mmh >= 0.0
    assert risk.rainfall_24h_mm >= 0.0
    assert risk.wind_speed_kmh >= 0.0
    assert risk.wind_gust_kmh >= 0.0
    assert risk.lightning_strike_density >= 0
    assert risk.primary_hazard is not None


@pytest.mark.asyncio
async def test_disaster_service_active_alerts():
    alerts = await disaster_weather_service.get_active_alerts_stream(18.5204, 73.8567, "Pune District")
    assert isinstance(alerts, list)
    assert len(alerts) >= 1
    first = alerts[0]
    assert first.severity in ["RED", "ORANGE", "YELLOW", "GREEN"]
    assert first.headline is not None
    assert first.action_advisory is not None


@pytest.mark.asyncio
async def test_disaster_service_vulnerable_zones():
    zones = await disaster_weather_service.get_vulnerable_zones("Pune District", flood_score=65)
    assert isinstance(zones, list)
    assert len(zones) >= 3
    for z in zones:
        assert z.risk_level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert z.exposed_population > 0
        assert len(z.critical_infrastructure) > 0


@pytest.mark.asyncio
async def test_disaster_service_briefing():
    briefing = await disaster_weather_service.generate_disaster_briefing(18.5204, 73.8567, "Pune District")
    assert briefing.success is True
    assert briefing.situational_risk is not None
    assert len(briefing.active_alerts) > 0
    assert len(briefing.vulnerable_zones) > 0
    assert len(briefing.emergency_contacts) >= 4
    assert "PUNE DISTRICT" in briefing.narrative_briefing.upper()


def test_disaster_agent_registration():
    agent = role_router.get_agent("disaster_manager")
    assert agent is not None
    assert agent.role_name == "disaster_manager"

    alias_agent = role_router.get_agent("disaster")
    assert alias_agent.role_name == "disaster_manager"
    assert role_router.is_role_supported("disaster_manager") is True


@pytest.mark.asyncio
async def test_disaster_rest_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Situational Risk
        res1 = await client.get("/api/roles/disaster/situational-risk?lat=18.5204&lon=73.8567&location_name=Pune+District")
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["location_name"] == "Pune District"
        assert "risk_level" in data1
        assert "flood_risk_score" in data1

        # 2. Active Alerts Stream
        res2 = await client.get("/api/roles/disaster/alerts-stream?lat=18.5204&lon=73.8567&location_name=Pune+District")
        assert res2.status_code == 200
        data2 = res2.json()
        assert isinstance(data2, list)
        assert len(data2) >= 1

        # 3. Vulnerable Zones
        res3 = await client.get("/api/roles/disaster/vulnerable-zones?location_name=Pune+District&flood_score=55")
        assert res3.status_code == 200
        data3 = res3.json()
        assert isinstance(data3, list)
        assert len(data3) >= 1

        # 4. Full Briefing
        res4 = await client.get("/api/roles/disaster/briefing?lat=18.5204&lon=73.8567&location_name=Pune+District")
        assert res4.status_code == 200
        data4 = res4.json()
        assert data4["success"] is True
        assert "situational_risk" in data4
        assert "narrative_briefing" in data4
