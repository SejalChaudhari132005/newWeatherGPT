import time
from typing import Dict, Any, Optional, List
from backend.app.agents.base_agent import BaseAgent
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.services.weather_context_service import weather_context_service
from backend.app.services.response_validator import response_validator
from backend.app.llm.provider import get_llm_provider
from backend.app.core.logging import logger

SYSTEM_PROMPT = """You are WeatherGPT, an AI weather intelligence assistant.

Your purpose is to answer users' weather questions using verified meteorological data supplied by the WeatherGPT backend.

IMPORTANT RULES:

1. Use ONLY the weather context provided by the backend.

2. Never invent temperature, rainfall, wind, humidity, forecast, warning or location information.

3. Never pretend that an unsupported value is real.

4. If required weather information is missing, clearly say that the information is unavailable.

5. Never fabricate an IMD warning.

6. Official warnings supplied by the backend must be treated as authoritative information.

7. Clearly distinguish:
   - observed/current weather
   - forecast
   - official warning
   - AI-generated recommendation

8. Give practical and understandable answers.

9. Use the user's location when relevant.

10. Respect the user's selected language. If the user asks in Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Odia or any other language, respond in that language while using verified numbers from the context.

11. Maintain conversational context.

12. Do not unnecessarily repeat all weather parameters.

13. Answer the actual question first.

14. Do not claim certainty when the forecast is uncertain.

15. Never say that the user is "completely safe".

16. During severe weather, advise users to follow official government and local authority instructions."""


