"""
CitizenAgent for WeatherGPT Step 8.
Translates verified meteorological telemetry into everyday practical advice for general citizens.
"""
import logging
from typing import Dict, Any, List, Optional
from backend.app.agents.role_router import RoleAgent, role_router
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.agents.weather_chat_agent import weather_chat_agent

logger = logging.getLogger("citizen_agent")

CITIZEN_SYSTEM_INSTRUCTION = """You are WeatherGPT's Citizen Weather Intelligence Agent.

Your job is to explain verified meteorological information to ordinary citizens in simple, practical language.

Use ONLY the verified weather context provided by the WeatherGPT backend.

Never invent:
- temperature
- rainfall
- rain probability
- wind
- humidity
- visibility
- weather warnings
- locations
- forecast times

Never fabricate official government warnings.

Clearly distinguish:
1. Current observations
2. Forecasts
3. Official warnings
4. AI-generated recommendations

Use the user's actual location.
Give practical advice when appropriate (e.g. carrying an umbrella, commute safety, clothing, outdoor activities).
Do not unnecessarily list every weather parameter.
Answer the user's actual question first.
Never claim that the user is completely safe.
For severe weather, advise the user to follow official government and local authority instructions.
Respond in the user's preferred language."""


class CitizenAgent(RoleAgent):
    """
    Dedicated Citizen Weather Intelligence Agent.
    Specializes in everyday citizen advisories: outdoor activities, commute safety,
    clothing, umbrella requirements, and event planning.
    """

    @property
    def role_name(self) -> str:
        return "citizen"

    @property
    def description(self) -> str:
        return "Translates verified meteorological observations into actionable everyday citizen advisories."

    async def get_role_context(self) -> Dict[str, Any]:
        return {
            "role": "citizen",
            "focus_areas": [
                "outdoor_activities",
                "commute_safety",
                "clothing_advice",
                "umbrella_alerts",
                "heat_uv_protection",
                "event_planning"
            ],
            "theme": "blue",
            "environment": "urban"
        }

    async def generate_advice(
        self,
        intelligence: WeatherIntelligenceData,
        query: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate structured citizen-specific intelligence and recommendations."""
        insights = await self.generate_dashboard_insights(intelligence)
        return insights

    async def generate_dashboard_insights(
        self,
        intelligence: WeatherIntelligenceData,
    ) -> Dict[str, Any]:
        """
        Synthesizes dynamic, non-hardcoded Citizen dashboard intelligence cards:
        - Outdoor Plan (Umbrella, walking, outdoor activities)
        - Commute Safety (Visibility, roadway conditions, rain impact)
        - Weather Advice (UV, heat, hydration, clothing)
        - Official Warning (IMD-verified authoritative alert, if active)
        - Outdoor Suitability (GOOD / MODERATE / POOR for event planning)
        """
        curr = intelligence.current
        temp = curr.temperature.value if curr.temperature else 25.0
        feels_like = curr.feels_like.value if curr.feels_like else temp
        rain_prob = curr.rain_probability.value if curr.rain_probability else 0.0
        wind = curr.wind_speed.value if curr.wind_speed else 10.0
        vis = curr.visibility.value if curr.visibility else 10.0
        uv = curr.uv_index.value if curr.uv_index else 0.0
        humidity = curr.humidity.value if curr.humidity else 60.0
        condition = curr.condition or "Mainly Clear"
        city = intelligence.location.city or "your area"

        # Check daily forecast for upcoming rain if current rain prob is low
        forecast_rain_prob = rain_prob
        if intelligence.forecast and intelligence.forecast.daily:
            today_forecast = intelligence.forecast.daily[0]
            if today_forecast.rain_probability is not None:
                forecast_rain_prob = max(rain_prob, today_forecast.rain_probability)

        cards = []

        # 1. Official Weather Warning (Highest Priority)
        warning_data = None
        if intelligence.alerts and len(intelligence.alerts) > 0:
            top_alert = intelligence.alerts[0]
            warning_data = {
                "type": "official_warning",
                "title": "⚠️ OFFICIAL WEATHER WARNING",
                "area": top_alert.area or city,
                "severity": top_alert.severity_label or "WARNING",
                "source": top_alert.source or "IMD",
                "description": top_alert.description or top_alert.title,
                "instructions": "Follow official instructions from local authorities and disaster management.",
            }
            cards.append({
                "id": "official_warning",
                "category": "Official Warning",
                "icon": "AlertTriangle",
                "status": "critical",
                "title": "Official Weather Warning",
                "message": f"{top_alert.title}. Valid for {top_alert.area or city}. Source: {top_alert.source or 'IMD'}.",
                "priority": 1,
            })

        # 2. Outdoor Plan Card (Umbrella / Activity)
        outdoor_plan = None
        if forecast_rain_prob >= 40.0:
            msg = (
                f"Carry an umbrella today. Rain probability is around {int(forecast_rain_prob)}% in {city}."
                if forecast_rain_prob < 75
                else f"Showers are highly likely ({int(forecast_rain_prob)}% probability). Keep rain gear ready and plan outdoor activities accordingly."
            )
            outdoor_plan = {
                "type": "outdoor",
                "title": "Outdoor Plan",
                "severity": "warning" if forecast_rain_prob > 70 else "caution",
                "message": msg,
                "icon": "CloudRain"
            }
        elif temp >= 36.0:
            outdoor_plan = {
                "type": "outdoor",
                "title": "Outdoor Plan",
                "severity": "caution",
                "message": f"High temperatures of {temp:.1f}°C in {city}. Avoid strenuous midday outdoor activities.",
                "icon": "Sun"
            }
        else:
            outdoor_plan = {
                "type": "outdoor",
                "title": "Outdoor Plan",
                "severity": "good",
                "message": f"Favorable conditions for walking and outdoor plans in {city}. Skies are {condition.lower()}.",
                "icon": "CheckCircle2"
            }

        cards.append({
            "id": "outdoor_plan",
            "category": "Outdoor Plan",
            "icon": outdoor_plan["icon"],
            "status": outdoor_plan["severity"],
            "title": outdoor_plan["title"],
            "message": outdoor_plan["message"],
            "priority": 2,
        })

        # 3. Commute Safety Card
        commute_plan = None
        if vis < 3.0:
            commute_plan = {
                "type": "commute",
                "title": "Commute Safety",
                "severity": "critical" if vis < 1.0 else "warning",
                "message": f"Reduced visibility ({vis:.1f} km) due to {condition.lower()}. Drive with headlights and allow extra commute time.",
                "icon": "Eye"
            }
        elif forecast_rain_prob >= 50.0:
            commute_plan = {
                "type": "commute",
                "title": "Commute Safety",
                "severity": "warning",
                "message": "Wet road conditions and localized waterlogging may slow traffic during peak commute hours.",
                "icon": "Car"
            }
        elif wind >= 35.0:
            commute_plan = {
                "type": "commute",
                "title": "Commute Safety",
                "severity": "caution",
                "message": f"Strong crosswinds of {wind:.0f} km/h may affect two-wheelers and high-profile vehicles.",
                "icon": "Wind"
            }
        else:
            commute_plan = {
                "type": "commute",
                "title": "Commute Safety",
                "severity": "good",
                "message": "Clear roadway conditions. Normal travel times are expected across the city.",
                "icon": "Car"
            }

        cards.append({
            "id": "commute_safety",
            "category": "Commute Safety",
            "icon": commute_plan["icon"],
            "status": commute_plan["severity"],
            "title": commute_plan["title"],
            "message": commute_plan["message"],
            "priority": 3,
        })

        # 4. UV / Health & Clothing Advisory
        weather_advice = None
        if uv >= 6.0:
            weather_advice = {
                "type": "uv_health",
                "title": "UV Protection",
                "severity": "warning",
                "message": f"UV Index is elevated at {uv:.1f}. Apply SPF 30+ sunscreen and wear sunglasses between 11 AM and 3 PM.",
                "icon": "Sun"
            }
        elif humidity >= 85.0 and temp >= 28.0:
            weather_advice = {
                "type": "comfort",
                "title": "Muggy Comfort",
                "severity": "caution",
                "message": f"High humidity ({humidity:.0f}%) makes it feel like {feels_like:.0f}°C. Wear light, breathable cotton clothing and stay hydrated.",
                "icon": "Droplets"
            }
        elif temp <= 16.0:
            weather_advice = {
                "type": "clothing",
                "title": "Cool Weather",
                "severity": "good",
                "message": f"Brisk temperature of {temp:.1f}°C. A light jacket or sweater is recommended for early morning and evening.",
                "icon": "Shirt"
            }
        else:
            weather_advice = {
                "type": "weather_advice",
                "title": "Comfort Index",
                "severity": "good",
                "message": f"Comfortable atmospheric conditions. Temperature feels like {feels_like:.0f}°C with gentle breeze.",
                "icon": "Smile"
            }

        cards.append({
            "id": "weather_advice",
            "category": "Weather Advice",
            "icon": weather_advice["icon"],
            "status": weather_advice["severity"],
            "title": weather_advice["title"],
            "message": weather_advice["message"],
            "priority": 4,
        })

        # 5. Outdoor Suitability (Event Planning)
        # Evaluates suitability for weddings, picnics, walks, sports
        suitability_status = "GOOD"
        suitability_reasons = []
        if warning_data:
            suitability_status = "POOR"
            suitability_reasons.append("Active meteorological warning in effect")
        elif forecast_rain_prob >= 65.0:
            suitability_status = "POOR"
            suitability_reasons.append(f"Elevated rain probability ({int(forecast_rain_prob)}%)")
        elif forecast_rain_prob >= 35.0 or temp >= 36.0 or wind >= 30.0:
            suitability_status = "MODERATE"
            if forecast_rain_prob >= 35.0:
                suitability_reasons.append(f"Possibility of isolated showers ({int(forecast_rain_prob)}%)")
            if temp >= 36.0:
                suitability_reasons.append(f"Afternoon heat reaching {temp:.1f}°C")
            if wind >= 30.0:
                suitability_reasons.append(f"Gusty winds ({wind:.0f} km/h)")
        else:
            suitability_status = "GOOD"
            suitability_reasons.append(f"Clear skies, comfortable {temp:.1f}°C temperature, low rain risk")

        outdoor_suitability = {
            "status": suitability_status,
            "label": "WeatherGPT assessment",
            "reasons": suitability_reasons,
            "summary": f"Outdoor suitability is {suitability_status}: {', '.join(suitability_reasons)}."
        }

        return {
            "role": "citizen",
            "summary": f"Citizen intelligence for {city}: {outdoor_plan['message']}",
            "cards": cards,
            "outdoor_plan": outdoor_plan,
            "commute": commute_plan,
            "weather_advice": weather_advice,
            "warning": warning_data,
            "outdoor_suitability": outdoor_suitability,
            "sources": ["Open-Meteo", "IMD"],
            "updated_at": curr.observed_at,
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
        Invokes WeatherChatAgent with Citizen system instructions and anti-hallucination validation.
        """
        # Event planning query detection
        q_lower = query.lower()
        if any(w in q_lower for w in ["wedding", "picnic", "cricket", "event", "outdoor plan", "match", "party"]):
            insights = await self.generate_dashboard_insights(intelligence)
            suit = insights["outdoor_suitability"]
            extra_prompt_guidance = (
                f"\nSPECIAL USER QUERY: The user is asking about an outdoor event/suitability. "
                f"Incorporate the following verified WeatherGPT assessment: "
                f"Suitability: {suit['status']} (Label: WeatherGPT assessment). "
                f"Factors: {', '.join(suit['reasons'])}. Do NOT represent it as an official meteorological certification."
            )
            query = f"{query} {extra_prompt_guidance}"

        return await weather_chat_agent.generate_response(
            query=query,
            intelligence=intelligence,
            chat_history=chat_history,
            user_role="citizen",
            time_range=time_range,
            language=language,
        )


# Singleton Instance
citizen_agent = CitizenAgent()

# Register in global RoleRouter
role_router.register("citizen", citizen_agent)
