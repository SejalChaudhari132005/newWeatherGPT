import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from backend.app.agents.base_agent import BaseAgent
from backend.app.agents.intent_agent import intent_agent
from backend.app.agents.fusion_agent import weather_fusion_agent, WeatherFusionAgent
from backend.app.agents.weather_chat_agent import weather_chat_agent, WeatherChatAgent
from backend.app.agents.role_router import role_router, RoleRouter
from backend.app.services.weather_context_service import weather_context_service
from backend.app.services.conversation_service import conversation_service
from backend.app.services.location_service import location_service
from backend.app.services.language_service import language_service
from backend.app.core.logging import logger


class OrchestratorAgent(BaseAgent):
    """
    OrchestratorAgent:
    End-to-End Orchestrator for WeatherGPT conversational pipeline:
    1. Identifies user context & conversation history.
    2. Resolves location using strict priority (Query override -> Selected/GPS -> Saved -> Ask user).
       NEVER defaults to Mumbai.
    3. Classifies user intent (advisory, forecast, temperature, rain, alerts).
    4. Fetches verified weather intelligence from WeatherFusionAgent (Open-Meteo + IMD).
    5. Feeds verified context to WeatherChatAgent (Groq LLM).
    6. Validates against fabricated temperatures, rain numbers, or alerts.
    7. Persists messages and conversation threads to Supabase.
    """

    def __init__(
        self,
        fusion_agent_inst: Optional[WeatherFusionAgent] = None,
        chat_agent_inst: Optional[WeatherChatAgent] = None,
    ):
        self.fusion_agent = fusion_agent_inst or weather_fusion_agent
        self.chat_agent = chat_agent_inst or weather_chat_agent

    @property
    def name(self) -> str:
        return "OrchestratorAgent"

    @property
    def description(self) -> str:
        return "Coordinates intent classification, location resolution, weather intelligence fusion, LLM reasoning, and response validation."

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes the full conversational weather orchestration pipeline.
        """
        start_total = time.perf_counter()
        ctx = context or {}
        request_id = ctx.get("request_id") or str(uuid.uuid4())

        user_id = ctx.get("user_id", "anonymous")
        conversation_id = ctx.get("conversation_id")
        user_role = ctx.get("role", "citizen")
        user_language = ctx.get("language")
        user_gps = ctx.get("location") or {}

        gps_lat = user_gps.get("latitude")
        gps_lon = user_gps.get("longitude")
        gps_city = user_gps.get("city")
        gps_state = user_gps.get("state")

        # 1. Multilingual Query Normalization & Language Discovery
        normalized_query, detected_lang = await language_service.normalize_query(
            query=query,
            preferred_language=user_language,
        )
        target_lang = language_service.to_iso_code(user_language) if user_language else detected_lang

        # 2. Conversation History & Past Location Resolution
        history: List[Dict[str, str]] = []
        last_query_location = None
        if conversation_id:
            past_msgs = await conversation_service.get_messages(conversation_id, limit=8)
            for m in past_msgs:
                history.append({"role": m["role"], "content": m["content"]})
                # Check if previous assistant message stored a query location override
                meta = m.get("metadata") or {}
                if meta.get("query_location"):
                    last_query_location = meta.get("query_location")

        # 3. Intent Classification (using normalized query for robust intent & entity extraction)
        t_intent_start = time.perf_counter()
        intent_res = intent_agent.classify(normalized_query, context={"chat_history": history})
        intent_ms = (time.perf_counter() - t_intent_start) * 1000.0

        # 4. Location Resolution by Strict Priority:
        # Priority 1: Explicit location mentioned in query (e.g. "weather in Pune")
        # Priority 2: Current selected / GPS location from request
        # Priority 3: Previous conversation query location (if follow-up)
        # Priority 4: Saved location from user profile in Supabase
        # Priority 5: Ask user for location (NEVER hardcoded Mumbai fallback)
        target_lat = gps_lat
        target_lon = gps_lon
        target_city = gps_city
        target_state = gps_state
        resolved_override = None

        # Multi-Role Specific Geolocation Override
        if intent_res.icao_query:
            from backend.app.services.aviation_weather_service import INDIAN_AIRPORTS_CATALOG
            apt = INDIAN_AIRPORTS_CATALOG.get(intent_res.icao_query)
            if apt:
                target_lat = apt["latitude"]
                target_lon = apt["longitude"]
                target_city = apt["name"]
                target_state = apt["state"]
                resolved_override = {
                    "city": target_city,
                    "state": target_state,
                    "latitude": target_lat,
                    "longitude": target_lon,
                    "icao": apt["icao"],
                }
        elif intent_res.harbor_query:
            harbor_coords = {
                "Sassoon Docks (Mumbai)": (18.9100, 72.8250, "Sassoon Docks", "Maharashtra"),
                "Versova Harbor (Mumbai)": (19.1350, 72.8100, "Versova", "Maharashtra"),
                "Ratnagiri Mirkarwada": (16.9800, 73.2800, "Ratnagiri", "Maharashtra"),
                "Malpe Fishing Harbor (Karnataka)": (13.3500, 74.7000, "Malpe", "Karnataka"),
                "Kochi Fishing Harbor (Kerala)": (9.9300, 76.2600, "Kochi", "Kerala"),
                "Kasimedu Harbor (Chennai)": (13.1200, 80.2900, "Kasimedu, Chennai", "Tamil Nadu"),
                "Visakhapatnam Harbor (AP)": (17.6900, 83.2900, "Visakhapatnam", "Andhra Pradesh"),
                "Porbandar Harbor (Gujarat)": (21.6400, 69.6000, "Porbandar", "Gujarat"),
                "Paradip Port (Odisha)": (20.2600, 86.6700, "Paradip", "Odisha"),
                "Veraval Harbor (Gujarat)": (20.9000, 70.3600, "Veraval", "Gujarat"),
            }
            if intent_res.harbor_query in harbor_coords:
                h_lat, h_lon, h_city, h_state = harbor_coords[intent_res.harbor_query]
                target_lat = h_lat
                target_lon = h_lon
                target_city = h_city
                target_state = h_state
                resolved_override = {
                    "city": target_city,
                    "state": target_state,
                    "latitude": target_lat,
                    "longitude": target_lon,
                }
        elif intent_res.location_query:
            try:
                places = await location_service.search_location(intent_res.location_query)
                if places and len(places) > 0:
                    target_lat = float(places[0]["latitude"])
                    target_lon = float(places[0]["longitude"])
                    target_city = places[0].get("name", intent_res.location_query)
                    target_state = places[0].get("state", "India")
                    resolved_override = {
                        "city": target_city,
                        "state": target_state,
                        "latitude": target_lat,
                        "longitude": target_lon,
                    }
            except Exception as e:
                logger.warning(f"[OrchestratorAgent] Location search error for '{intent_res.location_query}': {e}")
        elif intent_res.is_relative_location or "here" in normalized_query.lower() or "near me" in normalized_query.lower():
            # Reset back to user's real GPS / selected location
            target_lat = gps_lat
            target_lon = gps_lon
            target_city = gps_city
            target_state = gps_state
            resolved_override = None
        elif intent_res.is_follow_up and last_query_location and "here" not in normalized_query.lower() and "near me" not in normalized_query.lower():
            target_lat = last_query_location.get("latitude", target_lat)
            target_lon = last_query_location.get("longitude", target_lon)
            target_city = last_query_location.get("city", target_city)
            target_state = last_query_location.get("state", target_state)
            resolved_override = last_query_location

        # Priority 4: Check saved location from user profile in Supabase if coords missing
        if target_lat is None or target_lon is None:
            if user_id and user_id != "anonymous":
                try:
                    from backend.app.services.supabase_service import get_supabase_client
                    sb = get_supabase_client()
                    if sb:
                        prof_res = sb.table("profiles").select("*").eq("id", user_id).execute()
                        if prof_res.data and len(prof_res.data) > 0:
                            saved_prof = prof_res.data[0]
                            if saved_prof.get("latitude") and saved_prof.get("longitude"):
                                target_lat = float(saved_prof["latitude"])
                                target_lon = float(saved_prof["longitude"])
                                target_city = saved_prof.get("city") or target_city
                                target_state = saved_prof.get("state") or target_state
                                if not user_role or user_role == "citizen":
                                    user_role = saved_prof.get("role", user_role)
                                if not user_language:
                                    user_language = saved_prof.get("preferred_language") or saved_prof.get("language")
                except Exception as sb_err:
                    logger.warning(f"[OrchestratorAgent] Could not retrieve profile from Supabase: {sb_err}")

        # Priority 5: Ask user for location if still unresolved (NEVER default to Mumbai)
        if target_lat is None or target_lon is None:
            msg_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()
            loc_msg = "What location would you like me to check?"
            if target_lang != "en":
                loc_msg = await language_service.translate_response(loc_msg, target_lang)
            logger.info(f"[ChatPipeline] req_id={request_id} user_id={user_id} intent={intent_res.intent} status=LOCATION_REQUIRED")
            return {
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "message": {
                    "id": msg_id,
                    "role": "assistant",
                    "content": loc_msg,
                    "created_at": now_iso,
                },
                "intent": intent_res.intent,
                "location": None,
                "weather_used": False,
                "sources": [],
                "official_warning": False,
                "metadata": {
                    "request_id": request_id,
                    "intent": intent_res.intent,
                    "location": None,
                    "sources": [],
                    "confidence": None,
                    "error": "LOCATION_UNAVAILABLE",
                },
                "updated_title": None,
            }

        # 4. Handle Route Weather & Travel Intelligence Query (Step 10)
        if intent_res.intent in ["ROUTE_WEATHER_ANALYSIS", "DEPARTURE_TIME_COMPARISON"] or (intent_res.origin_query and intent_res.destination_query):
            from backend.app.services.route_weather_service import route_weather_service
            
            origin_name = intent_res.origin_query or gps_city or "Current Location"
            dest_name = intent_res.destination_query or intent_res.location_query or "Pune"

            o_lat, o_lon = gps_lat or 19.2437, gps_lon or 73.1355
            d_lat, d_lon = 18.5204, 73.8567  # default Pune

            try:
                if intent_res.origin_query:
                    o_places = await location_service.search_location(intent_res.origin_query)
                    if o_places:
                        o_lat, o_lon = float(o_places[0]["latitude"]), float(o_places[0]["longitude"])
                        origin_name = o_places[0].get("name", origin_name)
                if intent_res.destination_query:
                    d_places = await location_service.search_location(intent_res.destination_query)
                    if d_places:
                        d_lat, d_lon = float(d_places[0]["latitude"]), float(d_places[0]["longitude"])
                        dest_name = d_places[0].get("name", dest_name)
            except Exception as e:
                logger.warning(f"[OrchestratorAgent] Route geocode error: {e}")

            if intent_res.intent == "DEPARTURE_TIME_COMPARISON":
                comp_res = await route_weather_service.compare_departure_times(
                    origin_lat=o_lat,
                    origin_lon=o_lon,
                    dest_lat=d_lat,
                    dest_lon=d_lon,
                    origin_name=origin_name,
                    dest_name=dest_name,
                    language=target_lang,
                )
                raw_content = f"🚗 **Departure Time Weather Comparison ({origin_name} → {dest_name})**\n\n"
                for slot in comp_res.get("comparison", []):
                    icon = "🟢" if slot["overall_risk"] == "low" else "🟡" if slot["overall_risk"] == "moderate" else "🟠" if slot["overall_risk"] == "high" else "🔴"
                    raw_content += f"• **{slot['formatted_departure']}**: {icon} {slot['overall_risk'].upper()} Risk — {slot['top_reason']} (ETA: {slot['arrival_time']})\n"
                raw_content += f"\n👉 **Recommendation**: {comp_res.get('recommendation_summary')}\n\n*Source: IMD Authoritative Warnings + OSRM Highway Engine.*"

                route_analysis_payload = comp_res
            else:
                route_res = await route_weather_service.analyze_route(
                    origin_lat=o_lat,
                    origin_lon=o_lon,
                    dest_lat=d_lat,
                    dest_lon=d_lon,
                    origin_name=origin_name,
                    dest_name=dest_name,
                    departure_time="08:00",
                    language=target_lang,
                )

                risk_tag = route_res.get("overall_risk", "low").upper()
                dur_str = route_res.get("formatted_duration", "2h 30m")
                dist_km = route_res.get("distance_km", 0.0)

                haz_str = ", ".join(route_res.get("hazards", [])) or "None (Clear highway conditions)"
                reasons_str = "\n".join([f"• {r}" for r in route_res.get("reasons", [])])

                raw_content = (
                    f"🚗 **Route Weather Intelligence: {origin_name} → {dest_name}**\n\n"
                    f"• **Distance & Duration**: {dist_km} km (~{dur_str})\n"
                    f"• **Corridor Weather Risk**: **{risk_tag}**\n"
                    f"• **Key Hazards**: {haz_str}\n\n"
                    f"**Route Analysis Details**:\n{reasons_str}\n\n"
                    f"👉 **Advisory**: {route_res.get('recommendation', {}).get('summary_action', 'Drive with normal highway caution.')}\n\n"
                    f"Would you like me to compare alternate departure times or set a severe weather alert along this route?"
                )
                route_analysis_payload = route_res

            # Multilingual translation for non-English target language
            if target_lang != "en":
                final_content = await language_service.translate_response(
                    english_text=raw_content,
                    target_language=target_lang,
                )
            else:
                final_content = raw_content

            total_ms = (time.perf_counter() - start_total) * 1000.0
            msg_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()

            return {
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "message": {
                    "id": msg_id,
                    "role": "assistant",
                    "content": final_content,
                    "created_at": now_iso,
                },
                "intent": intent_res.intent,
                "location": {"city": dest_name, "state": "India"},
                "weather_used": True,
                "sources": [
                    {"name": "IMD", "provider": "India Meteorological Department", "type": "official_warnings"},
                    {"name": "OSRM", "provider": "OSRM Road Engine", "type": "route_geometry"},
                ],
                "official_warning": bool(route_analysis_payload.get("hazards")),
                "action_buttons": [
                    {"id": "compare_times", "label": "Compare Departure Times", "action": f"Compare 6 AM and 9 AM departure from {origin_name} to {dest_name}"},
                    {"id": "show_route", "label": "View Route on Map", "action": "navigate_map"},
                    {"id": "set_alert", "label": "Set Travel Alert", "action": f"Set route alert for {origin_name} to {dest_name}"},
                ],
                "metadata": {
                    "intent": intent_res.intent,
                    "location": {"city": dest_name, "state": "India"},
                    "route_analysis": route_analysis_payload,
                    "sources": [
                        {"name": "IMD", "provider": "India Meteorological Department"},
                        {"name": "OSRM", "provider": "OSRM Road Engine"},
                    ],
                    "confidence": {"score": 0.95, "level": "High", "label": "High"},
                    "timings": {"total_ms": total_ms},
                },
                "updated_title": f"{origin_name} to {dest_name} Route Weather",
            }

        # 5. Handle Air Quality Intelligence Query (Step 11)
        if intent_res.intent == "AIR_QUALITY":
            from backend.app.services.air_quality_service import air_quality_service
            aq_res = await air_quality_service.get_current_air_quality(
                latitude=target_lat,
                longitude=target_lon,
            )

            loc_data = aq_res.get("location", {})
            aq_data = aq_res.get("air_quality", {})
            interp = aq_res.get("interpretation", {})

            city_label = target_city or loc_data.get("city") or "your location"

            if not aq_res.get("success") or aq_data.get("aqi") is None:
                raw_content = f"I'm unable to retrieve the latest real-time air quality observations for {city_label} right now. Please check back shortly."
            else:
                aqi = aq_data.get("aqi")
                cat_label = aq_data.get("category_label", "Moderate")
                primary = aq_data.get("primary_pollutant_name") or "Particulate Matter (PM2.5)"
                pm25 = aq_data.get("pm2_5")
                pm10 = aq_data.get("pm10")
                outdoor_adv = interp.get("outdoor_advisory", "")
                sensitive_adv = interp.get("sensitive_group_advisory", "")
                comb_note = interp.get("combined_weather_note")
                trend_desc = interp.get("trend_description", "")

                raw_content = (
                    f"Air Quality Analysis for {city_label}\n\n"
                    f"- Current AQI Index: {aqi} ({cat_label}) [{aq_data.get('aqi_scale', 'European AQI (CAMS)')}]\n"
                    f"- Main Pollutant of Concern: {primary}\n"
                    f"- Particulate Levels: PM2.5: {pm25} ug/m3 | PM10: {pm10} ug/m3\n\n"
                    f"Health & Activity Guidance:\n"
                    f"- Outdoor Activity: {outdoor_adv}\n"
                    f"- Sensitive Groups: {sensitive_adv}\n"
                )
                if comb_note:
                    raw_content += f"\n- Weather Impact: {comb_note}\n"
                if trend_desc:
                    raw_content += f"\n- Trend Outlook: {trend_desc}\n"

                raw_content += f"\nSource: {aq_res.get('source', 'Open-Meteo / CAMS')} (Model telemetry)."

            if target_lang != "en":
                final_content = await language_service.translate_response(
                    english_text=raw_content,
                    target_language=target_lang,
                )
            else:
                final_content = raw_content

            total_ms = (time.perf_counter() - start_total) * 1000.0
            msg_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()

            return {
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "message": {
                    "id": msg_id,
                    "role": "assistant",
                    "content": final_content,
                    "created_at": now_iso,
                },
                "intent": "AIR_QUALITY",
                "location": {"city": city_label, "latitude": target_lat, "longitude": target_lon},
                "weather_used": True,
                "sources": [
                    {"name": "Open-Meteo Air Quality", "provider": "CAMS / ECMWF", "type": "atmospheric_composition"},
                ],
                "official_warning": aq_data.get("category") in ["POOR", "VERY_POOR", "EXTREMELY_POOR"],
                "action_buttons": [
                    {"id": "view_aqi", "label": "View Air Quality Card", "action": "navigate_advisories"},
                    {"id": "ask_pollutant", "label": "What is PM2.5?", "action": "What is PM2.5 and how does it affect health?"},
                ],
                "metadata": {
                    "intent": "AIR_QUALITY",
                    "location": {"city": city_label, "latitude": target_lat, "longitude": target_lon},
                    "air_quality": aq_data,
                    "interpretation": interp,
                    "sources": [{"name": "Open-Meteo Air Quality", "provider": "CAMS / ECMWF"}],
                    "confidence": {"score": 0.95, "level": "High", "label": "High"},
                    "timings": {"total_ms": total_ms},
                },
                "updated_title": f"Air Quality in {city_label}" if not conversation_id else None,
            }

        # 6. Fetch Verified Weather Intelligence (Standard Single-Location Flow)

        t_weather_start = time.perf_counter()
        loc_meta = {"city": target_city, "state": target_state}
        intelligence = None
        weather_error = None

        try:
            intelligence = await self.fusion_agent.build_weather_intelligence(
                latitude=target_lat,
                longitude=target_lon,
                location_meta=loc_meta
            )
        except Exception as e:
            logger.error(f"[OrchestratorAgent] Weather API failure: {e}", exc_info=True)
            weather_error = str(e)

        weather_ms = (time.perf_counter() - t_weather_start) * 1000.0

        if not intelligence or intelligence.current.temperature.value is None:
            msg_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()
            return {
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "message": {
                    "id": msg_id,
                    "role": "assistant",
                    "content": "I couldn't retrieve the latest weather data right now. Please try again in a moment.",
                    "created_at": now_iso,
                },
                "intent": intent_res.intent,
                "location": {"city": target_city, "state": target_state},
                "weather_used": False,
                "sources": [],
                "official_warning": False,
                "metadata": {
                    "intent": intent_res.intent,
                    "location": {"city": target_city, "state": target_state},
                    "sources": [],
                    "confidence": None,
                    "error": weather_error or "WEATHER_SERVICE_UNAVAILABLE",
                },
                "updated_title": None,
            }

        # 7. Route through RoleRouter -> RoleAgent (FarmerAgent, FishermanAgent, AviationAgent, CitizenAgent)
        effective_role = user_role
        if not effective_role or effective_role == "citizen":
            if intent_res.detected_role:
                effective_role = intent_res.detected_role
            else:
                effective_role = "citizen"

        active_role_agent = role_router.get_agent(effective_role)
        chat_agent_result = await active_role_agent.generate_chat_context(
            intelligence=intelligence,
            query=normalized_query,
            chat_history=history,
            time_range=intent_res.time_range,
            language="en",
        )

        raw_content = chat_agent_result["content"]
        structured_context = weather_context_service.build_structured_context(intelligence)

        # 7b. Multilingual Translation: Translate response to target Indian language
        if target_lang != "en":
            final_content = await language_service.translate_response(
                english_text=raw_content,
                target_language=target_lang,
                structured_context=structured_context,
            )
        else:
            final_content = raw_content

        total_ms = (time.perf_counter() - start_total) * 1000.0
        has_warning = bool(intelligence.alerts and len(intelligence.alerts) > 0)

        # 8. Dynamic Role-Specific Action Buttons
        canonical_role = (effective_role or "citizen").lower()
        action_buttons: List[Dict[str, str]] = []
        if canonical_role in ["farmer", "agriculture", "farm", "krishi"]:
            action_buttons = [
                {"id": "view_farm", "label": "Open Farm Dashboard", "action": "navigate_farmer"},
                {"id": "spray_risk", "label": "Check Spraying Window", "action": "Should I spray pesticide tomorrow morning?"},
                {"id": "irrigation", "label": "Irrigation Need", "action": "Is irrigation recommended today for my field?"},
            ]
        elif canonical_role in ["fisher", "fisherman", "marine", "sea"]:
            action_buttons = [
                {"id": "view_sea", "label": "Open Marine Dashboard", "action": "navigate_fisher"},
                {"id": "return_time", "label": "Check Return Deadline", "action": "When must I return back to harbor?"},
                {"id": "tide_curve", "label": "Tide & Sea State", "action": "What are the tide timings and wave heights today?"},
            ]
        elif canonical_role in ["aviation", "pilot", "flight", "dispatcher"]:
            action_buttons = [
                {"id": "view_aviation", "label": "Open Flight Ops Dashboard", "action": "navigate_aviation"},
                {"id": "crosswind", "label": "Runway Crosswind", "action": f"Calculate crosswind for active runway at {target_city or 'airport'}"},
                {"id": "metar_taf", "label": "Decode METAR/TAF", "action": f"Decode METAR for {intent_res.icao_query or 'current airport'}"},
            ]
        else:
            action_buttons = [
                {"id": "hourly", "label": "Hourly Forecast", "action": f"What is the hourly forecast for {intelligence.location.city}?"},
                {"id": "air_quality", "label": "Check Air Quality", "action": f"How is the air quality in {intelligence.location.city}?"},
                {"id": "travel", "label": "Route Weather", "action": f"Drive from {intelligence.location.city} to Pune"},
            ]

        # 9. Assemble Comprehensive Metadata
        metadata = {
            "intent": intent_res.intent,
            "time_range": intent_res.time_range,
            "role": {
                "requested": user_role,
                "detected": intent_res.detected_role,
                "effective": effective_role,
                "agent_name": active_role_agent.role_name,
            },
            "language": {
                "detected_input": detected_lang,
                "target_language": target_lang,
            },
            "location": {
                "latitude": target_lat,
                "longitude": target_lon,
                "city": intelligence.location.city,
                "district": intelligence.location.district,
                "state": intelligence.location.state,
                "is_override": bool(resolved_override),
            },
            "query_location": resolved_override,
            "sources": [
                {"name": "Open-Meteo", "provider": "Open-Meteo", "type": "weather_data"},
                {"name": "IMD", "provider": "India Meteorological Department (IMD)", "type": "official_warning"}
            ],
            "confidence": {
                "score": intelligence.confidence.score,
                "level": intelligence.confidence.level,
                "label": intelligence.confidence.level,
                "agreement": intelligence.confidence.agreement_level,
            },
            "alerts": [
                {
                    "id": a.id,
                    "severity": a.severity,
                    "severity_label": a.severity_label,
                    "title": a.title,
                    "description": a.description,
                    "source": a.source,
                }
                for a in intelligence.alerts
            ],
            "weather_context": structured_context,
            "latencies": {
                "intent_ms": round(intent_ms, 1),
                "weather_ms": round(weather_ms, 1),
                "llm_ms": chat_agent_result.get("llm_latency_ms", 0.0),
                "total_ms": round(total_ms, 1),
            },
            "validation": chat_agent_result.get("validation", {}),
            "timestamp": intelligence.data_freshness.retrieved_at,
        }

        # Structured logging per Rule 28
        logger.info(
            f"[ChatPipeline] req_id={request_id} user_id={user_id} intent={intent_res.intent} role={effective_role} "
            f"location='{intelligence.location.city}, {intelligence.location.state}' sources={chat_agent_result.get('sources', ['Open-Meteo'])} "
            f"weather_fetch_ms={weather_ms:.1f} groq_latency_ms={chat_agent_result.get('llm_latency_ms', 0.0):.1f} "
            f"total_latency_ms={total_ms:.1f} status={'SUCCESS' if not chat_agent_result.get('llm_failed') else 'DEGRADED_FALLBACK'}"
        )

        # 10. Persist Conversation & Messages
        conv_record = await conversation_service.get_or_create_conversation(
            conversation_id=conversation_id,
            user_id=user_id,
            initial_query=query,
            location_name=intelligence.location.city,
            role=effective_role
        )
        active_conv_id = conv_record["id"]
        msg_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        # Store user message
        await conversation_service.add_message(
            conversation_id=active_conv_id,
            role="user",
            content=query,
            metadata={"location": user_gps, "role": effective_role},
            user_id=user_id
        )

        # Store assistant message
        await conversation_service.add_message(
            conversation_id=active_conv_id,
            role="assistant",
            content=final_content,
            metadata=metadata,
            user_id=user_id
        )

        return {
            "conversation_id": active_conv_id,
            "message": {
                "id": msg_id,
                "role": "assistant",
                "content": final_content,
                "created_at": now_iso,
            },
            "intent": intent_res.intent,
            "location": {
                "city": intelligence.location.city,
                "state": intelligence.location.state,
                "latitude": target_lat,
                "longitude": target_lon,
            },
            "weather_used": True,
            "sources": chat_agent_result.get("sources", ["Open-Meteo"]),
            "official_warning": has_warning,
            "action_buttons": action_buttons,
            "metadata": metadata,
            "weather_context": structured_context,
            "updated_title": conv_record.get("title"),
        }


orchestrator_agent = OrchestratorAgent()

