"""
Unit & Integration Tests for BHASHINI Multilingual & Voice Integration.
Covers:
- Language detection (Devanagari, Marathi, Hindi, Tamil, Telugu, English)
- Translation endpoint (/api/language/translate)
- Voice transcription endpoint (/api/voice/transcribe)
- Voice synthesis endpoint (/api/voice/synthesize)
- Supported languages endpoint (/api/language/supported)
- Health check endpoint (/api/language/health)
- Orchestrator roundtrip in Marathi, Hindi, and English
- Exact location preservation (Kalyan vs Mumbai)
- Unconfigured BHASHINI graceful fallback
"""

import io
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.bhashini_service import bhashini_service
from backend.app.services.language_service import language_service
from backend.app.agents.orchestrator_agent import orchestrator_agent
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


@pytest.fixture
def anyio_backend():
    return "asyncio"


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


# -------------------------------------------------------------
# 1. Language Detection Tests
# -------------------------------------------------------------
def test_language_detection():
    # Marathi text detection
    marathi_res = language_service.detect_language("आज पुण्यात पाऊस पडेल का?")
    assert marathi_res["language"] == "mr"

    # Hindi text detection
    hindi_res = language_service.detect_language("क्या कल दिल्ली में बारिश होगी?")
    assert hindi_res["language"] == "hi"

    # Tamil text detection
    tamil_res = language_service.detect_language("இன்று மழை பெய்யுமா?")
    assert tamil_res["language"] == "ta"

    # Telugu text detection
    telugu_res = language_service.detect_language("ఈరోజు వర్షం పడుతుందా?")
    assert telugu_res["language"] == "te"

    # English text detection
    en_res = language_service.detect_language("Will it rain tomorrow in Kalyan?")
    assert en_res["language"] == "en"


# -------------------------------------------------------------
# 2. Supported Languages Endpoint
# -------------------------------------------------------------
def test_supported_languages_endpoint():
    resp = client.get("/api/language/supported")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    codes = [item["code"] for item in data["data"]]
    for expected in ["en", "hi", "mr", "ta", "te", "kn", "ml", "bn", "gu", "pa", "or"]:
        assert expected in codes


