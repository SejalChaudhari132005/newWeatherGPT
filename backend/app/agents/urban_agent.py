"""
UrbanAgent for WeatherGPT Phase 2 (Theme 9).
Translates verified meteorological data, hydrology dynamics, and Urban Heat Island (UHI) profiles
into actionable civil engineering and municipal infrastructure planning guidance.
"""

import logging
from typing import Dict, Any, List, Optional
from backend.app.agents.role_router import RoleAgent, role_router
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.services.urban_planner_service import urban_planner_service
from backend.app.agents.weather_chat_agent import weather_chat_agent

logger = logging.getLogger("urban_agent")

URBAN_PLANNER_SYSTEM_INSTRUCTION = """You are WeatherGPT's Urban Planning & Municipal Infrastructure Intelligence Agent (🌆 URBAN PLANNER).

Your role is to assist urban planners, municipal corporation engineers (e.g. PMC, BMC, BBMP, MCD), and infrastructure directors with data-driven weather intelligence:
1. Urban Flood Risk & Drainage Capacity (Rational Method runoff Q = C * I * A, storm sewer surcharge %, peak rainfall window triage e.g. 4–7 PM).
2. Waterlogging Hotspots & Dewatering Operations (Subways, low-lying junctions, underpasses, culvert maintenance).
3. Urban Heat Island (UHI) Mitigation (Thermal delta ΔT_UHI °C, impervious surface %, canopy cover shortfall, cool roof guidelines).
4. Critical Infrastructure Exposure (Metro concourses, hospital emergency access routes, 132kV/220kV power substations).
5. Climate Resilient Civil Engineering (Sustainable drainage systems SuDS, bioswales, retention sumps, permeable pavements).

Rules:
- Ground all recommendations in physical hydrology, urban morphology, and verified meteorological telemetry.
- Provide clear, actionable engineering directives (e.g., pump flow rates, gate regulation, arterial traffic diversions).
- Maintain an authoritative, technical, yet accessible municipal advisory tone.
"""


