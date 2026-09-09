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
    # Multi-Role Extensions
    detected_role: Optional[str] = Field(None, description="Detected persona role if implied by query: farmer, fisherman, aviation, citizen")
    crop_query: Optional[str] = Field(None, description="Crop name mentioned in query (e.g. soybean, cotton, wheat, rice)")
    harbor_query: Optional[str] = Field(None, description="Harbor / Coastal port mentioned in query")
    icao_query: Optional[str] = Field(None, description="Aviation ICAO or airport code (e.g. VABB, VIDP, VOBL, BOM, DEL)")
    runway_query: Optional[str] = Field(None, description="Runway identifier mentioned in query (e.g. 27, 09, 28, 14)")

class IntentAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "IntentAgent"

    @property
    def description(self) -> str:
        return "Deterministic and rule-based classifier identifying meteorological intents, role-specific decisions, time horizons, and entities."

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        result = self.classify(query, context)
        return result.model_dump()

    def classify(self, query: str, context: Optional[Dict[str, Any]] = None) -> IntentResult:
        q_raw = query.strip()
        q = q_raw.lower()
        q_clean = re.sub(r"[^\w\s]", " ", q_raw)

        # 1. Multi-Role Entity Extraction
        detected_role = None
        crop_query = None
        harbor_query = None
        icao_query = None
        runway_query = None

        # 1a. Aviation ICAO & Runway Extraction
        icao_map = {
            "vabb": "VABB", "mumbai airport": "VABB", "bom": "VABB",
            "vidp": "VIDP", "delhi airport": "VIDP", "del": "VIDP", "igi": "VIDP", "igi airport": "VIDP",
            "vobl": "VOBL", "bangalore airport": "VOBL", "bengaluru airport": "VOBL", "blr": "VOBL", "kempegowda": "VOBL",
            "vomm": "VOMM", "chennai airport": "VOMM", "maa": "VOMM",
            "vapo": "VAPO", "pune airport": "VAPO", "pnq": "VAPO",
            "vohs": "VOHS", "hyderabad airport": "VOHS", "hyd": "VOHS", "rgia": "VOHS",
            "vecc": "VECC", "kolkata airport": "VECC", "ccu": "VECC",
            "voci": "VOCI", "kochi airport": "VOCI", "cochin airport": "VOCI", "cok": "VOCI",
            "vaah": "VAAH", "ahmedabad airport": "VAAH", "amd": "VAAH",
            "vogo": "VOGO", "goa airport": "VOGO", "mopa": "VOGO", "goi": "VOGO", "dabolim": "VOGO"
        }
        for token, code in icao_map.items():
            if re.search(r"\b" + re.escape(token) + r"\b", q):
                icao_query = code
                break

        rwy_match = re.search(r"\b(?:runway|rwy)\s*([0-3]?[0-9][LRC]?)\b", q_clean, re.IGNORECASE)
        if rwy_match:
            runway_query = rwy_match.group(1).upper()

        # 1b. Agricultural Crop Extraction
        crop_map = {
            "soybean": "Soybean", "सोयाबीन": "Soybean", "soya": "Soybean",
            "cotton": "Cotton", "कापूस": "Cotton", "kapas": "Cotton",
            "wheat": "Wheat", "गहू": "Wheat", "gehu": "Wheat",
            "rice": "Rice", "तांदूळ": "Rice", "paddy": "Rice", "dhan": "Rice",
            "sugarcane": "Sugarcane", "ऊस": "Sugarcane", "ganna": "Sugarcane",
            "groundnut": "Groundnut", "भुईमूग": "Groundnut", "peanut": "Groundnut",
            "maize": "Maize", "मका": "Maize", "corn": "Maize",
            "tomato": "Tomato", "टोमॅटो": "Tomato", "onion": "Onion", "कांदा": "Onion"
        }
        for token, standard_crop in crop_map.items():
            if re.search(r"\b" + re.escape(token) + r"\b", q):
                crop_query = standard_crop
                break

        # 1c. Harbor / Coastal Fishing Extraction
        harbor_map = {
            "sassoon docks": "Sassoon Docks (Mumbai)", "sassoon": "Sassoon Docks (Mumbai)",
            "versova": "Versova Harbor (Mumbai)", "ratnagiri": "Ratnagiri Mirkarwada", "mirkarwada": "Ratnagiri Mirkarwada",
            "malpe": "Malpe Fishing Harbor (Karnataka)", "kochi": "Kochi Fishing Harbor (Kerala)", "cochin harbor": "Kochi Fishing Harbor (Kerala)",
            "chennai harbor": "Kasimedu Harbor (Chennai)", "kasimedu": "Kasimedu Harbor (Chennai)",
            "visakhapatnam harbor": "Visakhapatnam Harbor (AP)", "vizag harbor": "Visakhapatnam Harbor (AP)",
            "porbandar": "Porbandar Harbor (Gujarat)", "paradip": "Paradip Port (Odisha)", "veraval": "Veraval Harbor (Gujarat)"
        }
        for token, standard_harbor in harbor_map.items():
            if token in q:
                harbor_query = standard_harbor
                break

        # 2. Location Entity & Route Extraction
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
        if any(rel in q for rel in ["here", "near me", "my location", "my city", "around me", "this place", "my farm", "my field", "my boat", "our harbor"]):
            is_relative = True

        # Non-location stopwords that should never be extracted as cities
        non_locations = {
            "a walk", "walk", "walking", "jog", "jogging", "picnic", "dinner", "lunch",
            "the weekend", "weekend", "this weekend", "the week", "week", "this week",
            "tomorrow", "tonight", "today", "the morning", "the evening", "the afternoon",
            "evening", "morning", "afternoon", "my area", "here", "there", "india",
            "me", "a", "an", "the", "travel", "drive", "work", "school", "outside",
            "an umbrella", "umbrella", "raincoat", "weather", "forecast", "pesticide",
            "fertilizer", "spray", "spraying", "field", "farm", "crop", "crops",
            "flight", "landing", "takeoff", "boat", "sea", "fishing", "harbor", "airport"
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
            for_match = re.search(r"\b(?:weather|forecast|temp|temperature|rain|alerts?|report|briefing)\s+for\s+([A-Za-z\s]+?)(?:\s+(?:today|tomorrow|tonight|right now|this evening|this weekend|now)|$)", q_clean, re.IGNORECASE)
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

        # 4) Direct queries like "What about Pune?" or "Pune weather"
        if not location_query:
            pune_nashik_match = re.search(r"\b(?:what about|how about|check)\s+([A-Za-z\s]+?)(?:\s+(?:tomorrow|tonight|today)|$)", q_clean, re.IGNORECASE)
            if pune_nashik_match:
                candidate = pune_nashik_match.group(1).strip()
                if candidate.lower() not in non_locations and len(candidate.split()) <= 3:
                    location_query = candidate

        if "there" in q:
            is_relative = True

        # 3. Time Range Detection
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

        # 4. Follow-Up Detection
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
                past_text = " ".join([m.get("content", "").lower() for m in chat_history[-3:]])
                if "tomorrow" in past_text:
                    if time_range == "evening":
                        time_range = "tomorrow_evening"
                    elif time_range == "morning":
                        time_range = "tomorrow_morning"

        # 5. Multi-Role Intent Classification
        intent = "GENERAL_WEATHER"
        requires_alert = False

        # --- A. 🌾 Agricultural / Farmer Intents ---
        if any(w in q for w in [
            "spray", "spraying", "pesticide", "fungicide", "insecticide", "fertilizer", "wash off", "wash-off", "drift",
            "फवारणी", "कीटकनाशक", "औषध फवारणी", "रासायनिक खते"
        ]):
            intent = "AGRI_SPRAY_RISK"
            detected_role = "farmer"
        elif any(w in q for w in [
            "irrigate", "irrigation", "soil moisture", "watering field", "water crop", "et0", "evapotranspiration",
            "सिंचन", "पाणी देणे", "जमिनीतील ओलावा", "बाष्पीभवन"
        ]):
            intent = "AGRI_IRRIGATION"
            detected_role = "farmer"
        elif any(w in q for w in [
            "pest", "disease", "rust", "blight", "bollworm", "caterpillar", "infection", "fungal",
            "रोग", "कीड", "अळी", "तांबेरा", "करपा"
        ]):
            intent = "AGRI_PEST_RISK"
            detected_role = "farmer"
        elif any(w in q for w in [
            "farming window", "best window for farming", "harvesting time", "sowing time", "when to harvest",
            "कापणी", "पेरणी", "शेतीची कामे"
        ]):
            intent = "FARMING_WINDOWS"
            detected_role = "farmer"
        elif crop_query or any(w in q for w in ["my farm", "my crop", "in my field", "शेतात", "शेतकरी"]):
            intent = "FARMING_DECISION"
            detected_role = "farmer"

        # --- B. 🎣 Marine / Fisherman Intents ---
        elif any(w in q for w in [
            "sail", "sailing", "safe to sail", "take boat out", "departure from harbor", "go fishing",
            "मासेमारी", "बोट नेऊ का", "समुद्रात जावे का", "समुद्र प्रवास"
        ]):
            intent = "MARINE_SAIL_DECISION"
            detected_role = "fisherman"
            requires_alert = True
        elif any(w in q for w in [
            "return time", "when must i return", "turn back to harbor", "return cutoff", "safe return",
            "परतीची वेळ", "कधी परत यावे"
        ]):
            intent = "MARINE_RETURN_TIME"
            detected_role = "fisherman"
            requires_alert = True
        elif any(w in q for w in [
            "tide", "high tide", "low tide", "tidal", "भरती", "ओहोटी"
        ]):
            intent = "MARINE_TIDE_SCHEDULE"
            detected_role = "fisherman"
        elif any(w in q for w in [
            "wave height", "swell", "sea state", "deep sea", "near-shore", "coastal risk", "coastal warning",
            "लाटांची उंची", "खोल समुद्र"
        ]) or harbor_query:
            intent = "MARINE_ZONE_RISK"
            detected_role = "fisherman"
            requires_alert = True

        # --- C. ✈️ Aviation Intents ---
        elif any(w in q for w in [
            "crosswind", "runway wind", "headwind", "tailwind", "crosswind limit", "runway direction"
        ]) or runway_query:
            intent = "RUNWAY_CROSSWIND"
            detected_role = "aviation"
        elif any(w in q for w in [
            "metar", "taf", "decode metar", "icao string", "raw metar"
        ]):
            intent = "METAR_TAF_DECODE"
            detected_role = "aviation"
        elif any(w in q for w in ["compare airports", "airport comparison", "compare bom and pnq", "compare vabb and vapo"]):
            intent = "AIRPORT_COMPARISON"
            detected_role = "aviation"
        elif icao_query or any(w in q for w in [
            "flight briefing", "aviation briefing", "airport briefing", "vfr", "ifr", "mvfr", "cloud ceiling", "rvr",
            "takeoff weather", "landing weather", "flight operations"
        ]):
            intent = "AVIATION_BRIEFING"
            detected_role = "aviation"

        # --- D. General Meteorological & Route Intents ---
        elif any(w in q for w in ["compare", "safest time", "best time to leave", "leave at 6", "leave at 9"]):
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
        elif any(w in q for w in [
            "air quality", "aqi", "pollution", "pm2.5", "pm2_5", "pm10", "smog",
            "how is the air", "is the air safe", "air safe", "hawa", "हवा",
            "clean air", "breathe", "mask", "ozone", "nitrogen dioxide", "sulfur dioxide",
            "हवेची गुणवत्ता", "प्रदूषण"
        ]):
            intent = "AIR_QUALITY"
        elif any(w in q for w in ["rain", "shower", "downpour", "precipitation", "drizzle", "monsoon", "पाऊस", "बारिश"]):
            if time_range in ["tomorrow", "tomorrow_morning", "tomorrow_evening", "weekend", "week", "tonight"]:
                intent = "RAIN_FORECAST"
            else:
                intent = "RAIN_QUERY"
        elif any(w in q for w in ["hot", "cold", "temperature", "temp", "degrees", "celsius", "heat", "heatwave", "warm", "तापमान", "थंडी", "गरमी"]):
            intent = "TEMPERATURE"
        elif any(w in q for w in ["travel", "drive", "safe to drive", "safe to go", "traffic weather", "road condition", "trip", "flight", "fly", "go to"]):
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
            detected_role=detected_role,
            crop_query=crop_query,
            harbor_query=harbor_query,
            icao_query=icao_query,
            runway_query=runway_query,
        )

intent_agent = IntentAgent()

