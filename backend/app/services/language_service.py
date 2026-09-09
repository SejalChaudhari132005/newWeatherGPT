"""
LanguageService for WeatherGPT.
Coordinates multilingual text normalization, language detection, response translation,
and weather meteorological domain terminology preservation across Indian languages.
"""

import re
from typing import Dict, Any, Optional, List, Tuple
from backend.app.services.bhashini_service import (
    bhashini_service,
    BHASHINI_SUPPORTED_LANGUAGES,
)
from backend.app.core.logging import logger

# Map of common names / variations to standard ISO-639-1 code
LANGUAGE_NAME_TO_CODE: Dict[str, str] = {
    "english": "en",
    "en": "en",
    "hindi": "hi",
    "hi": "hi",
    "marathi": "mr",
    "mr": "mr",
    "tamil": "ta",
    "ta": "ta",
    "telugu": "te",
    "te": "te",
    "kannada": "kn",
    "kn": "kn",
    "malayalam": "ml",
    "ml": "ml",
    "bengali": "bn",
    "bn": "bn",
    "bangla": "bn",
    "gujarati": "gu",
    "gu": "gu",
    "punjabi": "pa",
    "pa": "pa",
    "odia": "or",
    "oriya": "or",
    "or": "or",
}

# Weather Domain Terminology Dictionary for Indian Languages
INDIAN_WEATHER_GLOSSARY: Dict[str, Dict[str, str]] = {
    "mr": {
        "temperature": "तापमान",
        "humidity": "आर्द्रता",
        "wind": "वारा",
        "wind speed": "वाऱ्याचा वेग",
        "visibility": "दृश्यता",
        "rain": "पाऊस",
        "rainfall": "पाऊस",
        "rain probability": "पावसाची शक्यता",
        "thunderstorm": "वादळी पाऊस",
        "cyclone": "चक्रीवादळ",
        "heatwave": "उष्णतेची लाट",
        "warning": "इशारा",
        "advisory": "सल्ला",
        "forecast": "हवामान अंदाज",
        "umbrella": "छत्री",
    },
    "hi": {
        "temperature": "तापमान",
        "humidity": "नमी / आर्द्रता",
        "wind": "हवा",
        "wind speed": "हवा की गति",
        "visibility": "दृश्यता",
        "rain": "बारिश",
        "rainfall": "वर्षा",
        "rain probability": "बारिश की संभावना",
        "thunderstorm": "आंधी-तूफान",
        "cyclone": "चक्रवात",
        "heatwave": "लू / भीषण गर्मी",
        "warning": "चेतावनी",
        "advisory": "सलाह",
        "forecast": "मौसम का पूर्वानुमान",
        "umbrella": "छाता",
    },
    "ta": {
        "temperature": "வெப்பநிலை",
        "humidity": "ஈரப்பதம்",
        "wind": "காற்று",
        "visibility": "பார்வைத்திறன்",
        "rain": "மழை",
        "rain probability": "மழை வாய்ப்பு",
        "warning": "எச்சரிக்கை",
        "forecast": "வானிலை முன்னறிவிப்பு",
    },
    "te": {
        "temperature": "ఉష్ణోగ్రత",
        "humidity": "తేమ",
        "wind": "గాలి",
        "visibility": "దృశ్యమానత",
        "rain": "వర్షం",
        "rain probability": "వర్ష సూచన",
        "warning": "హెచ్చరిక",
        "forecast": "వాతావరణ సూచన",
    },
    "kn": {
        "temperature": "ತಾಪಮಾನ",
        "humidity": "ಆರ್ದ್ರತೆ",
        "wind": "ಗಾಳಿ",
        "visibility": "ಗೋಚರತೆ",
        "rain": "ಮಳೆ",
        "rain probability": "ಮಳೆಯ ಸಾಧ್ಯತೆ",
        "warning": "ಎಚ್ಚರಿಕೆ",
        "forecast": "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
    },
    "ml": {
        "temperature": "താപനില",
        "humidity": "ഈർപ്പം",
        "wind": "കാറ്റ്",
        "visibility": "കാഴ്ചാപരിധി",
        "rain": "മഴ",
        "rain probability": "മഴ സാധ്യത",
        "warning": "മുന്നറിയിപ്പ്",
        "forecast": "കാലാവസ്ഥാ പ്രവചനം",
    },
    "bn": {
        "temperature": "তাপমাত্রা",
        "humidity": "আর্দ্রতা",
        "wind": "বাতাস",
        "visibility": "দৃশ্যমানতা",
        "rain": "বৃষ্টি",
        "rain probability": "বৃষ্টির সম্ভাবনা",
        "warning": "সতর্কবার্তা",
        "forecast": "আবহাওয়ার পূর্বাভাস",
    },
    "gu": {
        "temperature": "તાપમાન",
        "humidity": "ભેજ",
        "wind": "પવન",
        "visibility": "દ્રશ્યતા",
        "rain": "વરસાદ",
        "rain probability": "વરસાદની શક્યતા",
        "warning": "ચેતવણી",
        "forecast": "હવામાન આગાહી",
    },
    "pa": {
        "temperature": "ਤਾਪਮਾਨ",
        "humidity": "ਨਮੀ",
        "wind": "ਹਵਾ",
        "visibility": "ਦਿੱਖ",
        "rain": "ਮੀਂਹ",
        "rain probability": "ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ",
        "warning": "ਚੇਤਾਵਨੀ",
        "forecast": "ਮੌਸਮ ਦੀ ਭਵਿੱਖਬਾਣੀ",
    },
    "or": {
        "temperature": "ତାପମାତ୍ରା",
        "humidity": "ଆର୍ଦ୍ରତା",
        "wind": "ପବନ",
        "visibility": "ଦୃଶ୍ୟମାନତା",
        "rain": "ବର୍ଷା",
        "rain probability": "ବର୍ଷା ସମ୍ଭାବନା",
        "warning": "ଚେତାବନୀ",
        "forecast": "ପାଣିପାଗ ପୂର୍ବାନୁମାନ",
    },
}


