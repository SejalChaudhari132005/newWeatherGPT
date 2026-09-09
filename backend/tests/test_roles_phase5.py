"""
Test Suite for WeatherGPT Phase 5:
Multi-Agent Orchestration, Multi-Role Intent Classification, Dynamic Role Routing,
and BHASHINI Vernacular Voice Pipelines.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.agents.intent_agent import intent_agent
from backend.app.agents.role_router import role_router
from backend.app.agents.farmer_agent import farmer_agent
from backend.app.agents.fisherman_agent import fisherman_agent
from backend.app.agents.aviation_agent import aviation_agent
from backend.app.agents.citizen_agent import citizen_agent
from backend.app.agents.orchestrator_agent import orchestrator_agent
from backend.app.services.bhashini_service import bhashini_service


# ---------------------------------------------------------------------------
# 1. Multi-Role Intent Classification Tests
# ---------------------------------------------------------------------------

def test_farmer_intent_classification():
    """Verifies that agricultural queries map to farmer intents and role."""
    q1 = "Should I spray pesticide on my soybean crops tomorrow morning?"
    res1 = intent_agent.classify(q1)
    assert res1.intent in ["AGRI_SPRAY_RISK", "FARMING_DECISION"]
    assert res1.detected_role == "farmer"
    assert res1.crop_query == "Soybean"

    q2 = "कपाशीवर कीटकनाशक फवारणी करावी का?"
    res2 = intent_agent.classify(q2)
    assert res2.intent in ["AGRI_SPRAY_RISK", "FARMING_DECISION"]
    assert res2.detected_role == "farmer"
    assert res2.crop_query == "Cotton"

    q3 = "When is the best irrigation window for my field?"
    res3 = intent_agent.classify(q3)
    assert res3.intent in ["AGRI_IRRIGATION", "FARMING_WINDOWS", "FARMING_DECISION"]
    assert res3.detected_role == "farmer"


def test_fisherman_intent_classification():
    """Verifies that marine queries map to fisherman intents and role."""
    q1 = "Should I take my boat out to sail from Sassoon Docks tomorrow morning?"
    res1 = intent_agent.classify(q1)
    assert res1.intent in ["MARINE_SAIL_DECISION", "MARINE_ZONE_RISK"]
    assert res1.detected_role == "fisherman"
    assert res1.harbor_query == "Sassoon Docks (Mumbai)"

    q2 = "If I depart at 5 AM, when must I return to harbor?"
    res2 = intent_agent.classify(q2)
    assert res2.intent in ["MARINE_RETURN_TIME", "MARINE_SAIL_DECISION"]
    assert res2.detected_role == "fisherman"

    q3 = "What is the tide schedule and wave height at Ratnagiri?"
    res3 = intent_agent.classify(q3)
    assert res3.intent in ["MARINE_TIDE_SCHEDULE", "MARINE_ZONE_RISK"]
    assert res3.detected_role == "fisherman"
    assert res3.harbor_query == "Ratnagiri Mirkarwada"


def test_aviation_intent_classification():
    """Verifies that aviation queries map to aviation intents and role."""
    q1 = "Give me a flight briefing for Mumbai airport (VABB) for the next 3 hours"
    res1 = intent_agent.classify(q1)
    assert res1.intent == "AVIATION_BRIEFING"
    assert res1.detected_role == "aviation"
    assert res1.icao_query == "VABB"

    q2 = "What is the crosswind component on runway 28 at Delhi airport?"
    res2 = intent_agent.classify(q2)
    assert res2.intent in ["RUNWAY_CROSSWIND", "AVIATION_BRIEFING"]
    assert res2.detected_role == "aviation"
    assert res2.icao_query == "VIDP"
    assert res2.runway_query == "28"

    q3 = "Decode raw METAR for Bangalore airport VOBL"
    res3 = intent_agent.classify(q3)
    assert res3.intent in ["METAR_TAF_DECODE", "AVIATION_BRIEFING"]
    assert res3.detected_role == "aviation"
    assert res3.icao_query == "VOBL"


# ---------------------------------------------------------------------------
# 2. RoleRouter Dynamic Resolution & Aliases
# ---------------------------------------------------------------------------

def test_role_router_resolution():
    """Verifies that role_router resolves all roles and aliases correctly."""
    # Farmer aliases
    assert role_router.get_agent("farmer") == farmer_agent
    assert role_router.get_agent("agriculture") == farmer_agent
    assert role_router.get_agent("krishi") == farmer_agent

    # Fisherman aliases
    assert role_router.get_agent("fisherman") == fisherman_agent
    assert role_router.get_agent("fisher") == fisherman_agent
    assert role_router.get_agent("marine") == fisherman_agent

    # Aviation aliases
    assert role_router.get_agent("aviation") == aviation_agent
    assert role_router.get_agent("pilot") == aviation_agent
    assert role_router.get_agent("dispatcher") == aviation_agent

    # Citizen aliases
    assert role_router.get_agent("citizen") == citizen_agent
    assert role_router.get_agent("general") == citizen_agent
    assert role_router.get_agent(None) == citizen_agent

    # Supported roles check
    assert role_router.is_role_supported("farmer") is True
    assert role_router.is_role_supported("fisher") is True
    assert role_router.is_role_supported("aviation") is True
    assert role_router.is_role_supported("citizen") is True


# ---------------------------------------------------------------------------
# 3. BHASHINI Multilingual & Vernacular Audio Tests
# ---------------------------------------------------------------------------

def test_bhashini_language_detection():
    """Verifies Unicode and Marathi/Hindi heuristic detection."""
    mr_text = "उद्या पुण्यात पाऊस पडेल का?"
    res_mr = bhashini_service.detect_language(mr_text)
    assert res_mr["language"] == "mr"

    hi_text = "क्या कल दिल्ली में बारिश होगी?"
    res_hi = bhashini_service.detect_language(hi_text)
    assert res_hi["language"] == "hi"

    ta_text = "நாளை மழை பெய்யுமா?"
    res_ta = bhashini_service.detect_language(ta_text)
    assert res_ta["language"] == "ta"

    en_text = "Will it rain in Mumbai tomorrow?"
    res_en = bhashini_service.detect_language(en_text)
    assert res_en["language"] == "en"


@pytest.mark.asyncio
async def test_bhashini_tts_fallback_synthesis():
    """Verifies that TTS synthesis handles requests gracefully."""
    res = await bhashini_service.text_to_speech(
        text="शेतकरी मित्रांनो, उद्या सकाळी 7 ते 10 या वेळेत फवारणी करणे योग्य राहील.",
        language="mr",
    )
    assert "language" in res
    assert res["language"] == "mr"
    assert "audio_format" in res


# ---------------------------------------------------------------------------
# 4. Orchestrator Multi-Agent Conversational Execution
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_orchestrator_farmer_routing():
    """Verifies that agricultural queries trigger FarmerAgent and return farmer actions."""
    res = await orchestrator_agent.execute(
        query="Should I spray pesticide on my soybean crop tomorrow morning in Nashik?",
        context={
            "location": {"latitude": 19.9975, "longitude": 73.7898, "city": "Nashik", "state": "Maharashtra"},
            "role": "farmer",
        },
    )
    assert res is not None
    assert "message" in res
    assert res["intent"] in ["AGRI_SPRAY_RISK", "FARMING_DECISION", "GENERAL_WEATHER"]
    assert res["metadata"]["role"]["effective"] == "farmer"
    # Verify farmer action buttons
    button_ids = [b["id"] for b in res.get("action_buttons", [])]
    assert "view_farm" in button_ids or "spray_risk" in button_ids


@pytest.mark.asyncio
async def test_orchestrator_fisher_routing():
    """Verifies that marine queries trigger FishermanAgent and return marine actions."""
    res = await orchestrator_agent.execute(
        query="Should I sail out from Sassoon Docks tomorrow morning?",
        context={
            "location": {"latitude": 18.9100, "longitude": 72.8250, "city": "Mumbai", "state": "Maharashtra"},
            "role": "fisher",
        },
    )
    assert res is not None
    assert "message" in res
    assert res["metadata"]["role"]["effective"] in ["fisher", "fisherman"]
    # Verify fisher action buttons
    button_ids = [b["id"] for b in res.get("action_buttons", [])]
    assert "view_sea" in button_ids or "return_time" in button_ids


@pytest.mark.asyncio
async def test_orchestrator_aviation_routing():
    """Verifies that airport briefing queries trigger AviationAgent with airport geolocation."""
    res = await orchestrator_agent.execute(
        query="Give me a flight briefing for Mumbai airport VABB for the next 3 hours",
        context={"role": "aviation"},
    )
    assert res is not None
    assert "message" in res
    assert res["metadata"]["role"]["effective"] in ["aviation", "pilot", "dispatcher"]
    assert res["location"]["latitude"] is not None
    # Verify aviation action buttons
    button_ids = [b["id"] for b in res.get("action_buttons", [])]
    assert "view_aviation" in button_ids or "crosswind" in button_ids


# ---------------------------------------------------------------------------
# 5. REST API Multi-Role Conversational & Voice Endpoints
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_api_chat_role_switching():
    """Tests /api/chat with dynamic role personas."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Farmer persona
        r1 = await ac.post("/api/chat", json={
            "message": "When should I spray pesticide in Nagpur?",
            "role": "farmer",
            "location": {"latitude": 21.1458, "longitude": 79.0882, "city": "Nagpur", "state": "Maharashtra"}
        })
        assert r1.status_code == 200
        data1 = r1.json()
        assert data1["success"] is True
        assert data1["metadata"]["role"]["effective"] == "farmer"

        # 2. Fisher persona
        r2 = await ac.post("/api/chat", json={
            "message": "Is it safe to sail from Ratnagiri harbor tomorrow?",
            "role": "fisher",
            "location": {"latitude": 16.9800, "longitude": 73.2800, "city": "Ratnagiri", "state": "Maharashtra"}
        })
        assert r2.status_code == 200
        data2 = r2.json()
        assert data2["success"] is True
        assert data2["metadata"]["role"]["effective"] in ["fisher", "fisherman"]

        # 3. Aviation persona
        r3 = await ac.post("/api/chat", json={
            "message": "Briefing for Delhi airport VIDP runway 28",
            "role": "aviation",
            "location": {"latitude": 28.5562, "longitude": 77.1000, "city": "Delhi", "state": "Delhi"}
        })
        assert r3.status_code == 200
        data3 = r3.json()
        assert data3["success"] is True
        assert data3["metadata"]["role"]["effective"] in ["aviation", "pilot"]


@pytest.mark.asyncio
async def test_api_bhashini_voice_synthesis():
    """Tests /api/voice/synthesize and /api/bhashini/tts endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r_voice = await ac.post("/api/voice/synthesize", json={
            "text": "हवामान इशारा: आज समुद्रात वादळी वारे वाहण्याची शक्यता आहे.",
            "language": "mr",
            "gender": "female"
        })
        assert r_voice.status_code == 200
        data_voice = r_voice.json()
        assert data_voice["success"] is True
        assert data_voice["language"] == "mr"

        r_bhashini = await ac.post("/api/bhashini/tts", json={
            "text": "Weather alert: High crosswinds expected on active runway.",
            "language": "en",
            "gender": "female"
        })
        assert r_bhashini.status_code == 200
        data_bhashini = r_bhashini.json()
        assert data_bhashini["success"] is True
        assert data_bhashini["language"] == "en"
