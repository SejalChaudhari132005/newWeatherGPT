import asyncio
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.agents.intent_agent import intent_agent
from backend.app.services.weather_context_service import weather_context_service
from backend.app.services.response_validator import response_validator
from backend.app.services.conversation_service import conversation_service
from backend.app.agents.orchestrator_agent import OrchestratorAgent
from backend.app.schemas.weather_intelligence import (
    WeatherIntelligenceData,
    CurrentIntelligence,
    ForecastIntelligence,
    OfficialIntelligence,
    OfficialObservation,
    RiskAssessment,
    RiskItem,
    WeatherInsight,
    ConfidenceAssessment,
    DataFreshness,
    ProvenanceValue,
)
from backend.app.schemas.weather import LocationMeta, HourlyForecastItem, DailyForecastItem
from backend.app.schemas.alerts import IMDAlert

client = TestClient(app)

def create_sample_intelligence(lat=19.2403, lon=73.1305, city="Kalyan", temp=28.0, rain_prob=20.0, alerts=None):
    if alerts is None:
        alerts = []
    
    return WeatherIntelligenceData(
        location=LocationMeta(
            latitude=lat,
            longitude=lon,
            city=city,
            district="Thane",
            state="Maharashtra",
            country="India",
            imd_station="Thane",
            imd_subdivision="Konkan & Goa",
        ),
        current=CurrentIntelligence(
            temperature=ProvenanceValue(value=temp, unit="°C", source="Open-Meteo"),
            feels_like=ProvenanceValue(value=temp + 3.0, unit="°C", source="Open-Meteo"),
            humidity=ProvenanceValue(value=70.0, unit="%", source="Open-Meteo"),
            wind_speed=ProvenanceValue(value=14.0, unit="km/h", source="Open-Meteo"),
            wind_direction=ProvenanceValue(value="WSW", unit="direction", source="Open-Meteo"),
            pressure=ProvenanceValue(value=1012.0, unit="hPa", source="Open-Meteo"),
            visibility=ProvenanceValue(value=8.0, unit="km", source="Open-Meteo"),
            uv_index=ProvenanceValue(value=5.0, unit="index", source="Open-Meteo"),
            precipitation=ProvenanceValue(value=0.0, unit="mm", source="Open-Meteo"),
            rain_probability=ProvenanceValue(value=rain_prob, unit="%", source="Open-Meteo"),
            condition="Partly Cloudy",
            icon="cloud-sun",
            weather_code=1,
            observed_at="2026-09-08T18:00:00Z",
        ),
        forecast=ForecastIntelligence(
            hourly=[
                HourlyForecastItem(time="NOW", temp=temp, condition="Partly Cloudy", icon="cloud-sun", rainProb=int(rain_prob)),
                HourlyForecastItem(time="02 PM", temp=temp + 2.0, condition="Partly Cloudy", icon="cloud-sun", rainProb=int(rain_prob)),
            ],
            daily=[
                DailyForecastItem(day="Today", date="Sep 08", high=temp + 3.0, low=temp - 4.0, condition="Partly Cloudy", icon="cloud-sun", rainProbability=int(rain_prob)),
                DailyForecastItem(day="Tomorrow", date="Sep 09", high=temp + 4.0, low=temp - 3.0, condition="Scattered Clouds", icon="cloud-sun", rainProbability=int(rain_prob + 10)),
            ],
            source="Open-Meteo",
        ),
        official_information=OfficialIntelligence(
            status="available",
            observations=[
                OfficialObservation(
                    source="India Meteorological Department",
                    station_name="Thane",
                    station_code="43004",
                    temperature=temp - 0.5,
                    humidity=72.0,
                )
            ],
            advisories=[],
            attribution="India Meteorological Department",
        ),
        alerts=alerts,
        risks=RiskAssessment(
            overall_level="low",
            items={"rain": RiskItem(category="rain", level="low", score=15, reason="Low rain chance")},
            summary="Calm conditions",
            disclaimer="WeatherGPT algorithmic assessment",
        ),
        insights=[
            WeatherInsight(id="ins-1", category="comfort", headline="Comfortable Outlook", detail="Pleasant temperatures.", icon="smile", is_advisory=False)
        ],
        confidence=ConfidenceAssessment(
            score=88,
            level="high",
            agreement_level="good",
            conflict_warnings=[],
            factors=["Dual-provider telemetry active", "Real-time telemetry (< 15 min old)"],
            note="Good agreement",
        ),
        source_status={},
        data_freshness=DataFreshness(retrieved_at="2026-09-08T18:00:00Z", status="fresh", age_minutes=5),
        generated_at="2026-09-08T18:00:00Z",
    )