class LanguageService:
    """
    Unified Language Service for WeatherGPT.
    Normalizes inputs to English for LLM reasoning and translates outputs to user language.
    """

    def to_iso_code(self, language_name_or_code: Optional[str]) -> str:
        """Converts language name or alias to canonical 2-letter ISO code."""
        if not language_name_or_code:
            return "en"
        cleaned = language_name_or_code.lower().strip()
        return LANGUAGE_NAME_TO_CODE.get(cleaned, "en")

    def detect_language(self, text: str) -> Dict[str, Any]:
        """Detects the language of given text."""
        return bhashini_service.detect_language(text)

    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Returns list of all supported languages."""
        return bhashini_service.get_supported_languages()

    async def normalize_query(
        self,
        query: str,
        preferred_language: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Detects query language and translates it into English if needed for LLM reasoning.
        Returns tuple of (normalized_english_query, detected_or_source_language_code).
        """
        if not query or not query.strip():
            return query, "en"

        detect_res = self.detect_language(query)
        detected_lang = detect_res["language"]

        # If user explicitly preferred a non-English language, respect it
        effective_lang = self.to_iso_code(preferred_language) if preferred_language else detected_lang
        if detected_lang != "en":
            effective_lang = detected_lang

        if effective_lang == "en":
            return query, "en"

        # Translate Indic query to English for WeatherGPT intent and weather reasoning
        try:
            trans_res = await bhashini_service.translate_text(
                text=query,
                source_language=effective_lang,
                target_language="en",
            )
            english_query = trans_res.get("translated_text", query)
            logger.info(f"[LanguageService] Query normalized: '{query}' ({effective_lang}) -> '{english_query}' (en)")
            return english_query, effective_lang
        except Exception as e:
            logger.warning(f"[LanguageService] Query normalization error: {e}. Using original query.")
            return query, effective_lang

    async def translate_response(
        self,
        english_text: str,
        target_language: str,
        structured_context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Translates verified WeatherGPT English response into the target Indian language.
        Preserves critical meteorological values, temperatures, IMD warning enums, and timestamps.
        """
        tgt = self.to_iso_code(target_language)
        if tgt == "en" or not english_text or not english_text.strip():
            return english_text

        # Protect critical tokens from mistranslation using placeholders
        protected_tokens: List[str] = []
        token_counter = 0

        def protect(match_text: str) -> str:
            nonlocal token_counter
            placeholder = f"[[{token_counter}]]"
            protected_tokens.append(match_text)
            token_counter += 1
            return placeholder

        # Protect temperature numbers with degree signs (e.g. 28°C, 31.5 °C)
        temp_pattern = r"\b\d+(\.\d+)?\s*°[CF]\b"
        prepared_text = re.sub(temp_pattern, lambda m: protect(m.group(0)), english_text)

        # Protect percentage numbers (e.g. 76%, 20 %)
        pct_pattern = r"\b\d+(\.\d+)?\s*%"
        prepared_text = re.sub(pct_pattern, lambda m: protect(m.group(0)), prepared_text)

        # Protect wind speed & pressure units (e.g. 14 km/h, 1012 hPa)
        unit_pattern = r"\b\d+(\.\d+)?\s*(km/h|m/s|mph|hPa|mm|hpa)\b"
        prepared_text = re.sub(unit_pattern, lambda m: protect(m.group(0)), prepared_text, flags=re.IGNORECASE)

        # Perform translation via BHASHINI NMT
        try:
            trans_res = await bhashini_service.translate_text(
                text=prepared_text,
                source_language="en",
                target_language=tgt,
            )
            translated = trans_res.get("translated_text", english_text)

            # Restore protected tokens with resilient regex for brackets and transliterations
            def restore_token(match: re.Match) -> str:
                # Find the matched digit index
                digits = re.findall(r"\d+", match.group(0))
                if digits:
                    idx = int(digits[0])
                    if idx < len(protected_tokens):
                        return protected_tokens[idx]
                return match.group(0)

            restore_pattern = r"(\[\[\s*\d+\s*\]\]|\[\s*\d+\s*\]|__?\s*(?:WG|डब्ल्यूजी)?_?\s*(?:PROTECT|प्रोटेक्ट)?_?\s*\d+\s*__?)"
            translated = re.sub(restore_pattern, restore_token, translated, flags=re.IGNORECASE)

            # Direct fallback for simple exact matches
            for i, val in enumerate(protected_tokens):
                translated = translated.replace(f"[[{i}]]", val)
                translated = translated.replace(f"[{i}]", val)

            logger.info(f"[LanguageService] Response translated to '{tgt}' successfully.")
            return translated
        except Exception as e:
            logger.warning(f"[LanguageService] Response translation error: {e}. Returning English response.")
            return english_text


language_service = LanguageService()
