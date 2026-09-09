"""
Voice Endpoints for WeatherGPT.
Provides Speech-to-Text (ASR) transcription and Text-to-Speech (TTS) synthesis.
"""

import base64
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Response
from pydantic import BaseModel, Field
from backend.app.services.bhashini_service import bhashini_service
from backend.app.services.language_service import language_service
from backend.app.core.logging import logger

router = APIRouter(prefix="/voice", tags=["Voice & Speech AI"])


class TranscribeResponse(BaseModel):
    text: str
    language: str
    confidence: Optional[float] = None


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to synthesize")
    language: Optional[str] = Field("en", description="Target ISO language code (e.g. mr, hi, en)")
    gender: Optional[str] = Field("female", description="'female' or 'male'")


class SynthesizeResponse(BaseModel):
    success: bool = True
    audioContent: str  # Base64 encoded audio
    audioFormat: str = "wav"
    language: str
    gender: str


@router.post("/transcribe", response_model=TranscribeResponse, summary="Transcribe user voice recording to text")
async def transcribe_voice_endpoint(
    audio: UploadFile = File(..., description="Audio recording file (wav, webm, mp3, ogg)"),
    language: Optional[str] = Form(None, description="Optional spoken language code hint"),
):
    """
    Accepts recorded microphone audio in multipart/form-data,
    sends audio to BHASHINI ASR, and returns transcript and detected language.
    Does NOT permanently store user audio.
    """
    try:
        audio_bytes = await audio.read()
        if not audio_bytes or len(audio_bytes) < 64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty or corrupted."
            )

        # Detect audio format
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

        return TranscribeResponse(
            text=res.get("text", ""),
            language=res.get("language", target_lang),
            confidence=res.get("confidence"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[VoiceAPI] Transcribe error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech transcription encountered an error: {str(e)}"
        )


@router.post("/synthesize", response_model=SynthesizeResponse, summary="Synthesize speech audio from text")
async def synthesize_voice_endpoint(payload: SynthesizeRequest):
    """
    Synthesizes speech audio from text using BHASHINI TTS.
    Returns Base64 audio stream for browser playback.
    """
    try:
        lang_iso = language_service.to_iso_code(payload.language)
        gender = (payload.gender or "female").lower()

        res = await bhashini_service.text_to_speech(
            text=payload.text,
            language=lang_iso,
            gender=gender,
        )

        return SynthesizeResponse(
            success=True,
            audioContent=res.get("audio_content", ""),
            audioFormat=res.get("audio_format", "wav"),
            language=lang_iso,
            gender=gender,
        )
    except Exception as e:
        logger.error(f"[VoiceAPI] Synthesize error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech synthesis encountered an error: {str(e)}"
        )