def test_intent_agent_classification():
    # 1. Rain Forecast
    res1 = intent_agent.classify("Will it rain tomorrow in Pune?")
    assert res1.intent == "RAIN_FORECAST"
    assert res1.time_range == "tomorrow"
    assert res1.location_query == "Pune"

    # 2. Temperature
    res2 = intent_agent.classify("How hot will it be tomorrow?")
    assert res2.intent == "TEMPERATURE"
    assert res2.time_range == "tomorrow"

    # 3. Weather Alert
    res3 = intent_agent.classify("Is there any warning or cyclone alert near me?")
    assert res3.intent == "WEATHER_ALERT"
    assert res3.requires_alert_data is True
    assert res3.is_relative_location is True

    # 4. Follow-up detection
    res4 = intent_agent.classify("What about evening?", context={"chat_history": [{"role": "user", "content": "Will it rain tomorrow?"}]})
    assert res4.is_follow_up is True

def test_weather_context_service_formatting():
    intel = create_sample_intelligence(temp=28.0, rain_prob=20.0)
    ctx_str = weather_context_service.build_llm_context(intel)

    assert "VERIFIED WEATHER INTELLIGENCE CONTEXT" in ctx_str
    assert "28.0°C" in ctx_str
    assert "Kalyan" in ctx_str
    assert "Open-Meteo" in ctx_str
    assert "No active official IMD warning was detected" in ctx_str
    assert "Confidence Score: 88/100" in ctx_str

def test_response_validator_anti_hallucination():
    intel = create_sample_intelligence(temp=28.0, alerts=[])

    # Case A: Hallucinated Red Alert
    bad_output_alert = "There is an active Red alert for extreme flooding in Kalyan today."
    is_valid, sanitized, meta = response_validator.validate_and_sanitize(bad_output_alert, intel, "Is there any warning?")
    assert is_valid is False
    assert "Fabricated alert detected" in meta["issues"][0]
    assert "No active official IMD warning" in sanitized

    # Case B: Impossible Temperature
    bad_output_temp = "The temperature today will be 48.0°C in Kalyan."
    is_valid_t, sanitized_t, meta_t = response_validator.validate_and_sanitize(bad_output_temp, intel, "What is the temperature?")
    assert is_valid_t is False
    assert "Temperature deviation" in meta_t["issues"][0]
    assert "28.0°C" in sanitized_t

    # Case C: Valid Truthful Response
    good_output = "The current temperature in Kalyan is 28.0°C with partly cloudy skies. Source: Open-Meteo."
    is_valid_g, sanitized_g, meta_g = response_validator.validate_and_sanitize(good_output, intel, "What is the temperature?")
    assert is_valid_g is True
    assert sanitized_g == good_output

def test_orchestrator_agent_flow_and_grounding():
    async def run_test():
        mock_fusion = AsyncMock()
        intel_kalyan = create_sample_intelligence(lat=19.2403, lon=73.1305, city="Kalyan", temp=28.0, rain_prob=80.0)
        mock_fusion.build_weather_intelligence.return_value = intel_kalyan

        orch = OrchestratorAgent(fusion_agent_inst=mock_fusion)

        res = await orch.execute(
            query="Will it rain tomorrow?",
            context={
                "user_id": "test_user_1",
                "conversation_id": "conv-1",
                "role": "citizen",
                "location": {"latitude": 19.2403, "longitude": 73.1305, "city": "Kalyan", "state": "Maharashtra"}
            }
        )

        assert res["conversation_id"] == "conv-1"
        assert res["message"]["role"] == "assistant"
        content = res["message"]["content"]
        # Grounding check: Since rain_prob is 80%, response must confirm rain likelihood
        assert "rain" in content.lower()
        # Verify metadata
        assert res["metadata"]["intent"] == "RAIN_FORECAST"
        assert res["metadata"]["location"]["latitude"] == 19.2403
        assert res["metadata"]["confidence"]["score"] == 88

    asyncio.run(run_test())

