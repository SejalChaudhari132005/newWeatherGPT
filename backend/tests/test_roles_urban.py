"""
Automated unit and integration test suite for Urban Planning & City Infrastructure Intelligence (Phase 2).
Tests urban intelligence metrics, waterlogging hotspots, drainage timeline,
heat island zones, UrbanAgent registration, and FastAPI REST endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.app.services.urban_planner_service import urban_planner_service
from backend.app.agents.role_router import role_router
from backend.app.agents.urban_agent import urban_agent


@pytest.mark.asyncio
async def test_urban_service_intelligence():
    intel = await urban_planner_service.get_urban_intelligence(18.5204, 73.8567, "Pune Urban Core")
    assert intel.location_name == "Pune Urban Core"
    assert intel.urban_flood_risk in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert intel.rainfall_24h_mm >= 0.0
    assert intel.peak_rainfall_window is not None
    assert intel.peak_intensity_mmh >= 0.0
    assert intel.critical_infrastructure_risk_count >= 1
    assert 0.0 < intel.surface_runoff_coefficient <= 1.0
    assert 0 <= intel.drainage_capacity_utilization_pct <= 100
    assert intel.urban_heat_island_delta_c != 0.0
    assert intel.surface_temperature_c > 0.0


@pytest.mark.asyncio
async def test_urban_service_waterlogging_hotspots():
    hotspots = await urban_planner_service.get_waterlogging_hotspots("Pune Urban Core", flood_risk="HIGH")
    assert isinstance(hotspots, list)
    assert len(hotspots) >= 3
    for h in hotspots:
        assert h.hotspot_name is not None
        assert h.elevation_dip_m > 0.0
        assert h.predicted_water_depth_cm >= 0
        assert h.drainage_status in ["OPERATIONAL", "AT CAPACITY", "SURCHARGED", "CRITICAL"]
        assert len(h.mitigation_action) > 0


@pytest.mark.asyncio
async def test_urban_service_drainage_timeline():
    timeline = await urban_planner_service.get_drainage_timeline(18.5204, 73.8567)
    assert isinstance(timeline, list)
    assert len(timeline) == 4
    for m in timeline:
        assert m.projected_rainfall_mm >= 0.0
        assert m.drainage_capacity_m3_per_hr > 0.0
        assert m.capacity_status in ["CLEAR", "NEAR CAPACITY", "SURCHARGED"]


@pytest.mark.asyncio
async def test_urban_service_heat_island_zones():
    zones = await urban_planner_service.get_heat_island_zones("Pune Urban Core", ambient_temp=31.0)
    assert isinstance(zones, list)
    assert len(zones) >= 3
    for z in zones:
        assert z.zone_name is not None
        assert 0.0 <= z.canopy_cover_pct <= 100.0
        assert 0.0 <= z.impervious_surface_pct <= 100.0
        assert z.vulnerability_rating in ["LOW", "MODERATE", "HIGH", "CRITICAL"]


@pytest.mark.asyncio
async def test_urban_service_briefing():
    briefing = await urban_planner_service.generate_urban_briefing(18.5204, 73.8567, "Pune Urban Core")
    assert briefing.success is True
    assert briefing.urban_intelligence is not None
    assert len(briefing.waterlogging_hotspots) > 0
    assert len(briefing.drainage_timeline) > 0
    assert len(briefing.heat_island_zones) > 0
    assert len(briefing.infrastructure_exposure) > 0
    assert len(briefing.planning_recommendations) >= 3


def test_urban_agent_registration():
    agent = role_router.get_agent("urban_planner")
    assert agent is not None
    assert agent.role_name == "urban_planner"

    alias_agent = role_router.get_agent("urban")
    assert alias_agent.role_name == "urban_planner"
    assert role_router.is_role_supported("urban_planner") is True


@pytest.mark.asyncio
async def test_urban_rest_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Urban Intelligence
        res1 = await client.get("/api/roles/urban/intelligence?lat=18.5204&lon=73.8567&location_name=Pune+Urban+Core")
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["location_name"] == "Pune Urban Core"
        assert "urban_flood_risk" in data1
        assert "peak_rainfall_window" in data1

        # 2. Waterlogging Hotspots
        res2 = await client.get("/api/roles/urban/waterlogging-hotspots?location_name=Pune+Urban+Core&flood_risk=HIGH")
        assert res2.status_code == 200
        data2 = res2.json()
        assert isinstance(data2, list)
        assert len(data2) >= 1

        # 3. Drainage Timeline
        res3 = await client.get("/api/roles/urban/drainage-timeline?lat=18.5204&lon=73.8567")
        assert res3.status_code == 200
        data3 = res3.json()
        assert isinstance(data3, list)
        assert len(data3) == 4

        # 4. Heat Island Zones
        res4 = await client.get("/api/roles/urban/heat-island-zones?location_name=Pune+Urban+Core&ambient_temp=30.0")
        assert res4.status_code == 200
        data4 = res4.json()
        assert isinstance(data4, list)
        assert len(data4) >= 1

        # 5. Infrastructure Exposure
        res5 = await client.get("/api/roles/urban/infrastructure-exposure?location_name=Pune+Urban+Core")
        assert res5.status_code == 200
        data5 = res5.json()
        assert isinstance(data5, list)
        assert len(data5) >= 1

        # 6. Full Urban Briefing
        res6 = await client.get("/api/roles/urban/briefing?lat=18.5204&lon=73.8567&location_name=Pune+Urban+Core")
        assert res6.status_code == 200
        data6 = res6.json()
        assert data6["success"] is True
        assert "urban_intelligence" in data6
        assert len(data6["planning_recommendations"]) >= 1
