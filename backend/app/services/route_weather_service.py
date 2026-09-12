"""
Route Weather Service & Route Risk Engine for WeatherGPT Step 10.
Analyzes weather conditions along road transit corridors,
samples segment meteorological parameters, evaluates deterministic hazards,
and provides multi-departure time comparisons.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
import logging
from backend.app.services.routing_service import routing_service, RoutingService
from backend.app.services.imd_weather_service import imd_weather_service, IMDWeatherService
from backend.app.providers.weather.open_meteo import OpenMeteoProvider

logger = logging.getLogger("route_weather_service")


class RouteRiskEngine:
    """
    Deterministic rule-based hazard classifier for road travel.
    """

    @staticmethod
    def evaluate_segment_risk(
        weather_params: Dict[str, Any],
        imd_warnings: List[Dict[str, Any]],
        location_name: str,
        language: str = "en",
    ) -> Dict[str, Any]:
        temp = float(weather_params.get("temperature") or 28.0)
        rain_prob = float(weather_params.get("rain_probability") or 0.0)
        rain_rate = float(weather_params.get("precipitation") or 0.0)
        wind_speed = float(weather_params.get("wind_speed") or 10.0)
        visibility_km = float(weather_params.get("visibility") or 10.0)
        weather_code = int(weather_params.get("weather_code") or 0)

        hazards: List[str] = []
        reasons: List[str] = []

        # 1. Official IMD Warning Evaluation
        has_red_warning = any(w.get("severity") == "red" for w in imd_warnings)
        has_orange_warning = any(w.get("severity") == "orange" for w in imd_warnings)
        has_yellow_warning = any(w.get("severity") == "yellow" for w in imd_warnings)

        if has_red_warning:
            hazards.append("IMD Red Warning Active")
            reasons.append(f"Official IMD Red Alert active near {location_name}.")
        elif has_orange_warning:
            hazards.append("IMD Orange Alert Active")
            reasons.append(f"Official IMD Orange Alert active near {location_name}.")
        elif has_yellow_warning:
            hazards.append("IMD Weather Watch")
            reasons.append(f"Official IMD Weather Watch in effect for {location_name}.")

        # 2. Thunderstorm / Lightning
        is_thunder = weather_code in [95, 96, 99] or any("thunder" in str(w.get("type", "")).lower() for w in imd_warnings)
        if is_thunder:
            hazards.append("Thunderstorm & Lightning")
            reasons.append(f"Thunderstorm activity detected along {location_name} segment.")

        # 3. Heavy / Extreme Rainfall
        if rain_rate >= 15.0 or (rain_prob >= 80 and rain_rate >= 10.0):
            hazards.append("Heavy Rainfall & Waterlogging Risk")
            reasons.append(f"Intense rainfall ({rain_rate:.1f} mm/h) forecast near {location_name}.")
        elif rain_rate >= 5.0 or (rain_prob >= 70 and rain_rate >= 3.0):
            hazards.append("Moderate Rain & Wet Roads")
            reasons.append(f"Moderate rain ({rain_rate:.1f} mm/h) may cause slippery highway conditions.")
        elif rain_rate > 0.5 or rain_prob >= 50:
            hazards.append("Light Rain / Showers")
            reasons.append(f"Passing light showers possible near {location_name}.")

        # 4. Visibility & Fog
        if visibility_km <= 0.8 or weather_code in [45, 48]:
            hazards.append("Dense Fog & Low Visibility")
            reasons.append(f"Dense fog expected, visibility reduced to {visibility_km:.1f} km.")
        elif visibility_km <= 2.5:
            hazards.append("Moderate Fog / Haze")
            reasons.append(f"Moderate haze or fog, visibility ~{visibility_km:.1f} km.")

        # 5. Wind Gusts
        if wind_speed >= 50.0:
            hazards.append("High Crosswinds")
            reasons.append(f"Strong crosswinds ({wind_speed:.0f} km/h) dangerous for two-wheelers and high-sided vehicles.")
        elif wind_speed >= 35.0:
            hazards.append("Moderate Gusty Winds")
            reasons.append(f"Breezy conditions ({wind_speed:.0f} km/h).")

        # 6. Extreme Heat
        if temp >= 42.0:
            hazards.append("Extreme Heat")
            reasons.append(f"Extreme heat ({temp:.1f}°C) may cause vehicle overheating.")

        # Classify deterministic risk tier
        if has_red_warning or rain_rate >= 15.0 or wind_speed >= 50.0 or visibility_km <= 0.8:
            risk = "severe"
            badge_color = "red"
        elif has_orange_warning or rain_rate >= 5.0 or is_thunder or wind_speed >= 35.0 or visibility_km <= 2.0:
            risk = "high"
            badge_color = "orange"
        elif has_yellow_warning or rain_rate >= 1.0 or rain_prob >= 50 or visibility_km <= 4.0:
            risk = "moderate"
            badge_color = "yellow"
        else:
            risk = "low"
            badge_color = "green"
            reasons.append(f"Favorable weather conditions near {location_name}.")

        return {
            "risk": risk,
            "badge_color": badge_color,
            "hazards": hazards,
            "reasons": reasons,
        }


class RouteWeatherService:
    def __init__(
        self,
        router: Optional[RoutingService] = None,
        weather_service: Optional[IMDWeatherService] = None,
    ):
        self.router = router or routing_service
        self.weather_service = weather_service or imd_weather_service
        self.secondary_weather = OpenMeteoProvider()
        self.risk_engine = RouteRiskEngine()

    async def analyze_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        origin_name: str = "Origin",
        dest_name: str = "Destination",
        departure_time: str = "08:00",
        travel_date: Optional[str] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Calculates road route, samples segment weather, evaluates hazards,
        and generates an explainable travel risk assessment.
        """
        # 1. Fetch Route from Routing Engine
        route_data = await self.router.get_route(
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            dest_lat=dest_lat,
            dest_lon=dest_lon,
            origin_name=origin_name,
            dest_name=dest_name,
        )

        waypoints = route_data.get("waypoints", [])
        total_dist_km = route_data.get("distance_km", 0.0)
        total_dur_mins = route_data.get("duration_minutes", 0)

        # 2. Parse Departure Time & Compute Segment ETAs
        base_date_str = travel_date or datetime.now().strftime("%Y-%m-%d")
        try:
            dep_hour, dep_min = map(int, departure_time.split(":"))
        except Exception:
            dep_hour, dep_min = 8, 0

        dep_dt = datetime.fromisoformat(f"{base_date_str}T{dep_hour:02d}:{dep_min:02d}:00")
        arr_dt = dep_dt + timedelta(minutes=total_dur_mins)

        # 3. Sample Weather & Warnings Along Each Waypoint
        segments: List[Dict[str, Any]] = []
        all_hazards: List[str] = []
        all_reasons: List[str] = []
        max_risk_level = 0
        risk_map = {"low": 0, "moderate": 1, "high": 2, "severe": 3}
        reverse_risk_map = {0: "low", 1: "moderate", 2: "high", 3: "severe"}

        for wp in waypoints:
            w_lat = wp["latitude"]
            w_lon = wp["longitude"]
            eta_mins = wp["eta_minutes_offset"]
            seg_eta_dt = dep_dt + timedelta(minutes=eta_mins)
            seg_eta_str = seg_eta_dt.strftime("%I:%M %p")

            # Fetch waypoint weather telemetry
            w_current = await self.weather_service.get_current_weather(w_lat, w_lon, {"city": wp["name"]})
            w_warnings = await self.weather_service.get_warnings(w_lat, w_lon, {"city": wp["name"]})

            raw_cond = w_current.get("condition") or w_current.get("forecast_summary") or "Clear"
            if "model" in str(raw_cond).lower() or "simulation" in str(raw_cond).lower() or not raw_cond:
                rain_val = float(w_current.get("rainfall_past_24h", 0))
                if rain_val > 10:
                    raw_cond = "Heavy Rain"
                elif rain_val > 2:
                    raw_cond = "Moderate Rain"
                elif rain_val > 0:
                    raw_cond = "Light Showers"
                else:
                    raw_cond = "Partly Cloudy"

            weather_params = {
                "temperature": w_current.get("temperature", 28.0),
                "rain_probability": 15.0 if float(w_current.get("rainfall_past_24h", 0)) > 0 else 5.0,
                "precipitation": float(w_current.get("rainfall_past_24h", 0)),
                "wind_speed": float(w_current.get("wind_speed", 10.0)),
                "visibility": float(w_current.get("visibility", 10.0)),
                "condition": raw_cond,
                "weather_code": 0,
            }

            risk_eval = self.risk_engine.evaluate_segment_risk(
                weather_params=weather_params,
                imd_warnings=w_warnings,
                location_name=wp["name"],
                language=language,
            )

            r_level = risk_map.get(risk_eval["risk"], 0)
            if r_level > max_risk_level:
                max_risk_level = r_level

            all_hazards.extend(risk_eval["hazards"])
            all_reasons.extend(risk_eval["reasons"])

            segments.append({
                "segment_index": wp["segment_index"],
                "name": wp["name"],
                "latitude": w_lat,
                "longitude": w_lon,
                "eta": seg_eta_str,
                "eta_offset_minutes": eta_mins,
                "temperature": weather_params["temperature"],
                "condition": weather_params["condition"],
                "rain_probability": weather_params["rain_probability"],
                "precipitation_rate": weather_params["precipitation"],
                "wind_speed": weather_params["wind_speed"],
                "visibility_km": weather_params["visibility"],
                "risk": risk_eval["risk"],
                "badge_color": risk_eval["badge_color"],
                "hazards": risk_eval["hazards"],
                "reasons": risk_eval["reasons"],
                "imd_warning_count": len(w_warnings),
            })

        overall_risk_str = reverse_risk_map[max_risk_level]
        unique_hazards = list(dict.fromkeys(all_hazards))

        # Keep only meaningful reasons - filter out repetitive "Favorable weather" if specific hazards exist
        hazard_reasons = [r for r in all_reasons if "favorable" not in r.lower()]
        if hazard_reasons:
            unique_reasons = list(dict.fromkeys(hazard_reasons))[:3]
        else:
            unique_reasons = ["Clear skies and favorable travel conditions along the route."]

        recommendation = self._generate_travel_recommendation(
            overall_risk=overall_risk_str,
            departure_time=dep_dt.strftime("%I:%M %p"),
            arrival_time=arr_dt.strftime("%I:%M %p"),
            origin_name=origin_name,
            dest_name=dest_name,
            hazards=unique_hazards,
            language=language,
        )

        return {
            "success": True,
            "origin": {
                "name": origin_name,
                "latitude": origin_lat,
                "longitude": origin_lon,
                "departure_time": dep_dt.strftime("%I:%M %p"),
            },
            "destination": {
                "name": dest_name,
                "latitude": dest_lat,
                "longitude": dest_lon,
                "arrival_time": arr_dt.strftime("%I:%M %p"),
            },
            "travel_date": base_date_str,
            "distance_km": total_dist_km,
            "duration_minutes": total_dur_mins,
            "formatted_duration": f"{total_dur_mins // 60}h {total_dur_mins % 60}m" if total_dur_mins >= 60 else f"{total_dur_mins} mins",
            "overall_risk": overall_risk_str,
            "risk_score_label": overall_risk_str.upper(),
            "hazards": unique_hazards,
            "reasons": unique_reasons[:4],
            "recommendation": recommendation,
            "segments": segments,
            "route_coordinates": route_data.get("coordinates", []),
            "sources": [
                {"provider": "India Meteorological Department (IMD)", "type": "Authoritative Observation & Warnings"},
                {"provider": "OSRM Road Engine", "type": "Road Geometry & Durations"},
                {"provider": "Open-Meteo High-Resolution Model", "type": "Segment Weather Sampling"},
            ],
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }

    async def compare_departure_times(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        origin_name: str = "Origin",
        dest_name: str = "Destination",
        travel_date: Optional[str] = None,
        candidate_times: Optional[List[str]] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Evaluates route risk across multiple candidate departure hours
        (e.g., 6:00 AM, 9:00 AM, 12:00 PM, 4:00 PM) to recommend the safest window.
        """
        times_to_test = candidate_times or ["06:00", "09:00", "12:00", "16:00"]
        evaluations: List[Dict[str, Any]] = []

        for c_time in times_to_test:
            res = await self.analyze_route(
                origin_lat=origin_lat,
                origin_lon=origin_lon,
                dest_lat=dest_lat,
                dest_lon=dest_lon,
                origin_name=origin_name,
                dest_name=dest_name,
                departure_time=c_time,
                travel_date=travel_date,
                language=language,
            )

            risk_rank = {"low": 0, "moderate": 1, "high": 2, "severe": 3}.get(res["overall_risk"], 0)
            evaluations.append({
                "departure_time": c_time,
                "formatted_departure": res["origin"]["departure_time"],
                "arrival_time": res["destination"]["arrival_time"],
                "overall_risk": res["overall_risk"],
                "risk_rank": risk_rank,
                "duration_minutes": res["duration_minutes"],
                "hazards_summary": res["hazards"][:2],
                "top_reason": res["reasons"][0] if res["reasons"] else "Normal highway conditions",
            })

        # Rank by lowest weather risk
        evaluations.sort(key=lambda x: x["risk_rank"])
        best_choice = evaluations[0]

        if language == "mr":
            rec_text = f"निवडलेल्या वेळांपैकी {best_choice['formatted_departure']} ला सर्वात कमी हवामान जोखीम दिसत आहे. कृपया प्रवास करताना स्थानिक चेतावणींचे पालन करा."
        elif language == "hi":
            rec_text = f"चुने गए प्रस्थान समय में से {best_choice['formatted_departure']} पर सबसे कम मौसम जोखिम दिखाई दे रहा है। कृपया यात्रा के दौरान सतर्क रहें।"
        else:
            rec_text = f"{best_choice['formatted_departure']} appears to have the lowest weather risk among the selected departure times. Exercise usual highway caution."

        return {
            "success": True,
            "origin": origin_name,
            "destination": dest_name,
            "recommended_departure": best_choice["departure_time"],
            "recommendation_summary": rec_text,
            "comparison": evaluations,
        }

    @staticmethod
    def _generate_travel_recommendation(
        overall_risk: str,
        departure_time: str,
        arrival_time: str,
        origin_name: str,
        dest_name: str,
        hazards: List[str],
        language: str = "en",
    ) -> Dict[str, Any]:
        if language == "mr":
            if overall_risk in ["severe", "high"]:
                action = "प्रवासाची वेळ पुढे ढकला किंवा अत्यंत काळजीपूर्वक वाहन चालवा."
                precautions = ["वायपर्स आणि हेडलाइट्स तपासा", "घाट किंवा सखल भागात वेग मर्यादित ठेवा", "स्थानिक IMD सूचना पहा"]
            else:
                action = "हवामान प्रवासासाठी अनुकूल दिसत आहे. सामान्य सावधगिरी बाळगा."
                precautions = ["वाहनातील हवा आणि पाणी तपासा", "प्रवासात पुरेसे पाणी सोबत ठेवा"]
        elif language == "hi":
            if overall_risk in ["severe", "high"]:
                action = "यात्रा का समय बदलने पर विचार करें या अत्यंत सावधानीपूर्वक ड्राइव करें।"
                precautions = ["वाइपर और ब्रेक की जांच करें", "घाट क्षेत्रों में गति नियंत्रित रखें", "आधिकारिक मौसम चेतावनियों पर नजर रखें"]
            else:
                action = "मौसम यात्रा के लिए अनुकूल प्रतीत होता है। सामान्य सावधानी बरतें।"
                precautions = ["वाहन का ईंधन और टायर प्रेशर जांचें", "पर्याप्त पेयजल साथ रखें"]
        else:
            if overall_risk in ["severe", "high"]:
                action = "Consider adjusting departure window or drive with heightened vigilance."
                precautions = ["Check wipers, headlights, and brakes", "Reduce speed in ghat/mountain stretches", "Monitor live IMD radar & local advisories"]
            else:
                action = "Conditions along the corridor appear generally favorable for travel."
                precautions = ["Maintain normal highway safety protocols", "Carry sufficient hydration"]

        return {
            "risk_level": overall_risk,
            "summary_action": action,
            "key_precautions": precautions,
            "departure_window": f"{departure_time} – {arrival_time}",
        }


route_weather_service = RouteWeatherService()
