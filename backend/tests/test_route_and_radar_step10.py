import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.app.services.radar_service import radar_locator_service, imd_radar_service
from backend.app.services.routing_service import routing_service
from backend.app.services.route_weather_service import route_weather_service, RouteRiskEngine
from backend.app.services.imd_weather_service import imd_weather_service
from backend.app.agents.intent_agent import intent_agent
from backend.app.agents.orchestrator_agent import orchestrator_agent


def test_nearest_imd_radar_locator():
    # 1. Kalyan / Mumbai region (19.24, 73.13) should map to Mumbai radar
    mum_radar = radar_locator_service.locate_nearest_radar(19.2437, 73.1355)
    assert mum_radar["state"] == "Maharashtra"
    assert "Mumbai" in mum_radar["station_name"]
    assert mum_radar["distance_from_user_km"] < 60.0
    assert mum_radar["is_within_coverage"] is True
    assert "https://" in mum_radar["imagery_url"]

    # 2. Pune region (18.52, 73.85) should map to Pune radar
    pune_radar = radar_locator_service.locate_nearest_radar(18.5204, 73.8567)
    assert "Pune" in pune_radar["station_name"]
    assert pune_radar["distance_from_user_km"] < 25.0

    # 3. Delhi region (28.61, 77.20) should map to Delhi radar
    delhi_radar = radar_locator_service.locate_nearest_radar(28.6139, 77.2090)
    assert "Delhi" in delhi_radar["station_name"]


def test_routing_service_geometry_and_waypoints():
    async def _run():
        route = await routing_service.get_route(
            origin_lat=19.2437,
            origin_lon=73.1355,
            dest_lat=18.5204,
            dest_lon=73.8567,
            origin_name="Kalyan",
            dest_name="Pune",
        )
        assert route["success"] is True
        assert route["distance_km"] > 80.0
        assert route["duration_minutes"] > 60
        assert len(route["waypoints"]) >= 4
        assert route["waypoints"][0]["name"] == "Kalyan"
        assert route["waypoints"][-1]["name"] == "Pune"

    asyncio.run(_run())


def test_route_weather_analysis_and_hazards():
    async def _run():
        analysis = await route_weather_service.analyze_route(
            origin_lat=19.2437,
            origin_lon=73.1355,
            dest_lat=18.5204,
            dest_lon=73.8567,
            origin_name="Kalyan",
            dest_name="Pune",
            departure_time="08:00",
            language="en",
        )
        assert analysis["success"] is True
        assert analysis["origin"]["name"] == "Kalyan"
        assert analysis["destination"]["name"] == "Pune"
        assert "distance_km" in analysis
        assert "formatted_duration" in analysis
        assert analysis["overall_risk"] in ["low", "moderate", "high", "severe"]
        assert len(analysis["segments"]) >= 4
        assert "sources" in analysis
        assert any("IMD" in s["provider"] for s in analysis["sources"])

    asyncio.run(_run())


def test_departure_time_comparison():
    async def _run():
        comp = await route_weather_service.compare_departure_times(
            origin_lat=19.2437,
            origin_lon=73.1355,
            dest_lat=18.5204,
            dest_lon=73.8567,
            origin_name="Kalyan",
            dest_name="Pune",
            candidate_times=["06:00", "09:00", "12:00", "16:00"],
            language="en",
        )
        assert comp["success"] is True
        assert len(comp["comparison"]) == 4
        assert comp["recommended_departure"] in ["06:00", "09:00", "12:00", "16:00"]
        assert "lowest weather risk" in comp["recommendation_summary"]

    asyncio.run(_run())


def test_intent_agent_travel_and_route_queries():
    # 1. Route analysis query
    q1 = intent_agent.classify("Will it rain while travelling from Kalyan to Pune?")
    assert q1.intent == "ROUTE_WEATHER_ANALYSIS"
    assert q1.origin_query == "Kalyan"
    assert q1.destination_query == "Pune"

    # 2. Departure comparison query
    q2 = intent_agent.classify("Compare 6 AM and 9 AM departure to Pune")
    assert q2.intent == "DEPARTURE_TIME_COMPARISON"


def test_orchestrator_travel_route_chat():
    async def _run():
        res = await orchestrator_agent.execute(
            query="Will it rain while travelling from Kalyan to Pune?",
            context={
                "user_id": "test-user-10",
                "gps_latitude": 19.2437,
                "gps_longitude": 73.1355,
                "gps_city": "Kalyan",
                "gps_state": "Maharashtra",
            }
        )
        assert res["weather_used"] is True
        assert "action_buttons" in res
        assert len(res["action_buttons"]) >= 2
        assert "Route Weather Intelligence" in res["message"]["content"]
        assert "Kalyan" in res["message"]["content"]
        assert "Pune" in res["message"]["content"]

    asyncio.run(_run())


def test_api_route_and_radar_endpoints():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. Radar endpoint
            r1 = await ac.get("/api/weather/radar?latitude=19.2437&longitude=73.1355")
            assert r1.status_code == 200
            d1 = r1.json()
            assert d1["success"] is True
            assert "radar" in d1

            # 2. Map layers endpoint
            r2 = await ac.get("/api/map/layers?latitude=19.2437&longitude=73.1355")
            assert r2.status_code == 200
            d2 = r2.json()
            assert d2["success"] is True
            assert len(d2["supported_layers"]) >= 5

            # 3. Route analyze endpoint
            r3 = await ac.post("/api/route/analyze", json={
                "origin_lat": 19.2437,
                "origin_lon": 73.1355,
                "destination_lat": 18.5204,
                "destination_lon": 73.8567,
                "origin_name": "Kalyan",
                "destination_name": "Pune",
                "departure_time": "08:00",
            })
            assert r3.status_code == 200
            d3 = r3.json()
            assert d3["success"] is True
            assert d3["origin"]["name"] == "Kalyan"

            # 4. Route compare-times endpoint
            r4 = await ac.post("/api/route/compare-times", json={
                "origin_lat": 19.2437,
                "origin_lon": 73.1355,
                "destination_lat": 18.5204,
                "destination_lon": 73.8567,
                "origin_name": "Kalyan",
                "destination_name": "Pune",
                "candidate_times": ["06:00", "09:00", "12:00"],
            })
            assert r4.status_code == 200
            d4 = r4.json()
            assert d4["success"] is True
            assert len(d4["comparison"]) == 3

    asyncio.run(_run())
