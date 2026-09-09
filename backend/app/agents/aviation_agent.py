"""
AviationAgent for WeatherGPT Phase 4.
Translates verified aerodrome telemetry, runway orientations, wind vectors,
and convective storm metrics into structured pilot/dispatcher briefings and METAR explanations.
"""

import logging
from typing import Dict, Any, List, Optional
from backend.app.agents.role_router import RoleAgent, role_router
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.services.aviation_weather_service import aviation_weather_service, INDIAN_AIRPORTS_CATALOG
from backend.app.agents.weather_chat_agent import weather_chat_agent

logger = logging.getLogger("aviation_agent")

AVIATION_SYSTEM_INSTRUCTION = """You are WeatherGPT's Aviation Meteorological Intelligence Agent (✈️ MY OPERATIONS).

Your role is to guide pilots, flight dispatchers, and airport operation managers with critical weather intelligence:
1. Runway Crosswind & Headwind Vectors (Exact trigonometric breakdown, crosswind limits >15 kts caution, >25 kts exceedance).
2. Flight Rules Categorization (VFR, MVFR, IFR, Low Visibility Procedures - LVP with ceiling in ft AGL and visibility in meters).
3. Convective & Thunderstorm Risks (Convective Available Potential Energy - CAPE >800-1500 J/kg, microburst risk, wind shear).
4. Period Requiring Attention (Highlighting temporal hazard windows for approach stabilization, holding fuel, or alternates).
5. METAR & TAF Plain-Language Translation (Decoded aviation weather reports, altimeter QNH, cloud coverage).

Rules:
- Base all advisory statements strictly on verified meteorological telemetry and airport geometry.
- Differentiate clearly between demonstrated crosswind limits (e.g. 25 kts for typical narrowbody aircraft) and advisory cautions (15 kts).
- Always emphasize flight safety, alternate fuel reserves, and adherence to DGCA / ICAO standard operating procedures.
"""