class WeatherChatAgent(BaseAgent):
    """
    WeatherChatAgent:
    - Interprets natural language weather queries in conversational ChatGPT style.
    - Uses verified meteorological context from WeatherFusionAgent / IMD / Open-Meteo.
    - Prompts Groq / LLM with anti-hallucination constraints and language preferences.
    - Validates generated responses to prevent any fabricated telemetry or alerts.
    - Falls back to deterministic verified data if the LLM provider fails or produces inconsistent output.
    """

    def __init__(self):
        pass

    @property
    def name(self) -> str:
        return "WeatherChatAgent"

    @property
    def description(self) -> str:
        return "Conversational weather AI engine grounded on verified IMD and Open-Meteo data."

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        BaseAgent execute implementation.
        Expects context to have:
          - intelligence: WeatherIntelligenceData (required for weather answers)
          - chat_history: List[Dict[str, str]]
          - user_role: str
          - time_range: str
          - language: Optional[str]
        """
        ctx = context or {}
        intelligence: Optional[WeatherIntelligenceData] = ctx.get("intelligence")
        chat_history = ctx.get("chat_history", [])
        user_role = ctx.get("user_role", "citizen")
        time_range = ctx.get("time_range", "current")
        language = ctx.get("language")

        if not intelligence:
            return {
                "content": "I couldn't retrieve the latest weather data right now. Please try again in a moment.",
                "valid": False,
                "sources": [],
                "validation": {"validation_passed": False, "issues": ["No weather intelligence provided."]},
            }

        return await self.generate_response(
            query=query,
            intelligence=intelligence,
            chat_history=chat_history,
            user_role=user_role,
            time_range=time_range,
            language=language
        )

    async def generate_response(
        self,
        query: str,
        intelligence: WeatherIntelligenceData,
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_role: str = "citizen",
        time_range: str = "current",
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates grounded conversational response using Groq / LLM provider.
        """
        t_start = time.perf_counter()

        # 1. Build compact verified meteorological context
        llm_context_str = weather_context_service.build_llm_context(
            intelligence=intelligence,
            user_role=user_role,
            time_range=time_range
        )

        lang_instruction = ""
        if language and language.lower() not in ["en", "english"]:
            lang_instruction = f"\nUSER PREFERRED LANGUAGE: {language}. Please reply naturally in {language} while keeping all verified numbers accurate."
        else:
            lang_instruction = "\nIf the user query is written in Hindi, Marathi, or another regional Indian language, please answer naturally in that same language while keeping all verified numbers accurate."

        style_instruction = (
            "\nSTYLE GUIDELINES:\n"
            "- Answer conversationally and directly like ChatGPT.\n"
            "- Answer the actual question first (e.g. if asked about rain or umbrella, answer that immediately).\n"
            "- Do NOT unnecessarily list all weather parameters (do not dump humidity, pressure, UV, wind, visibility unless asked or directly relevant).\n"
            "- For temperature queries, mention the current temperature and feels-like temperature naturally."
        )

        user_prompt = f"{llm_context_str}{lang_instruction}{style_instruction}\n\nUSER QUESTION: {query}"

        # 2. Query LLM Provider (Groq by default)
        llm_provider = get_llm_provider()
        llm_output = ""
        llm_failed = False

        try:
            llm_output = await llm_provider.generate(
                prompt=user_prompt,
                system_prompt=SYSTEM_PROMPT,
                chat_history=chat_history or [],
                temperature=0.2,
                max_tokens=800
            )
        except Exception as e:
            logger.error(f"[WeatherChatAgent] LLM generation error: {e}. Falling back to deterministic response.")
            llm_failed = True
            llm_output = response_validator._build_deterministic_fallback(intelligence, query)

        llm_latency_ms = (time.perf_counter() - t_start) * 1000.0

        # 3. Response Validation & Anti-Hallucination Guardrails
        is_valid, final_content, val_meta = response_validator.validate_and_sanitize(
            llm_output=llm_output,
            intelligence=intelligence,
            user_query=query
        )

        # 4. If invalid and not already in fallback mode, retry once with stricter context per Rule 23
        if not is_valid and not llm_failed:
            logger.warning(f"[WeatherChatAgent] Output failed validation: {val_meta.get('issues')}. Retrying once with stricter context.")
            try:
                strict_system_prompt = (
                    f"{SYSTEM_PROMPT}\n\n"
                    f"CRITICAL CORRECTION REQUIRED: Your previous reply contradicted verified meteorological context ({val_meta.get('issues')}). "
                    f"The verified temperature is {intelligence.current.temperature.value}°C. "
                    f"There are {len(intelligence.alerts)} active warnings. "
                    f"Answer accurately using ONLY these verified values."
                )
                retry_output = await llm_provider.generate(
                    prompt=user_prompt,
                    system_prompt=strict_system_prompt,
                    chat_history=chat_history or [],
                    temperature=0.0,
                    max_tokens=600
                )
                is_valid_retry, final_retry, val_meta_retry = response_validator.validate_and_sanitize(
                    llm_output=retry_output,
                    intelligence=intelligence,
                    user_query=query
                )
                if is_valid_retry:
                    logger.info("[WeatherChatAgent] Stricter retry successfully validated.")
                    final_content = final_retry
                    is_valid = True
                    val_meta = val_meta_retry
                else:
                    logger.warning("[WeatherChatAgent] Stricter retry also failed validation. Enforcing deterministic factual fallback.")
                    final_content = response_validator._build_deterministic_fallback(intelligence, query)
                    val_meta = {"validation_passed": False, "issues": val_meta.get("issues", []) + ["Retry also failed validation; used deterministic fallback."]}
            except Exception as retry_err:
                logger.error(f"[WeatherChatAgent] Retry generation error: {retry_err}. Using deterministic fallback.")
                final_content = response_validator._build_deterministic_fallback(intelligence, query)

        # Sources used
        sources = ["Open-Meteo"]
        if intelligence.alerts and len(intelligence.alerts) > 0:
            sources.append("India Meteorological Department (IMD)")

        return {
            "content": final_content,
            "raw_output": llm_output,
            "valid": is_valid,
            "llm_failed": llm_failed,
            "llm_latency_ms": round(llm_latency_ms, 1),
            "sources": sources,
            "validation": val_meta,
        }


weather_chat_agent = WeatherChatAgent()