def test_orchestrator_agent_location_override_and_followup():
    async def run_test():
        mock_fusion = AsyncMock()
        intel_pune = create_sample_intelligence(lat=18.5204, lon=73.8567, city="Pune", temp=31.0, rain_prob=15.0)
        mock_fusion.build_weather_intelligence.return_value = intel_pune

        orch = OrchestratorAgent(fusion_agent_inst=mock_fusion)

        # Message 1: "What is the weather in Pune?"
        res1 = await orch.execute(
            query="What is the weather in Pune?",
            context={
                "user_id": "test_user_2",
                "conversation_id": "conv-pune",
                "role": "citizen",
                "location": {"latitude": 19.2403, "longitude": 73.1305, "city": "Kalyan", "state": "Maharashtra"}
            }
        )
        assert res1["metadata"]["location"]["city"] == "Pune"

        # Message 2: "What about tomorrow evening?" (Follow-up should retain Pune)
        res2 = await orch.execute(
            query="What about tomorrow evening?",
            context={
                "user_id": "test_user_2",
                "conversation_id": "conv-pune",
                "role": "citizen",
                "location": {"latitude": 19.2403, "longitude": 73.1305, "city": "Kalyan", "state": "Maharashtra"}
            }
        )
        assert res2["metadata"]["location"]["city"] == "Pune"

    asyncio.run(run_test())

def test_chat_api_endpoints():
    # 1. POST /api/chat
    payload = {
        "conversation_id": None,
        "message": "Is there any weather warning right now?",
        "user_id": "api_test_user",
        "role": "citizen",
        "location": {
            "latitude": 19.2403,
            "longitude": 73.1305,
            "city": "Kalyan",
            "state": "Maharashtra"
        }
    }

    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["conversation_id"] is not None
    assert "content" in data["message"]
    conv_id = data["conversation_id"]

    # 2. GET /api/chat/conversations
    res_list = client.get("/api/chat/conversations?user_id=api_test_user")
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["success"] is True
    assert len(list_data["data"]) >= 1

    # 3. GET /api/chat/conversations/search
    res_search = client.get("/api/chat/conversations/search?q=Weather&user_id=api_test_user")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["success"] is True

    # 4. GET /api/chat/conversations/{id}/messages
    res_msgs = client.get(f"/api/chat/conversations/{conv_id}/messages")
    assert res_msgs.status_code == 200
    msgs_data = res_msgs.json()
    assert len(msgs_data["data"]) >= 2  # user + assistant

    # 5. DELETE /api/chat/conversations/{id}
    res_del = client.delete(f"/api/chat/conversations/{conv_id}?user_id=api_test_user")
    assert res_del.status_code == 200

def test_groq_provider_initialization_and_factory():
    from backend.app.llm.groq_provider import GroqProvider
    from backend.app.llm.provider import get_llm_provider

    provider = GroqProvider(api_key="gsk_test_key_12345", model="openai/gpt-oss-120b")
    assert provider.name == "groq"
    assert provider.model_name == "openai/gpt-oss-120b"
    
    async def check():
        assert await provider.is_available() is True
    asyncio.run(check())

    with patch("backend.app.core.config.settings.GROQ_API_KEY", "gsk_test_key_12345"):
        with patch("backend.app.core.config.settings.LLM_PROVIDER", "groq"):
            resolved = get_llm_provider()
            assert isinstance(resolved, GroqProvider)
            assert resolved.name == "groq"