class AviationAgent(RoleAgent):
    """
    Dedicated Aviation Meteorological Intelligence Agent.
    Specializes in runway wind components, flight rules classification,
    convective thunderstorm risks, METAR/TAF interpretation, and dual airport route comparisons.
    """

    @property
    def role_name(self) -> str:
        return "aviation"

    @property
    def description(self) -> str:
        return "Generates pilot flight briefings, runway crosswind/headwind vectors, flight rules (VFR/IFR), and METAR/TAF decodings."

    async def get_role_context(self) -> Dict[str, Any]:
        return {
            "role": "aviation",
            "focus_areas": [
                "runway_crosswind_vectors",
                "flight_rules_vfr_ifr",
                "cloud_ceiling_agl",
                "metar_taf_decoding",
                "convective_cape_hazards",
                "airport_comparison",
                "period_requiring_attention"
            ],
            "theme": "indigo",
            "environment": "aerodrome_flight_ops"
        }

    async def generate_advice(
        self,
        intelligence: WeatherIntelligenceData,
        query: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate structured aviation-specific intelligence and recommendations."""
        return await self.generate_dashboard_insights(intelligence, context)

    def _find_closest_airport_icao(self, lat: float, lon: float) -> str:
        """Finds closest Indian airport from coordinates."""
        closest_icao = "VABB"
        min_dist = float("inf")
        for icao, meta in INDIAN_AIRPORTS_CATALOG.items():
            dist = (meta["latitude"] - lat) ** 2 + (meta["longitude"] - lon) ** 2
            if dist < min_dist:
                min_dist = dist
                closest_icao = icao
        return closest_icao

    async def generate_dashboard_insights(
        self,
        intelligence: WeatherIntelligenceData,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes dynamic Aviation dashboard intelligence cards:
        - Flight Category & Rules (VFR / MVFR / IFR / LVP)
        - Active Runway Crosswind & Headwind Vectors
        - 3-Hour Structured Executive Briefing & Period Requiring Attention
        - Convective Thunderstorm (CAPE) Risk
        - Decoded METAR / TAF
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude

        icao = (context or {}).get("icao") or self._find_closest_airport_icao(lat, lon)
        active_rwy_override = (context or {}).get("active_runway_override")

        briefing_data = await aviation_weather_service.generate_aviation_briefing(
            icao=icao,
            active_runway_override=active_rwy_override,
        )

        cards = []

        # 1. Flight Category Hero Card
        fr = briefing_data.flight_rules
        cards.append({
            "id": "flight_category",
            "category": "Flight Rules & Aerodrome Category",
            "icon": "Plane",
            "status": "critical" if fr.category in ["IFR", "LVP"] else ("warning" if fr.category == "MVFR" else "good"),
            "title": f"Flight Category: {fr.category}",
            "message": fr.rationale,
            "category_code": fr.category,
            "ceiling_ft_agl": fr.ceiling_ft_agl,
            "visibility_m": fr.visibility_meters,
            "priority": 1,
        })

        # 2. Runway Wind Vectors Card
        rwy = briefing_data.active_runway
        cards.append({
            "id": "runway_wind_vectors",
            "category": "Active Runway Wind Vectors",
            "icon": "Compass",
            "status": "critical" if rwy.is_crosswind_exceeded else ("warning" if rwy.operational_status == "caution" else "good"),
            "title": f"Runway {rwy.runway_id} Wind: {rwy.operational_status.upper()}",
            "message": f"Headwind: {rwy.headwind_kts} kts | Crosswind: {rwy.crosswind_kts} kts from {rwy.crosswind_direction.upper()}",
            "active_runway": rwy.model_dump(),
            "alternate_runways": [alt.model_dump() for alt in briefing_data.alternate_runways],
            "priority": 2,
        })

        # 3. Period Requiring Attention Card
        if briefing_data.period_requiring_attention:
            pra = briefing_data.period_requiring_attention
            cards.append({
                "id": "period_requiring_attention",
                "category": "Operational Hazard Alert",
                "icon": "AlertTriangle",
                "status": "critical" if pra.severity == "critical" else ("warning" if pra.severity == "warning" else "caution"),
                "title": f"Attention: {pra.hazard_type.replace('_', ' ').title()} ({pra.time_window})",
                "message": pra.operational_impact,
                "suggested_action": pra.suggested_action,
                "priority": 3,
            })

        # 4. Decoded METAR / TAF Card
        metar = briefing_data.decoded_metar_taf
        cards.append({
            "id": "decoded_metar_taf",
            "category": "Aerodrome METAR / TAF",
            "icon": "FileText",
            "status": "good",
            "title": f"METAR {briefing_data.icao}",
            "message": metar.plain_english_briefing,
            "raw_metar": metar.raw_metar,
            "raw_taf": metar.raw_taf,
            "tokens": [t.model_dump() for t in metar.tokens],
            "priority": 4,
        })

        return {
            "role": "aviation",
            "summary": briefing_data.conversational_briefing,
            "cards": cards,
            "aviation_briefing_data": briefing_data.model_dump(),
            "sources": ["Open-Meteo Aviation Telemetry", "Airport Geometry Model", "METAR Synthesizer"],
            "updated_at": briefing_data.generated_at,
        }

    async def generate_chat_context(
        self,
        intelligence: WeatherIntelligenceData,
        query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        time_range: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Invokes WeatherChatAgent with Aviation system instructions and verified aerodrome telemetry grounding.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude

        closest_icao = self._find_closest_airport_icao(lat, lon)
        briefing = await aviation_weather_service.generate_aviation_briefing(icao=closest_icao)

        aviation_context = (
            f"\nVERIFIED AVIATION AERODROME CONTEXT FOR {briefing.airport_name} ({briefing.icao}/{briefing.iata}):\n"
            f"- Flight Category: {briefing.flight_rules.category} (Estimated Cloud Base: {briefing.flight_rules.ceiling_ft_agl} ft AGL, Visibility: {briefing.flight_rules.visibility_meters:.0f}m)\n"
            f"- Active Runway {briefing.active_runway.runway_id} (Hdg {briefing.active_runway.runway_heading_deg}°): Wind {briefing.active_runway.wind_direction_deg}° at {briefing.active_runway.wind_speed_kts} kts\n"
            f"  * Headwind: {briefing.active_runway.headwind_kts} kts, Crosswind: {briefing.active_runway.crosswind_kts} kts ({briefing.active_runway.crosswind_direction.upper()})\n"
            f"  * Operational Status: {briefing.active_runway.operational_status.upper()} (Limit Exceeded: {briefing.active_runway.is_crosswind_exceeded})\n"
            f"- Convective Risk: {briefing.convective_risk.upper()} (CAPE: {briefing.cape_j_kg or 0:.0f} J/kg)\n"
            f"- Temperature / Dewpoint: {briefing.temperature_c}°C / {briefing.dew_point_c}°C, QNH: {briefing.surface_pressure_hpa} hPa\n"
            f"- METAR: {briefing.decoded_metar_taf.raw_metar}\n"
            f"- Period Requiring Attention: {briefing.period_requiring_attention.operational_impact if briefing.period_requiring_attention else 'Stable conditions next 3 hours.'}\n"
        )

        enhanced_query = f"{query} {aviation_context}"

        return await weather_chat_agent.generate_response(
            query=enhanced_query,
            intelligence=intelligence,
            chat_history=chat_history,
            user_role="aviation",
            time_range=time_range,
            language=language,
        )


# Singleton Instance
aviation_agent = AviationAgent()

# Register in global RoleRouter
role_router.register("aviation", aviation_agent)
role_router.register("pilot", aviation_agent)
role_router.register("dispatcher", aviation_agent)