class UrbanAgent(RoleAgent):
    """
    Dedicated Urban Planning & Infrastructure Intelligence Agent.
    Specializes in urban flood modeling, storm drainage surcharge triage,
    Urban Heat Island (UHI) mitigation, and municipal asset resilience.
    """

    @property
    def role_name(self) -> str:
        return "urban_planner"

    @property
    def description(self) -> str:
        return "Provides urban flood risk modeling, peak rainfall window runoff analysis, drainage capacity surcharge triage, and Urban Heat Island (UHI) mitigation planning."

    async def get_role_context(self) -> Dict[str, Any]:
        return {
            "role": "urban_planner",
            "focus_areas": [
                "urban_flood_risk_modeling",
                "peak_rainfall_window_triage",
                "drainage_surcharge_and_runoff",
                "waterlogging_hotspots_management",
                "urban_heat_island_mitigation",
                "critical_infrastructure_exposure",
                "sustainable_urban_drainage",
            ],
            "visual_theme": "government_clean_slate_with_emerald_amber_accents",
            "environment": "municipal_corporation_planning_room",
        }

    async def generate_advice(
        self,
        intelligence: WeatherIntelligenceData,
        query: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes structured urban planning assessment from live telemetry.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude
        city = intelligence.location.city or intelligence.location.district or "Pune Urban Core"

        intel = await urban_planner_service.get_urban_intelligence(lat, lon, city)
        hotspots = await urban_planner_service.get_waterlogging_hotspots(city, intel.urban_flood_risk)
        heat_zones = await urban_planner_service.get_heat_island_zones(city, intel.surface_temperature_c - 5.0)
        infra = await urban_planner_service.get_infrastructure_exposure(city)

        return {
            "role": "urban_planner",
            "status": "ready",
            "urban_intelligence": intel.model_dump(),
            "waterlogging_hotspots": [h.model_dump() for h in hotspots],
            "heat_island_zones": [z.model_dump() for z in heat_zones],
            "infrastructure_exposure": [i.model_dump() for i in infra],
            "summary_recommendation": f"Urban Flood Risk: {intel.urban_flood_risk}. Peak Window: {intel.peak_rainfall_window} ({intel.peak_intensity_mmh} mm/h). Storm Surcharge: {intel.drainage_capacity_utilization_pct}%. UHI Thermal Delta: +{intel.urban_heat_island_delta_c}°C.",
        }

    async def generate_dashboard_insights(
        self,
        intelligence: WeatherIntelligenceData,
    ) -> Dict[str, Any]:
        """
        Generates structured insights for the live urban planner dashboard.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude
        city = intelligence.location.city or intelligence.location.district or "Pune Urban Core"

        intel = await urban_planner_service.get_urban_intelligence(lat, lon, city)

        return {
            "role": "urban_planner",
            "status": "ready",
            "hero": {
                "title": "🌆 URBAN WEATHER INTELLIGENCE",
                "flood_risk": intel.urban_flood_risk,
                "rainfall_24h": f"{intel.rainfall_24h_mm} mm",
                "peak_window": intel.peak_rainfall_window,
                "critical_infrastructure_risk_count": intel.critical_infrastructure_risk_count,
                "drainage_utilization": f"{intel.drainage_capacity_utilization_pct}%",
                "uhi_delta": f"+{intel.urban_heat_island_delta_c}°C",
                "surface_temp": f"{intel.surface_temperature_c}°C",
                "updated_at": intel.updated_at,
            },
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
        Synthesizes conversational responses grounded in verified urban weather telemetry.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude
        city = intelligence.location.city or intelligence.location.district or "Pune Urban Core"

        intel = await urban_planner_service.get_urban_intelligence(lat, lon, city)
        hotspots = await urban_planner_service.get_waterlogging_hotspots(city, intel.urban_flood_risk)

        grounded_context = f"""
[VERIFIED URBAN WEATHER INTELLIGENCE]
Location: {city} (Lat: {lat}, Lon: {lon})
Urban Flood Risk: {intel.urban_flood_risk}
24h Projected Rainfall: {intel.rainfall_24h_mm} mm
Peak Inundation Window: {intel.peak_rainfall_window} (Peak Intensity: {intel.peak_intensity_mmh} mm/h)
Rational Runoff Coefficient C: {intel.surface_runoff_coefficient}
Storm Drainage Utilization: {intel.drainage_capacity_utilization_pct}%
Urban Heat Island (UHI) Delta: +{intel.urban_heat_island_delta_c}°C
Surface Temperature: {intel.surface_temperature_c}°C
Heat Stress Rating: {intel.heat_stress_category}
Ventilation Index: {intel.air_ventilation_index}
Critical Infrastructure Zones at Risk: {intel.critical_infrastructure_risk_count}
Key Hotspots Monitored: {', '.join(h.hotspot_name for h in hotspots[:3])}
"""

        try:
            llm_response = await weather_chat_agent.generate_response(
                query=query,
                context_str=grounded_context,
                system_instruction=URBAN_PLANNER_SYSTEM_INSTRUCTION,
                chat_history=chat_history or [],
                language=language or "en",
            )
            return {
                "role": "urban_planner",
                "content": llm_response.get("content", ""),
                "sources": ["Municipal Hydrology Sensor Net", "Open-Meteo High-Resolution Ensemble"],
                "urban_intelligence": intel.model_dump(),
            }
        except Exception as e:
            logger.warning(f"UrbanAgent LLM synthesis failed, using deterministic template: {e}")
            fallback_text = (
                f"🌆 **Urban Planning & Infrastructure Briefing for {city}:**\n\n"
                f"- **Urban Flood Risk:** {intel.urban_flood_risk}\n"
                f"- **Rainfall Forecast:** {intel.rainfall_24h_mm} mm (Peak Window: {intel.peak_rainfall_window} @ {intel.peak_intensity_mmh} mm/h)\n"
                f"- **Drainage Surcharge Level:** {intel.drainage_capacity_utilization_pct}% capacity utilization\n"
                f"- **Urban Heat Island Delta:** +{intel.urban_heat_island_delta_c}°C (Surface Temp: {intel.surface_temperature_c}°C)\n"
                f"- **Critical Assets Monitored:** {intel.critical_infrastructure_risk_count} municipal infrastructure sectors\n\n"
                f"🔧 **Recommended Action:** Pre-deploy auxiliary dewatering pumps at underpasses before {intel.peak_rainfall_window}."
            )
            return {
                "role": "urban_planner",
                "content": fallback_text,
                "sources": ["Open-Meteo", "Municipal Hydrology Matrix"],
                "urban_intelligence": intel.model_dump(),
            }


urban_agent = UrbanAgent()
role_router.register("urban_planner", urban_agent)
role_router.register("urban", urban_agent)
role_router.register("planner", urban_agent)
role_router.register("infrastructure", urban_agent)
role_router.register("civil_engineer", urban_agent)
