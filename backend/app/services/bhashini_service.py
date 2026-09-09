"""
BhashiniService for WeatherGPT.
Integrates Government of India / MeitY BHASHINI (National Language Translation Mission)
Pipeline Configuration, Automatic Speech Recognition (ASR), Neural Machine Translation (NMT),
and Text-to-Speech (TTS) services with robust caching and graceful fallback.
"""

import time
import base64
import httpx
from typing import Dict, Any, Optional, List, Tuple
from backend.app.core.config import settings
from backend.app.core.logging import logger

# ISO-639-1 Language Definitions supported across Indian National Language Mission
BHASHINI_SUPPORTED_LANGUAGES: Dict[str, Dict[str, str]] = {
    "en": {"code": "en", "name": "English", "native_name": "English", "script": "Latin"},
    "hi": {"code": "hi", "name": "Hindi", "native_name": "हिन्दी", "script": "Devanagari"},
    "mr": {"code": "mr", "name": "Marathi", "native_name": "मराठी", "script": "Devanagari"},
    "ta": {"code": "ta", "name": "Tamil", "native_name": "தமிழ்", "script": "Tamil"},
    "te": {"code": "te", "name": "Telugu", "native_name": "తెలుగు", "script": "Telugu"},
    "kn": {"code": "kn", "name": "Kannada", "native_name": "ಕನ್ನಡ", "script": "Kannada"},
    "ml": {"code": "ml", "name": "Malayalam", "native_name": "മലയാളം", "script": "Malayalam"},
    "bn": {"code": "bn", "name": "Bengali", "native_name": "বাংলা", "script": "Bengali"},
    "gu": {"code": "gu", "name": "Gujarati", "native_name": "ગુજરાતી", "script": "Gujarati"},
    "pa": {"code": "pa", "name": "Punjabi", "native_name": "ਪੰਜਾਬੀ", "script": "Gurmukhi"},
    "or": {"code": "or", "name": "Odia", "native_name": "ଓଡ଼ିଆ", "script": "Oriya"},
}