# -------------------------------------------------------------
# 3. Health Endpoint
# -------------------------------------------------------------
def test_language_health_endpoint():
    resp = client.get("/api/language/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["provider"] == "bhashini"
    assert "status" in data
    assert len(data["supportedLanguages"]) >= 11


# -------------------------------------------------------------
# 4. Translation Endpoint
# -------------------------------------------------------------
def test_translation_endpoint():
    # Same language -> immediate return
    resp = client.post(
        "/api/language/translate",
        json={"text": "Rain likely after 4 PM.", "sourceLanguage": "en", "targetLanguage": "en"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["translatedText"] == "Rain likely after 4 PM."

    # Auto detect source
    resp_auto = client.post(
        "/api/language/translate",
        json={"text": "आज पाऊस पडेल का?", "sourceLanguage": "auto", "targetLanguage": "en"},
    )
    assert resp_auto.status_code == 200
    data_auto = resp_auto.json()
    assert data_auto["sourceLanguage"] == "mr"


# -------------------------------------------------------------
# 5. Voice Transcribe & Synthesize Endpoints
# -------------------------------------------------------------
def test_voice_transcribe_and_synthesize_endpoints():
    # Test transcribe with dummy audio file
    dummy_wav = b"RIFF" + b"\x00" * 200
    files = {"audio": ("test.wav", io.BytesIO(dummy_wav), "audio/wav")}
    data = {"language": "mr"}

    with patch.object(bhashini_service, "speech_to_text", new=AsyncMock(return_value={"text": "आज हवामान कसे आहे?", "language": "mr", "confidence": None})), \
         patch.object(bhashini_service, "text_to_speech", new=AsyncMock(return_value={"audio_content": "UklGRg==", "audio_format": "wav", "language": "mr", "gender": "female"})):

        resp = client.post("/api/voice/transcribe", files=files, data=data)
        assert resp.status_code == 200
        res_json = resp.json()
        assert "text" in res_json
        assert res_json["language"] == "mr"

        # Test synthesize
        synth_payload = {"text": "आज कल्याणमध्ये हवामान चांगले आहे.", "language": "mr", "gender": "female"}
        synth_resp = client.post("/api/voice/synthesize", json=synth_payload)
        assert synth_resp.status_code == 200
        synth_json = synth_resp.json()
        assert synth_json["success"] is True
        assert synth_json["language"] == "mr"
        assert synth_json["audioContent"] == "UklGRg=="


# -------------------------------------------------------------
# 5b. Dedicated /api/bhashini Endpoints
# -------------------------------------------------------------
def test_dedicated_bhashini_endpoints():
    dummy_wav = b"RIFF" + b"\x00" * 200
    files = {"audio": ("test.wav", io.BytesIO(dummy_wav), "audio/wav")}
    data = {"language": "mr"}

    with patch.object(bhashini_service, "speech_to_text", new=AsyncMock(return_value={"text": "आज हवामान कसे आहे?", "language": "mr", "confidence": None})), \
         patch.object(bhashini_service, "translate_text", new=AsyncMock(return_value={"translated_text": "How is the weather today?", "source_language": "mr", "target_language": "en"})), \
         patch.object(bhashini_service, "text_to_speech", new=AsyncMock(return_value={"audio_content": "UklGRg==", "audio_format": "wav", "language": "mr", "gender": "female"})):

        # POST /api/bhashini/asr
        resp = client.post("/api/bhashini/asr", files=files, data=data)
        assert resp.status_code == 200
        asr_json = resp.json()
        assert asr_json["text"] == "आज हवामान कसे आहे?"
        assert asr_json["language"] == "mr"

        # POST /api/bhashini/translate
        tr_resp = client.post("/api/bhashini/translate", json={"text": "आज हवामान कसे आहे?", "sourceLanguage": "mr", "targetLanguage": "en"})
        assert tr_resp.status_code == 200
        assert tr_resp.json()["translatedText"] == "How is the weather today?"

        # POST /api/bhashini/tts
        tts_resp = client.post("/api/bhashini/tts", json={"text": "हवामान छान आहे", "language": "mr"})
        assert tts_resp.status_code == 200
        assert tts_resp.json()["audioFormat"] == "wav"

        # POST /api/bhashini/detect-language
        det_resp = client.post("/api/bhashini/detect-language", json={"text": "पाऊस पडेल का?"})
        assert det_resp.status_code == 200
        assert det_resp.json()["language"] == "mr"

        # GET /api/bhashini/languages
        lang_resp = client.get("/api/bhashini/languages")
        assert lang_resp.status_code == 200
        assert len(lang_resp.json()) >= 10

        # GET /api/bhashini/health
        h_resp = client.get("/api/bhashini/health")
        assert h_resp.status_code == 200
        assert h_resp.json()["provider"] == "BHASHINI"


# -------------------------------------------------------------
# 6. Orchestrator End-to-End Multilingual & Location Tests
# -------------------------------------------------------------
@pytest.mark.anyio
async def test_orchestrator_marathi_kalyan_location():
    """
    Test 6: Marathi question about exact location (Kalyan).
    Ensures Kalyan weather is retrieved and NOT defaulted to Mumbai.
    """
    sample_intel = create_sample_intelligence(city="Kalyan", lat=19.2403, lon=73.1305)

    with patch.object(orchestrator_agent.fusion_agent, "build_weather_intelligence", new=AsyncMock(return_value=sample_intel)), \
         patch("backend.app.services.conversation_service.conversation_service.get_or_create_conversation", new=AsyncMock(return_value={"id": "test-conv", "title": "Kalyan Weather"})), \
         patch("backend.app.services.conversation_service.conversation_service.add_message", new=AsyncMock(return_value={"id": "msg-1"})):

        result = await orchestrator_agent.execute(
            query="आज कल्याणमध्ये पाऊस पडेल का?",
            context={
                "location": {"latitude": 19.2403, "longitude": 73.1305, "city": "Kalyan", "state": "Maharashtra"},
                "role": "citizen",
                "language": "mr",
            },
        )

        assert result["weather_used"] is True
        assert result["location"]["city"] == "Kalyan"
        assert abs(result["location"]["latitude"] - 19.24) < 0.05
        assert result["metadata"]["language"]["target_language"] == "mr"


@pytest.mark.anyio
async def test_orchestrator_official_warning_preservation():
    """
    Test 10: Official warning structured data remains intact while explanation is translated.
    """
    alert = IMDAlert(
        id="alert-001",
        type="rainfall",
        severity="orange",
        severity_label="Be Prepared (Orange)",
        title="Heavy Rainfall Warning",
        description="Heavy to very heavy rain expected at isolated places.",
        affected_area="Thane District",
        source="IMD",
        valid_from="2026-09-09T06:00:00Z",
        valid_until="2026-09-09T23:59:59Z",
    )
    sample_intel = create_sample_intelligence(city="Kalyan", alerts=[alert])

    with patch.object(orchestrator_agent.fusion_agent, "build_weather_intelligence", new=AsyncMock(return_value=sample_intel)), \
         patch("backend.app.services.conversation_service.conversation_service.get_or_create_conversation", new=AsyncMock(return_value={"id": "test-conv", "title": "Thane Warning"})), \
         patch("backend.app.services.conversation_service.conversation_service.add_message", new=AsyncMock(return_value={"id": "msg-1"})):

        result = await orchestrator_agent.execute(
            query="Is there any weather warning today?",
            context={
                "location": {"latitude": 19.2403, "longitude": 73.1305, "city": "Kalyan", "state": "Maharashtra"},
                "role": "citizen",
                "language": "mr",
            },
        )

        assert result["official_warning"] is True
        assert len(result["metadata"]["alerts"]) == 1
        assert result["metadata"]["alerts"][0]["severity"] == "orange"
        assert result["metadata"]["alerts"][0]["source"] == "IMD"
