"""
WeatherGPT — Bhashini Dedicated Endpoints.
Implements exact endpoints specified in Sections 27-30 & 46:
- POST /api/bhashini/asr
- POST /api/bhashini/translate
- POST /api/bhashini/tts
- POST /api/bhashini/detect-language
- GET  /api/bhashini/languages
- GET  /api/bhashini/health
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel, Field
from backend.app.services.bhashini_service import bhashini_service
from backend.app.services.language_service import language_service
from backend.app.core.logging import logger

router = APIRouter(prefix="/bhashini", tags=["BHASHINI Multilingual & Voice Layer"])


class BhashiniASRResponse(BaseModel):
    text: str
    language: str
    confidence: Optional[float] = None


class BhashiniTranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Source text to translate")
    sourceLanguage: Optional[str] = Field("auto", description="Source language ISO code (e.g. mr, hi, en) or 'auto'")
    targetLanguage: str = Field("en", description="Target language ISO code")


class BhashiniTranslateResponse(BaseModel):
    translatedText: str
    sourceLanguage: str
    targetLanguage: str


class BhashiniTTSRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to synthesize to speech")
    language: Optional[str] = Field("en", description="Target language ISO code (e.g. mr, hi, en)")
    gender: Optional[str] = Field("female", description="Speaker gender ('female' or 'male')")


class BhashiniTTSResponse(BaseModel):
    success: bool = True
    audioContent: str  # Base64 encoded audio
    audioFormat: str = "wav"
    language: str
    gender: str


class BhashiniDetectLanguageRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to detect language for")


class BhashiniDetectLanguageResponse(BaseModel):
    language: str
    script: Optional[str] = None
    confidence: Optional[float] = None


class BhashiniLanguageItem(BaseModel):
    code: str
    name: str
    native_name: str
    script: str


class BhashiniHealthResponse(BaseModel):
    provider: str = "BHASHINI"
    status: str
    supportedLanguages: List[Dict[str, Any]]
    capabilities: Dict[str, bool]
    message: Optional[str] = None


@router.post("/asr", response_model=BhashiniASRResponse, summary="Convert speech audio to text via BHASHINI ASR")
async def bhashini_asr_endpoint(
    audio: UploadFile = File(..., description="Audio recording file (wav, webm, mp3, ogg)"),
    language: Optional[str] = Form(None, description="Optional spoken language code hint"),
):
    try:
        audio_bytes = await audio.read()
        if not audio_bytes or len(audio_bytes) < 64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty or corrupted."
            )

        filename = (audio.filename or "audio.wav").lower()
        audio_format = "wav"
        if "webm" in filename or "webm" in (audio.content_type or ""):
            audio_format = "webm"
        elif "mp3" in filename or "mpeg" in (audio.content_type or ""):
            audio_format = "mp3"
        elif "ogg" in filename:
            audio_format = "ogg"

        target_lang = language_service.to_iso_code(language) if language else "hi"

        res = await bhashini_service.speech_to_text(
            audio_bytes=audio_bytes,
            source_language=target_lang,
            audio_format=audio_format,
        )

        return BhashiniASRResponse(
            text=res.get("text", ""),
            language=res.get("language", target_lang),
            confidence=res.get("confidence"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BhashiniAPI] ASR error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ASR transcription failed: {str(e)}"
        )


@router.post("/translate", response_model=BhashiniTranslateResponse, summary="Translate text via BHASHINI NMT")
async def bhashini_translate_endpoint(payload: BhashiniTranslateRequest):
    try:
        src = payload.sourceLanguage
        if not src or src == "auto":
            detected = language_service.detect_language(payload.text)
            src = detected["language"]

        src_iso = language_service.to_iso_code(src)
        tgt_iso = language_service.to_iso_code(payload.targetLanguage)

        res = await bhashini_service.translate_text(
            text=payload.text,
            source_language=src_iso,
            target_language=tgt_iso,
        )

        return BhashiniTranslateResponse(
            translatedText=res.get("translated_text", payload.text),
            sourceLanguage=src_iso,
            targetLanguage=tgt_iso,
        )
    except Exception as e:
        logger.error(f"[BhashiniAPI] Translate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts", response_model=BhashiniTTSResponse, summary="Synthesize speech audio via BHASHINI TTS")
async def bhashini_tts_endpoint(payload: BhashiniTTSRequest):
    try:
        lang_iso = language_service.to_iso_code(payload.language)
        gender = (payload.gender or "female").lower()

        res = await bhashini_service.text_to_speech(
            text=payload.text,
            language=lang_iso,
            gender=gender,
        )

        audio_payload = res.get("audio_content") or res.get("audio_base64", "")

        return BhashiniTTSResponse(
            success=True,
            audioContent=audio_payload,
            audioFormat=res.get("audio_format", "wav"),
            language=lang_iso,
            gender=gender,
        )

    except Exception as e:
        logger.error(f"[BhashiniAPI] TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-language", response_model=BhashiniDetectLanguageResponse, summary="Detect language via BHASHINI / Local rules")
async def bhashini_detect_language_endpoint(payload: BhashiniDetectLanguageRequest):
    try:
        res = language_service.detect_language(payload.text)
        return BhashiniDetectLanguageResponse(
            language=res["language"],
            script=res.get("script"),
            confidence=res.get("confidence"),
        )
    except Exception as e:
        logger.error(f"[BhashiniAPI] Detect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/languages", response_model=List[BhashiniLanguageItem], summary="Get supported Indian languages list")
async def bhashini_languages_endpoint():
    try:
        supported = bhashini_service.get_supported_languages()
        return [
            BhashiniLanguageItem(
                code=item["code"],
                name=item["name"],
                native_name=item["native_name"],
                script=item.get("script", "Native"),
            )
            for item in supported
        ]
    except Exception as e:
        logger.error(f"[BhashiniAPI] Languages error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=BhashiniHealthResponse, summary="Get BHASHINI layer health & capability status")
async def bhashini_health_endpoint():
    try:
        health_data = await bhashini_service.health_check()
        return BhashiniHealthResponse(
            provider="BHASHINI",
            status=health_data.get("status", "healthy"),
            supportedLanguages=health_data.get("supported_languages", []),
            capabilities={
                "asr": True,
                "translation": True,
                "tts": True,
            },
            message=health_data.get("message"),
        )
    except Exception as e:
        logger.error(f"[BhashiniAPI] Health error: {e}")
        return BhashiniHealthResponse(
            provider="BHASHINI",
            status="unhealthy",
            supportedLanguages=[],
            capabilities={"asr": False, "translation": False, "tts": False},
            message=str(e),
        )