class BhashiniService:
    """
    Dedicated Backend Service for BHASHINI Voice and Multilingual Pipeline.
    Never exposes API keys or credentials to the browser or frontend.
    """

    def __init__(self):
        self._config_cache: Optional[Dict[str, Any]] = None
        self._config_cached_at: float = 0.0
        self._inference_auth_header: Optional[Dict[str, str]] = None
        self._inference_callback_url: str = settings.BHASHINI_DEFAULT_INFERENCE_URL
        self._asr_service_map: Dict[str, str] = {}
        self._translation_service_map: Dict[Tuple[str, str], str] = {}
        self._tts_service_map: Dict[str, str] = {}
        self._discovered_languages: List[str] = list(BHASHINI_SUPPORTED_LANGUAGES.keys())

    def is_configured(self) -> bool:
        """Returns True if BHASHINI credentials are provided."""
        return bool(
            settings.BHASHINI_API_KEY
            and settings.BHASHINI_USER_ID
            and len(settings.BHASHINI_API_KEY.strip()) > 5
        )

    async def get_pipeline_config(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Retrieves BHASHINI Pipeline Configuration via MeitY/ULCA pipeline API.
        Caches the configuration in memory according to BHASHINI_CACHE_TTL_SECONDS.
        """
        now = time.time()
        if (
            not force_refresh
            and self._config_cache is not None
            and (now - self._config_cached_at) < settings.BHASHINI_CACHE_TTL_SECONDS
        ):
            return self._config_cache

        if not self.is_configured():
            logger.info("[BhashiniService] BHASHINI credentials not configured. Operating in mock/fallback mode.")
            return {
                "configured": False,
                "languages": list(BHASHINI_SUPPORTED_LANGUAGES.keys()),
                "status": "unconfigured",
            }

        headers = {
            "userID": settings.BHASHINI_USER_ID,
            "ulcaApiKey": settings.BHASHINI_API_KEY,
            "Content-Type": "application/json",
        }

        # Build pipeline discovery payload with proper sequence (hi -> en -> en)
        payload: Dict[str, Any] = {
            "pipelineTasks": [
                {"taskType": "asr", "config": {"language": {"sourceLanguage": "hi"}}},
                {"taskType": "translation", "config": {"language": {"sourceLanguage": "hi", "targetLanguage": "en"}}},
                {"taskType": "tts", "config": {"language": {"sourceLanguage": "en"}}},
            ]
        }
        if settings.BHASHINI_PIPELINE_ID:
            payload["pipelineRequestConfig"] = {"pipelineId": settings.BHASHINI_PIPELINE_ID}

        try:
            async with httpx.AsyncClient(timeout=settings.BHASHINI_TIMEOUT_SECONDS) as client:
                resp = await client.post(settings.BHASHINI_PIPELINE_URL, headers=headers, json=payload)
                if resp.status_code != 200:
                    logger.warning(f"[BhashiniService] Pipeline config fetch failed: HTTP {resp.status_code} - {resp.text}")
                    return {
                        "configured": False,
                        "status": f"http_error_{resp.status_code}",
                        "languages": list(BHASHINI_SUPPORTED_LANGUAGES.keys()),
                    }

                data = resp.json()
                self._parse_pipeline_response(data)
                self._config_cache = data
                self._config_cached_at = now
                logger.info(f"[BhashiniService] Pipeline config loaded successfully with {len(self._discovered_languages)} supported languages.")
                return data
        except Exception as e:
            logger.warning(f"[BhashiniService] Error contacting BHASHINI pipeline API: {e}")
            return {
                "configured": False,
                "status": "connection_error",
                "error": str(e),
                "languages": list(BHASHINI_SUPPORTED_LANGUAGES.keys()),
            }

    def _parse_pipeline_response(self, data: Dict[str, Any]) -> None:
        """Parses service IDs, callback URL, and auth details from pipeline config."""
        pipeline_resp_config = data.get("pipelineResponseConfig", [])
        if pipeline_resp_config:
            cfg = pipeline_resp_config[0]
            if "inferenceApiKey" in cfg:
                key_info = cfg["inferenceApiKey"]
                name = key_info.get("name", "Authorization")
                val = key_info.get("value", settings.BHASHINI_INFERENCE_KEY)
                self._inference_auth_header = {name: val}
            if "callbackUrl" in cfg:
                self._inference_callback_url = cfg["callbackUrl"]

        tasks = data.get("pipelineResponseConfig", [])
        for task in data.get("languages", []):
            code = task.get("sourceLanguage")
            if code and code not in self._discovered_languages and code in BHASHINI_SUPPORTED_LANGUAGES:
                self._discovered_languages.append(code)

        # Parse task configs if present
        for task in data.get("pipelineConfig", []):
            task_type = task.get("taskType")
            for cfg in task.get("config", []):
                svc_id = cfg.get("serviceId")
                lang = cfg.get("language", {})
                src = lang.get("sourceLanguage")
                tgt = lang.get("targetLanguage")
                if task_type == "asr" and src and svc_id:
                    self._asr_service_map[src] = svc_id
                elif task_type == "translation" and src and tgt and svc_id:
                    self._translation_service_map[(src, tgt)] = svc_id
                elif task_type == "tts" and src and svc_id:
                    self._tts_service_map[src] = svc_id

    async def speech_to_text(
        self,
        audio_bytes: bytes,
        source_language: Optional[str] = None,
        audio_format: str = "wav",
        sampling_rate: int = 16000,
    ) -> Dict[str, Any]:
        """
        Transcribes speech audio into text using BHASHINI ASR.
        """
        if not audio_bytes or len(audio_bytes) < 100:
            raise ValueError("Audio data is empty or too short for transcription.")

        lang = (source_language or "hi").lower().strip()
        if lang not in BHASHINI_SUPPORTED_LANGUAGES:
            lang = "hi"

        if not self.is_configured():
            logger.info(f"[BhashiniService] Simulating ASR transcription for language '{lang}' (BHASHINI unconfigured)")
            return {
                "text": "हवामान कसे आहे?",
                "language": lang,
                "confidence": None,
                "simulated": True,
            }

        await self.get_pipeline_config()
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        
        asr_config: Dict[str, Any] = {
            "language": {"sourceLanguage": lang},
            "audioFormat": audio_format,
            "samplingRate": sampling_rate,
        }
        if lang in self._asr_service_map:
            asr_config["serviceId"] = self._asr_service_map[lang]

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": asr_config,
                }
            ],
            "inputData": {
                "audio": [{"audioContent": audio_b64}]
            },
        }

        headers = {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "User-Agent": "WeatherGPT-Bhashini/1.0",
        }
        if self._inference_auth_header:
            headers.update(self._inference_auth_header)
        elif settings.BHASHINI_INFERENCE_KEY:
            headers["Authorization"] = settings.BHASHINI_INFERENCE_KEY

        async with httpx.AsyncClient(timeout=settings.BHASHINI_TIMEOUT_SECONDS) as client:
            resp = await client.post(self._inference_callback_url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"[BhashiniService] ASR inference failed: HTTP {resp.status_code} - {resp.text}")
                raise RuntimeError(f"BHASHINI ASR error: {resp.status_code} {resp.text}")

            result = resp.json()
            pipeline_resp = result.get("pipelineResponse", [])
            if not pipeline_resp:
                raise RuntimeError("No ASR response returned by BHASHINI.")

            task_resp = pipeline_resp[0]
            output = task_resp.get("output") or []
            if not output:
                raise RuntimeError("Empty transcript returned by BHASHINI ASR.")

            first_out = output[0] if isinstance(output, list) and len(output) > 0 else {}
            transcript = (first_out.get("source") or first_out.get("target") or first_out.get("text") or "").strip()
            if not transcript:
                raise RuntimeError("Empty transcript returned by BHASHINI ASR.")

            config_obj = task_resp.get("config") or {}
            lang_obj = config_obj.get("language") or {} if isinstance(config_obj, dict) else {}
            detected_lang = lang_obj.get("sourceLanguage", lang) if isinstance(lang_obj, dict) else lang
            return {
                "text": transcript,
                "language": detected_lang,
                "confidence": None,
                "simulated": False,
            }

    async def translate_text(
        self,
        text: str,
        source_language: str,
        target_language: str,
    ) -> Dict[str, Any]:
        """
        Translates text from sourceLanguage to targetLanguage via BHASHINI NMT.
        """
        src = (source_language or "en").lower().strip()
        tgt = (target_language or "en").lower().strip()

        if not text or not text.strip() or src == tgt:
            return {
                "translated_text": text,
                "source_language": src,
                "target_language": tgt,
            }

        if not self.is_configured():
            logger.debug(f"[BhashiniService] BHASHINI unconfigured; returning original text without translation ({src} -> {tgt})")
            return {
                "translated_text": text,
                "source_language": src,
                "target_language": tgt,
                "fallback": True,
            }

        await self.get_pipeline_config()
        
        task_config: Dict[str, Any] = {
            "language": {
                "sourceLanguage": src,
                "targetLanguage": tgt,
            }
        }
        if (src, tgt) in self._translation_service_map:
            task_config["serviceId"] = self._translation_service_map[(src, tgt)]

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": task_config,
                }
            ],
            "inputData": {
                "input": [{"source": text}]
            },
        }

        headers = {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "User-Agent": "WeatherGPT-Bhashini/1.0",
        }
        if self._inference_auth_header:
            headers.update(self._inference_auth_header)
        elif settings.BHASHINI_INFERENCE_KEY:
            headers["Authorization"] = settings.BHASHINI_INFERENCE_KEY

        try:
            async with httpx.AsyncClient(timeout=settings.BHASHINI_TIMEOUT_SECONDS) as client:
                resp = await client.post(self._inference_callback_url, headers=headers, json=payload)
                if resp.status_code != 200:
                    logger.warning(f"[BhashiniService] Translation HTTP {resp.status_code}: {resp.text}")
                    return {
                        "translated_text": text,
                        "source_language": src,
                        "target_language": tgt,
                        "fallback": True,
                    }

                result = resp.json()
                pipeline_resp = result.get("pipelineResponse", [])
                if not pipeline_resp:
                    return {"translated_text": text, "source_language": src, "target_language": tgt, "fallback": True}

                output = pipeline_resp[0].get("output", [])
                if not output or "target" not in output[0]:
                    return {"translated_text": text, "source_language": src, "target_language": tgt, "fallback": True}

                translated_text = output[0]["target"].strip()
                return {
                    "translated_text": translated_text,
                    "source_language": src,
                    "target_language": tgt,
                    "fallback": False,
                }
        except Exception as e:
            logger.warning(f"[BhashiniService] Translation failed: {e}. Falling back to original text.")
            return {
                "translated_text": text,
                "source_language": src,
                "target_language": tgt,
                "fallback": True,
            }

    async def text_to_speech(
        self,
        text: str,
        language: str,
        gender: str = "female",
    ) -> Dict[str, Any]:
        """
        Synthesizes speech audio from text using BHASHINI TTS.
        """
        lang = (language or "en").lower().strip()
        if not text or not text.strip():
            raise ValueError("Text cannot be empty for speech synthesis.")

        if not self.is_configured():
            logger.info(f"[BhashiniService] TTS requested but BHASHINI unconfigured for language '{lang}'.")
            return {
                "audio_content": "",
                "audio_format": "wav",
                "language": lang,
                "gender": gender,
                "unconfigured": True,
            }

        await self.get_pipeline_config()
        
        tts_config: Dict[str, Any] = {
            "language": {"sourceLanguage": lang},
            "gender": gender.lower(),
        }
        if lang in self._tts_service_map:
            tts_config["serviceId"] = self._tts_service_map[lang]

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": tts_config,
                }
            ],
            "inputData": {
                "input": [{"source": text}]
            },
        }

        headers = {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "User-Agent": "WeatherGPT-Bhashini/1.0",
        }
        if self._inference_auth_header:
            headers.update(self._inference_auth_header)
        elif settings.BHASHINI_INFERENCE_KEY:
            headers["Authorization"] = settings.BHASHINI_INFERENCE_KEY

        async with httpx.AsyncClient(timeout=settings.BHASHINI_TIMEOUT_SECONDS) as client:
            resp = await client.post(self._inference_callback_url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"[BhashiniService] TTS inference failed: HTTP {resp.status_code} - {resp.text}")
                raise RuntimeError(f"BHASHINI TTS error: {resp.status_code} {resp.text}")

            result = resp.json()
            pipeline_resp = result.get("pipelineResponse", [])
            if not pipeline_resp:
                raise RuntimeError("No TTS audio returned by BHASHINI.")

            audio_data = pipeline_resp[0].get("audio", [])
            if not audio_data or "audioContent" not in audio_data[0]:
                raise RuntimeError("Empty audio stream returned by BHASHINI TTS.")

            audio_b64 = audio_data[0]["audioContent"]
            return {
                "audio_content": audio_b64,
                "audio_format": "wav",
                "language": lang,
                "gender": gender,
                "unconfigured": False,
            }

    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Fast and accurate script and Unicode heuristic language detector for Indian languages.
        """
        if not text or not text.strip():
            return {"language": "en", "script": "Latin", "confidence": 1.0}

        script_counts: Dict[str, int] = {}
        for ch in text:
            code_pt = ord(ch)
            if 0x0900 <= code_pt <= 0x097F:
                script_counts["Devanagari"] = script_counts.get("Devanagari", 0) + 1
            elif 0x0B80 <= code_pt <= 0x0BFF:
                script_counts["Tamil"] = script_counts.get("Tamil", 0) + 1
            elif 0x0C00 <= code_pt <= 0x0C7F:
                script_counts["Telugu"] = script_counts.get("Telugu", 0) + 1
            elif 0x0C80 <= code_pt <= 0x0CFF:
                script_counts["Kannada"] = script_counts.get("Kannada", 0) + 1
            elif 0x0D00 <= code_pt <= 0x0D7F:
                script_counts["Malayalam"] = script_counts.get("Malayalam", 0) + 1
            elif 0x0980 <= code_pt <= 0x09FF:
                script_counts["Bengali"] = script_counts.get("Bengali", 0) + 1
            elif 0x0A80 <= code_pt <= 0x0AFF:
                script_counts["Gujarati"] = script_counts.get("Gujarati", 0) + 1
            elif 0x0A00 <= code_pt <= 0x0A7F:
                script_counts["Gurmukhi"] = script_counts.get("Gurmukhi", 0) + 1
            elif 0x0B00 <= code_pt <= 0x0B7F:
                script_counts["Oriya"] = script_counts.get("Oriya", 0) + 1

        if not script_counts:
            return {"language": "en", "script": "Latin", "confidence": 0.99}

        dominant_script = max(script_counts, key=script_counts.get)
        
        # Disambiguate Devanagari (Marathi vs Hindi)
        if dominant_script == "Devanagari":
            # Marathi distinctive vocabulary and grammatical markers
            marathi_markers = ["आहे", "का", "नाही", "पडेल", "उद्या", "आज", "पुण्यात", "कसे", "आहेत", "होईल", "करणार", "पाऊस"]
            is_marathi = any(m in text for m in marathi_markers)
            lang = "mr" if is_marathi else "hi"
            return {"language": lang, "script": "Devanagari", "confidence": 0.95}

        script_to_lang = {
            "Tamil": "ta",
            "Telugu": "te",
            "Kannada": "kn",
            "Malayalam": "ml",
            "Bengali": "bn",
            "Gujarati": "gu",
            "Gurmukhi": "pa",
            "Oriya": "or",
        }
        lang = script_to_lang.get(dominant_script, "en")
        return {"language": lang, "script": dominant_script, "confidence": 0.95}

    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Returns list of ISO language details supported by the system."""
        return [
            BHASHINI_SUPPORTED_LANGUAGES[code]
            for code in self._discovered_languages
            if code in BHASHINI_SUPPORTED_LANGUAGES
        ]

    async def health_check(self) -> Dict[str, Any]:
        """Returns health status of the BHASHINI integration."""
        if not self.is_configured():
            return {
                "provider": "bhashini",
                "status": "unconfigured",
                "message": "BHASHINI credentials not present. Operating with fallback text/speech support.",
                "supportedLanguages": self.get_supported_languages(),
            }

        try:
            cfg = await self.get_pipeline_config()
            status = "healthy" if cfg.get("configured") is not False else "degraded"
            return {
                "provider": "bhashini",
                "status": status,
                "supportedLanguages": self.get_supported_languages(),
            }
        except Exception as e:
            return {
                "provider": "bhashini",
                "status": "degraded",
                "error": str(e),
                "supportedLanguages": self.get_supported_languages(),
            }


bhashini_service = BhashiniService()
