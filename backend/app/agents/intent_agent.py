import re
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from backend.app.agents.base_agent import BaseAgent
from backend.app.core.logging import logger

class IntentResult(BaseModel):
    intent: str = Field(..., description="Classified intent from approved enum set")
    time_range: str = Field("current", description="Identified time horizon: current, today, tonight, tomorrow, evening, weekend, week")
    location_query: Optional[str] = Field(None, description="Explicit city or place mentioned in query, if any")
    origin_query: Optional[str] = Field(None, description="Route origin if travel query")
    destination_query: Optional[str] = Field(None, description="Route destination if travel query")
    is_relative_location: bool = Field(False, description="True if query mentions 'here', 'there', 'near me', etc.")
    is_follow_up: bool = Field(False, description="True if query is a short follow-up needing previous context")
    requires_weather_data: bool = Field(True, description="Whether numerical weather telemetry is required")
    requires_alert_data: bool = Field(False, description="Whether IMD alert intelligence is explicitly queried")

class IntentAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "IntentAgent"

    @property
    def description(self) -> str:
        return "Deterministic and rule-based classifier identifying meteorological intents, time ranges, and location entities."

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        result = self.classify(query, context)
        return result.model_dump()

    def classify(self, query: str, context: Optional[Dict[str, Any]] = None) -> IntentResult:
        q_raw = query.strip()
        q = q_raw.lower()
        q_clean = re.sub(r"[^\w\s]", " ", q_raw)

        # 1. Location Entity & Route Extraction
        location_query = None
        origin_query = None
        destination_query = None
        is_relative = False

        # Route matching: "from <CityA> to <CityB>", "travelling from <CityA> to <CityB>"
        route_match = re.search(r"\b(?:travelling|traveling|driving|going|route|trip)?\s*from\s+([A-Za-z\s]+?)\s+to\s+([A-Za-z\s]+?)(?:\s+(?:today|tomorrow|tonight|right now|this evening|this weekend|now)|$)", q_clean, re.IGNORECASE)
        if route_match:
            cand_origin = route_match.group(1).strip()
            cand_dest = route_match.group(2).strip()
            if len(cand_origin.split()) <= 3 and len(cand_dest.split()) <= 3:
                origin_query = cand_origin
                destination_query = cand_dest
                location_query = destination_query

        # Check for relative location phrases
        if any(rel in q for rel in ["here", "near me", "my location", "my city", "around me", "this place"]):
            is_relative = True

        # Non-location stopwords that should never be extracted as cities
        non_locations = {
            "a walk", "walk", "walking", "jog", "jogging", "picnic", "dinner", "lunch",
            "the weekend", "weekend", "this weekend", "the week", "week", "this week",
            "tomorrow", "tonight", "today", "the morning", "the evening", "the afternoon",
            "evening", "morning", "afternoon", "my area", "here", "there", "india",
            "me", "a", "an", "the", "travel", "drive", "work", "school", "outside",
            "an umbrella", "umbrella", "raincoat", "weather", "forecast"
        }

        # 1) "in <City>", "at <City>", "near <City>"
        if not location_query:
            loc_match = re.search(r"\b(?:in|at|near)\s+([A-Za-z\s]+?)(?:\s+(?:today|tomorrow|tonight|right now|this evening|this weekend|now)|$)", q_clean, re.IGNORECASE)
            if loc_match:
                candidate = loc_match.group(1).strip()
                if candidate.lower() not in non_locations and len(candidate.split()) <= 3:
                    location_query = candidate

        # 2) "weather for <City>", "forecast for <City>"
        if not location_query:
            for_match = re.search(r"\b(?:weather|forecast|temp|temperature|rain|alerts?|report)\s+for\s+([A-Za-z\s]+?)(?:\s+(?:today|tomorrow|tonight|right now|this evening|this weekend|now)|$)", q_clean, re.IGNORECASE)
            if for_match:
                candidate = for_match.group(1).strip()
                if candidate.lower() not in non_locations and len(candidate.split()) <= 3:
                    location_query = candidate

        # 3) "travel to <City>", "go to <City>", "trip to <City>", "drive to <City>", "to <City>"
        if not location_query:
            travel_match = re.search(r"\b(?:travel to|go to|trip to|drive to|fly to|visit|to)\s+([A-Za-z\s]+?)(?:\s+(?:today|tomorrow|tonight|right now|this evening|this weekend|now)|$)", q_clean, re.IGNORECASE)
            if travel_match:
                candidate = travel_match.group(1).strip()
                if candidate.lower() not in non_locations and len(candidate.split()) <= 3:
                    location_query = candidate
                    destination_query = candidate

        # 4) Check for direct queries like "What about Pune?" or "Pune weather"
        if not location_query:
            pune_nashik_match = re.search(r"\b(?:what about|how about|check)\s+([A-Za-z\s]+?)(?:\s+(?:tomorrow|tonight|today)|$)", q_clean, re.IGNORECASE)
            if pune_nashik_match:
                candidate = pune_nashik_match.group(1).strip()
                if candidate.lower() not in non_locations and len(candidate.split()) <= 3:
                    location_query = candidate

        if "there" in q:
            is_relative = True

        # 2. Time Range Detection
        time_range = "current"
        if "tomorrow morning" in q:
            time_range = "tomorrow_morning"
        elif "tomorrow evening" in q or "tomorrow night" in q:
            time_range = "tomorrow_evening"
        elif "tomorrow" in q or "उद्या" in q or "कल" in q:
            time_range = "tomorrow"
        elif "tonight" in q or "आज रात" in q or "आज रात्री" in q:
            time_range = "tonight"
        elif "this evening" in q or "evening" in q or "संध्याकाळी" in q or "शाम" in q or "at 6" in q or "at 7" in q or "at 8" in q:
            time_range = "evening"
        elif "this weekend" in q or "weekend" in q:
            time_range = "weekend"
        elif "next monday" in q or "next week" in q or "this week" in q or "week" in q or "7 day" in q or "weekly" in q:
            time_range = "week"
        elif "in 2 hours" in q or "in 3 hours" in q or "next 3 hours" in q or "next 2 hours" in q or "hourly" in q:
            time_range = "hourly"
        elif "later today" in q or "afternoon" in q or "morning" in q or "today" in q or "आज" in q:
            time_range = "today"

        # 3. Follow-Up Detection
        is_follow_up = False
        chat_history = context.get("chat_history", []) if context else []
        words = q_clean.split()
        if len(words) <= 6 and (
            q.startswith("what about") or
            q.startswith("how about") or
            q.startswith("and ") or
            "evening" in q or "tomorrow" in q or "tonight" in q or "there" in q or "then" in q
        ):
            if chat_history or "what about" in q or "there" in q:
                is_follow_up = True
                # If prior conversation was discussing "tomorrow", resolve "evening" to "tomorrow_evening"
                past_text = " ".join([m.get("content", "").lower() for m in chat_history[-3:]])
                if "tomorrow" in past_text:
                    if time_range == "evening":
                        time_range = "tomorrow_evening"
                    elif time_range == "morning":
                        time_range = "tomorrow_morning"

        # 4. Intent Classification
        intent = "GENERAL_WEATHER"
        requires_alert = False

        if any(w in q for w in ["compare", "safest time", "best time to leave", "leave at 6", "leave at 9"]):
            intent = "DEPARTURE_TIME_COMPARISON"
            requires_alert = True
        elif origin_query and destination_query:
            intent = "ROUTE_WEATHER_ANALYSIS"
            requires_alert = True
        elif any(w in q for w in ["route", "highway", "way to", "on my way", "travelling to", "travel to", "drive to"]):
            intent = "ROUTE_WEATHER_ANALYSIS"
            requires_alert = True
        elif any(w in q for w in ["translate to marathi", "in marathi", "मराठीत"]):
            intent = "TRANSLATION"
        elif any(w in q for w in ["severe", "cyclone warning", "tornado", "catastrophe", "emergency weather"]):
            intent = "SEVERE_WEATHER"
            requires_alert = True
        elif any(w in q for w in ["warning", "alert", "danger", "cyclone", "flood warning", "thunderstorm alert", "imd alert", "इशारा", "चेतावणी"]):
            intent = "WEATHER_ALERT"
            requires_alert = True
        elif any(w in q for w in ["umbrella", "raincoat"]):
            intent = "WEATHER_ADVISORY"
        elif any(w in q for w in ["air quality", "aqi", "pollution", "pm2.5", "pm10", "smog"]):
            intent = "AIR_QUALITY"
        elif any(w in q for w in ["rain", "shower", "downpour", "precipitation", "drizzle", "monsoon", "पाऊस", "बारिश"]):
            if time_range in ["tomorrow", "tomorrow_morning", "tomorrow_evening", "weekend", "week", "tonight"]:
                intent = "RAIN_FORECAST"
            else:
                intent = "RAIN_QUERY"
        elif any(w in q for w in ["hot", "cold", "temperature", "temp", "degrees", "celsius", "heat", "heatwave", "warm", "तापमान", "थंडी", "गरमी"]):
            intent = "TEMPERATURE"
        elif any(w in q for w in ["travel", "drive", "safe to drive", "safe to go", "traffic weather", "road condition", "trip", "flight", "fly", "fishing", "lonavala", "go to"]):
            intent = "TRAVEL_WEATHER"
            requires_alert = True
        elif any(w in q for w in ["outside", "wear", "walk", "jog", "play", "cricket", "picnic", "go outside"]):
            intent = "OUTDOOR_ACTIVITY"
        elif any(w in q for w in ["wind", "storm", "gust", "breeze", "वारा"]):
            intent = "WIND"
        elif any(w in q for w in ["climate", "global warming", "trend"]):
            intent = "CLIMATE_QUERY"
        elif any(w in q for w in ["historical", "yesterday", "last year", "past"]):
            intent = "HISTORICAL_WEATHER"
        elif any(w in q for w in ["weather in", "weather at", "weather for"]) and location_query:
            intent = "LOCATION_WEATHER"
        elif any(w in q for w in ["humidity", "sweat", "sticky", "muggy", "आर्द्रता", "दमट"]):
            intent = "HUMIDITY"
        elif any(w in q for w in ["uv", "sunburn", "sunscreen", "uv index"]):
            intent = "UV"
        elif any(w in q for w in ["visibility", "fog", "haze", "mist", "धुके"]):
            intent = "VISIBILITY"
        elif any(w in q for w in ["risk", "safety"]):
            intent = "WEATHER_RISK"
            requires_alert = True
        elif time_range in ["hourly"]:
            intent = "HOURLY_FORECAST"
        elif time_range in ["week", "weekend"]:
            intent = "DAILY_FORECAST"
        elif time_range in ["tomorrow", "tomorrow_evening", "tomorrow_morning"]:
            intent = "FORECAST"
        elif any(w in q for w in ["now", "current", "right now", "outside", "today", "what is the weather", "हवामान"]):
            intent = "CURRENT_WEATHER"
        elif is_follow_up:
            intent = "FOLLOW_UP"

        return IntentResult(
            intent=intent,
            time_range=time_range,
            location_query=location_query,
            origin_query=origin_query,
            destination_query=destination_query,
            is_relative_location=is_relative,
            is_follow_up=is_follow_up,
            requires_weather_data=True,
            requires_alert_data=requires_alert or ("alert" in q or "warning" in q),
        )

intent_agent = IntentAgent()
