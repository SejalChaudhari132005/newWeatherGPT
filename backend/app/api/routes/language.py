"""
Language Endpoints for WeatherGPT.
Provides language detection, translation, supported language discovery, and BHASHINI health check.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from backend.app.services.language_service import language_service
from backend.app.services.bhashini_service import bhashini_service
from backend.app.core.logging import logger

router = APIRouter(prefix="/language", tags=["Language & Multilingual Intelligence"])


class DetectLanguageRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Input text to detect language for")


class DetectLanguageResponse(BaseModel):
    success: bool = True
    language: str
    script: Optional[str] = None
    confidence: Optional[float] = None


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Source text to translate")
    sourceLanguage: Optional[str] = Field("auto", description="Source language ISO code (or 'auto')")
    targetLanguage: str = Field("en", description="Target language ISO code")


class TranslateResponse(BaseModel):
    success: bool = True
    translatedText: str
    sourceLanguage: str
    targetLanguage: str


class LanguageInfo(BaseModel):
    code: str
    name: str
    native_name: str
    script: str


class SupportedLanguagesResponse(BaseModel):
    success: bool = True
    data: List[LanguageInfo]


class LanguageHealthResponse(BaseModel):
    provider: str
    status: str
    supportedLanguages: List[Dict[str, Any]]
    message: Optional[str] = None


@router.post("/detect", response_model=DetectLanguageResponse, summary="Detect language of given text")
async def detect_language_endpoint(payload: DetectLanguageRequest):
    try:
        res = language_service.detect_language(payload.text)
        return DetectLanguageResponse(
            success=True,
            language=res["language"],
            script=res.get("script"),
            confidence=res.get("confidence"),
        )
    except Exception as e:
        logger.error(f"[LanguageAPI] Detect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translate", response_model=TranslateResponse, summary="Translate text between Indian languages and English")
async def translate_endpoint(payload: TranslateRequest):
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
        return TranslateResponse(
            success=True,
            translatedText=res.get("translated_text", payload.text),
            sourceLanguage=src_iso,
            targetLanguage=tgt_iso,
        )
    except Exception as e:
        logger.error(f"[LanguageAPI] Translate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/supported", response_model=SupportedLanguagesResponse, summary="Get list of supported Indian languages")
async def get_supported_languages_endpoint():
    try:
        langs = language_service.get_supported_languages()
        formatted = [
            LanguageInfo(
                code=l["code"],
                name=l["name"],
                native_name=l["native_name"],
                script=l["script"],
            )
            for l in langs
        ]
        return SupportedLanguagesResponse(success=True, data=formatted)
    except Exception as e:
        logger.error(f"[LanguageAPI] Supported error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=LanguageHealthResponse, summary="Health status of BHASHINI multilingual layer")
async def get_health_endpoint():
    try:
        health = await bhashini_service.health_check()
        return LanguageHealthResponse(
            provider=health.get("provider", "bhashini"),
            status=health.get("status", "unknown"),
            supportedLanguages=health.get("supportedLanguages", []),
            message=health.get("message"),
        )
    except Exception as e:
        logger.error(f"[LanguageAPI] Health error: {e}")
        return LanguageHealthResponse(
            provider="bhashini",
            status="degraded",
            supportedLanguages=bhashini_service.get_supported_languages(),
            message=str(e),
        )
