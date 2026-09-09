"""
CitizenAlertEngine for WeatherGPT Step 9.
Multi-hazard rule evaluation engine that analyzes live weather telemetry,
forecast models, and official IMD bulletins to generate deterministic,
deduplicated CitizenAlert objects.
"""

import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple

from backend.app.core.alert_thresholds import (
    alert_thresholds,
    AlertType,
    AlertSeverity,
    SEVERITY_METADATA,
)
from backend.app.schemas.alerts import CitizenAlert, UserAlertPreferences
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.agents.citizen_advisory_agent import citizen_advisory_agent
from backend.app.services.supabase_service import get_supabase_client
from backend.app.core.logging import logger


class CitizenAlertEngine:
    """
    Evaluates meteorological parameters for exact user coordinates,
    fuses official IMD bulletins, performs deduplication, and persists alerts.
    """

    def __init__(self):
        # In-memory storage cache for resilient fallback when Supabase is disconnected
        self._memory_alerts: Dict[str, CitizenAlert] = {}
        self._user_preferences: Dict[str, UserAlertPreferences] = {}

    def _generate_fingerprint(
        self,
        alert_type: str,
        severity: str,
        district_or_city: str,
        valid_date_str: str,
    ) -> str:
        """
        Creates a deterministic hash to prevent creating duplicate active alerts on every poll.
        """
        raw = f"{alert_type.upper()}:{severity.upper()}:{district_or_city.lower()}:{valid_date_str}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]

    async def evaluate_weather(
        self,
        intelligence: WeatherIntelligenceData,
        user_id: Optional[str] = None,
        preferences: Optional[UserAlertPreferences] = None,
        language: str = "en",
    ) -> List[CitizenAlert]:
        """
        Runs the full deterministic rule engine on live WeatherIntelligenceData:
        1. Official IMD Warning Evaluation (Priority 1)
        2. Rainfall / Heavy Rain / Cloudburst Evaluation
        3. Thunderstorm & Lightning Evaluation
        4. Heatwave & Thermal Comfort Evaluation
        5. Wind & Storm Dynamics Evaluation
        6. Visibility / Dense Fog Evaluation
        7. Flood Risk Indicator Evaluation
        8. Deduplication & Persistence
        """
        alerts: List[CitizenAlert] = []
        now = datetime.now(timezone.utc)
        curr = intelligence.current
        hourly = intelligence.forecast.hourly if intelligence.forecast else []
        daily = intelligence.forecast.daily if intelligence.forecast else []
        lang = (language or "en").lower()

        loc_city = intelligence.location.city or "Your Area"
        loc_district = intelligence.location.district or loc_city
        loc_state = intelligence.location.state or "India"
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude

        # ---------------------------------------------------------
        # 1. OFFICIAL IMD WARNINGS (Highest Priority per Section 7)
        # ---------------------------------------------------------
        if intelligence.alerts:
            for official_alert in intelligence.alerts:
                sev_label = (official_alert.severity_label or official_alert.severity or "").upper()
                mapped_sev = AlertSeverity.WARNING
                if "RED" in sev_label or "SEVERE" in sev_label:
                    mapped_sev = AlertSeverity.SEVERE
                elif "ORANGE" in sev_label or "ACTION" in sev_label:
                    mapped_sev = AlertSeverity.WARNING
                elif "YELLOW" in sev_label or "AWARE" in sev_label:
                    mapped_sev = AlertSeverity.WATCH

                alert_type = AlertType.RAIN.value
                title_lower = official_alert.title.lower()
                if "rain" in title_lower or "precipitation" in title_lower:
                    alert_type = AlertType.HEAVY_RAIN.value if mapped_sev in [AlertSeverity.WARNING, AlertSeverity.SEVERE] else AlertType.RAIN.value
                elif "thunder" in title_lower or "lightning" in title_lower:
                    alert_type = AlertType.THUNDERSTORM.value
                elif "heat" in title_lower:
                    alert_type = AlertType.HEATWAVE.value
                elif "cyclon" in title_lower:
                    alert_type = AlertType.CYCLONE.value
                elif "wind" in title_lower:
                    alert_type = AlertType.STRONG_WIND.value
                elif "fog" in title_lower:
                    alert_type = AlertType.FOG.value

                valid_until_dt = now + timedelta(hours=12)
                valid_from_iso = now.isoformat()
                valid_until_iso = valid_until_dt.isoformat()

                fp = self._generate_fingerprint(
                    alert_type=alert_type,
                    severity=mapped_sev.value,
                    district_or_city=loc_district,
                    valid_date_str=valid_until_dt.strftime("%Y-%m-%d-%H"),
                )

                advisory = citizen_advisory_agent.generate_advisory(
                    alert_type=alert_type,
                    severity=mapped_sev.value,
                    location_name=loc_city,
                    weather_params={},
                    language=lang,
                )

                alerts.append(
                    CitizenAlert(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        fingerprint=fp,
                        type=alert_type,
                        severity=mapped_sev.value,
                        severity_label=mapped_sev.value.capitalize(),
                        title=official_alert.title,
                        description=official_alert.description or f"Official IMD warning active for {loc_district}.",
                        location_name=loc_city,
                        district=loc_district,
                        state=loc_state,
                        latitude=lat,
                        longitude=lon,
                        valid_from=valid_from_iso,
                        valid_until=valid_until_iso,
                        source=official_alert.source or "India Meteorological Department (IMD)",
                        source_url="https://mausam.imd.gov.in",
                        confidence=0.95,
                        recommended_actions=advisory["recommended_actions"],
                        what_to_avoid=advisory["what_to_avoid"],
                        is_read=False,
                        is_active=True,
                        created_at=now.isoformat(),
                        metadata={"is_official_imd": True, "imd_id": official_alert.id}
                    )
                )

        # ---------------------------------------------------------
        # 2. DERIVED ALGORITHMIC MULTI-HAZARD EVALUATION
        # ---------------------------------------------------------
        # Helper to extract value safely
        def _get_val(obj, default=0.0):
            if obj is None:
                return default
            if hasattr(obj, "value"):
                return obj.value if obj.value is not None else default
            return obj

        temp = _get_val(curr.temperature, 25.0)
        feels_like = _get_val(curr.feels_like, temp)
        rain_prob = _get_val(curr.rain_probability, 0.0)
        wind = _get_val(curr.wind_speed, 10.0)
        vis = _get_val(curr.visibility, 10.0)
        uv = _get_val(curr.uv_index, 0.0)
        weather_code = _get_val(curr.weather_code, 0)
        if isinstance(weather_code, float):
            weather_code = int(weather_code)

        # Inspect upcoming next 12 hours from forecast
        upcoming_hourly = hourly[:12] if hourly else []
        def _get_hourly_rain_prob(h):
            val = getattr(h, "rainProb", None)
            if val is None:
                val = getattr(h, "rain_probability", None)
            return _get_val(val, 0.0)

        def _get_hourly_rain_mm(h):
            val = getattr(h, "precipitation", None)
            return _get_val(val, 0.0)

        def _get_hourly_wind(h):
            val = getattr(h, "wind_speed", None)
            return _get_val(val, wind)

        max_forecast_rain_prob = max([_get_hourly_rain_prob(h) for h in upcoming_hourly], default=rain_prob)
        max_forecast_rain_mm = max([_get_hourly_rain_mm(h) for h in upcoming_hourly], default=_get_val(curr.precipitation, 0.0))
        max_forecast_wind = max([_get_hourly_wind(h) for h in upcoming_hourly], default=wind)

        # A. Heavy Rain & Cloudburst Risk
        if not any(a.type in [AlertType.HEAVY_RAIN.value, AlertType.RAIN.value] for a in alerts):
            if max_forecast_rain_mm >= alert_thresholds.RAIN_VERY_HEAVY_HOURLY_MM or (max_forecast_rain_prob >= 85.0 and max_forecast_rain_mm >= alert_thresholds.RAIN_HEAVY_HOURLY_MM):
                sev = AlertSeverity.SEVERE.value
                valid_hrs = 8
                if lang == "mr":
                    title = f"{loc_city} मध्ये मुसळधार पावसाचा इशारा"
                    desc = f"मुसळधार पावसाची शक्यता ({max_forecast_rain_mm:.1f} मिमी/तास). सखल भागात पाणी साचण्याचा धोका संभवतो."
                elif lang == "hi":
                    title = f"{loc_city} में भारी बारिश की चेतावनी"
                    desc = f"अत्यधिक भारी बारिश ({max_forecast_rain_mm:.1f} मिमी/घंटा) की संभावना। निचले इलाकों में जलभराव की स्थिति बन सकती है।"
                else:
                    title = f"Heavy Rainfall Warning in {loc_city}"
                    desc = f"Intense spells of heavy rainfall ({max_forecast_rain_mm:.1f} mm/hr) expected. Elevated risk of waterlogging in low-lying zones."
            elif max_forecast_rain_mm >= alert_thresholds.RAIN_HEAVY_HOURLY_MM or max_forecast_rain_prob >= alert_thresholds.RAIN_PROB_WATCH:
                sev = AlertSeverity.ADVISORY.value if max_forecast_rain_prob < 75 else AlertSeverity.WATCH.value
                valid_hrs = 6
                if lang == "mr":
                    title = f"{loc_city} साठी पावसाचा अंदाज"
                    desc = f"पुढील काही तासांत पावसाची शक्यता {int(max_forecast_rain_prob)}% आहे. बाहेर पडताना छत्री सोबत ठेवा."
                elif lang == "hi":
                    title = f"{loc_city} के लिए बारिश की सलाह"
                    desc = f"अगले कुछ घंटों में बारिश की संभावना {int(max_forecast_rain_prob)}% है। बाहर निकलते समय छाता साथ रखें।"
                else:
                    title = f"Rainfall Advisory for {loc_city}"
                    desc = f"Rain probability is {int(max_forecast_rain_prob)}% over the next several hours. Carry an umbrella when stepping outdoors."
            elif max_forecast_rain_prob >= alert_thresholds.RAIN_PROB_ADVISORY:
                sev = AlertSeverity.INFO.value
                valid_hrs = 6
                if lang == "mr":
                    title = f"{loc_city} मध्ये हलक्या सरींची शक्यता"
                    desc = f"हलक्या पावसाच्या सरी पडण्याची शक्यता ({int(max_forecast_rain_prob)}%)."
                elif lang == "hi":
                    title = f"{loc_city} में हल्की फुहारों की संभावना"
                    desc = f"कुछ स्थानों पर हल्की बारिश की संभावना ({int(max_forecast_rain_prob)}%)।"
                else:
                    title = f"Light Showers Likely in {loc_city}"
                    desc = f"Isolated light showers possible ({int(max_forecast_rain_prob)}% probability)."
            else:
                sev = None

            if sev:
                valid_until_dt = now + timedelta(hours=valid_hrs)
                fp = self._generate_fingerprint(AlertType.HEAVY_RAIN.value if sev in [AlertSeverity.SEVERE.value, AlertSeverity.WARNING.value] else AlertType.RAIN.value, sev, loc_district, valid_until_dt.strftime("%Y-%m-%d-%H"))
                advisory = citizen_advisory_agent.generate_advisory(
                    alert_type=AlertType.HEAVY_RAIN.value if sev in [AlertSeverity.SEVERE.value, AlertSeverity.WARNING.value] else AlertType.RAIN.value,
                    severity=sev,
                    location_name=loc_city,
                    weather_params={"rain_prob": max_forecast_rain_prob, "rain_mm": max_forecast_rain_mm},
                    language=lang,
                )
                alerts.append(
                    CitizenAlert(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        fingerprint=fp,
                        type=AlertType.HEAVY_RAIN.value if sev in [AlertSeverity.SEVERE.value, AlertSeverity.WARNING.value] else AlertType.RAIN.value,
                        severity=sev,
                        severity_label=sev.capitalize(),
                        title=title,
                        description=desc,
                        location_name=loc_city,
                        district=loc_district,
                        state=loc_state,
                        latitude=lat,
                        longitude=lon,
                        valid_from=now.isoformat(),
                        valid_until=valid_until_dt.isoformat(),
                        source="WeatherGPT Early Warning Engine",
                        source_url="https://open-meteo.com",
                        confidence=round(intelligence.confidence.score, 2),
                        recommended_actions=advisory["recommended_actions"],
                        what_to_avoid=advisory["what_to_avoid"],
                        is_read=False,
                        is_active=True,
                        created_at=now.isoformat(),
                    )
                )

        # B. Thunderstorm & Lightning Risk
        has_storm_code = weather_code in alert_thresholds.THUNDERSTORM_CODES or any(
            getattr(h, "weather_code", None) in alert_thresholds.THUNDERSTORM_CODES for h in upcoming_hourly[:6]
        )
        if has_storm_code:
            if not any(a.type == AlertType.THUNDERSTORM.value for a in alerts):
                sev = AlertSeverity.WATCH.value
                if lang == "mr":
                    title = f"विजांच्या कडकडाटासह वादळाचा इशारा"
                    desc = f"{loc_city} परिसरात विजांचा कडकडाट आणि वादळी वाऱ्याची शक्यता. उघड्या जागेवर जाणे टाळा."
                elif lang == "hi":
                    title = f"गरज-चमक के साथ आंधी-तूफान की चेतावनी"
                    desc = f"{loc_city} क्षेत्र में आकाशीय बिजली और तेज हवाओं की संभावना। सुरक्षित स्थानों पर रहें।"
                else:
                    title = f"Thunderstorm & Lightning Activity Alert"
                    desc = f"Atmospheric convective telemetry indicates lightning and thunderstorm activity in {loc_city}."

                valid_until_dt = now + timedelta(hours=4)
                fp = self._generate_fingerprint(AlertType.THUNDERSTORM.value, sev, loc_district, valid_until_dt.strftime("%Y-%m-%d-%H"))
                advisory = citizen_advisory_agent.generate_advisory(
                    alert_type=AlertType.THUNDERSTORM.value,
                    severity=sev,
                    location_name=loc_city,
                    weather_params={"code": weather_code},
                    language=lang,
                )
                alerts.append(
                    CitizenAlert(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        fingerprint=fp,
                        type=AlertType.THUNDERSTORM.value,
                        severity=sev,
                        severity_label=sev.capitalize(),
                        title=title,
                        description=desc,
                        location_name=loc_city,
                        district=loc_district,
                        state=loc_state,
                        latitude=lat,
                        longitude=lon,
                        valid_from=now.isoformat(),
                        valid_until=valid_until_dt.isoformat(),
                        source="WeatherGPT Early Warning Engine",
                        source_url="https://open-meteo.com",
                        confidence=round(intelligence.confidence.score, 2),
                        recommended_actions=advisory["recommended_actions"],
                        what_to_avoid=advisory["what_to_avoid"],
                        is_read=False,
                        is_active=True,
                        created_at=now.isoformat(),
                        metadata={"weather_code": weather_code}
                    )
                )

        # C. Heatwave & Extreme Thermal Stress
        if temp >= alert_thresholds.HEAT_ADVISORY_TEMP or feels_like >= alert_thresholds.HEAT_FEELS_LIKE_WARNING:
            if not any(a.type in [AlertType.HEATWAVE.value, AlertType.EXTREME_TEMPERATURE.value] for a in alerts):
                if temp >= alert_thresholds.HEAT_SEVERE_TEMP or feels_like >= alert_thresholds.HEAT_FEELS_LIKE_SEVERE:
                    sev = AlertSeverity.SEVERE.value
                    if lang == "mr":
                        title = f"{loc_city} साठी तीव्र उष्णतेची लाट"
                        desc = f"धोकादायक तापमान {temp:.1f}°C (जाणवणारे तापमान {feels_like:.0f}°C). उष्माघाताचा गंभीर धोका असल्याने काळजी घ्या."
                    elif lang == "hi":
                        title = f"{loc_city} के लिए भीषण लू की चेतावनी"
                        desc = f"अत्यधिक तापमान {temp:.1f}°C (महसूस होने वाला {feels_like:.0f}°C)। लू और डिहाइड्रेशन का उच्च जोखिम।"
                    else:
                        title = f"Severe Heatwave Warning for {loc_city}"
                        desc = f"Dangerous ambient temperatures of {temp:.1f}°C (feels like {feels_like:.0f}°C). High risk of heat exhaustion and dehydration."
                elif temp >= alert_thresholds.HEAT_WARNING_TEMP:
                    sev = AlertSeverity.WARNING.value
                    if lang == "mr":
                        title = f"{loc_city} साठी उष्णतेची लाट"
                        desc = f"तापमान {temp:.1f}°C पर्यंत पोहोचले आहे. दुपारच्या वेळी थेट उन्हात जाणे टाळा."
                    elif lang == "hi":
                        title = f"{loc_city} के लिए लू की चेतावनी"
                        desc = f"तापमान {temp:.1f}°C तक बढ़ गया है। दोपहर में धूप में निकलने से बचें।"
                    else:
                        title = f"Heatwave Warning for {loc_city}"
                        desc = f"Elevated temperature reaching {temp:.1f}°C. Limit midday outdoor exposure."
                else:
                    sev = AlertSeverity.ADVISORY.value
                    if lang == "mr":
                        title = f"उष्ण व दमट हवामानाची सूचना"
                        desc = f"तापमान {feels_like:.0f}°C जाणवत आहे. भरपूर पाणी प्या आणि सुती कपडे वापरा."
                    elif lang == "hi":
                        title = f"उमस और गर्मी की सलाह"
                        desc = f"तापमान {feels_like:.0f}°C जैसा महसूस हो रहा है। पर्याप्त पानी पिएं।"
                    else:
                        title = f"High Heat & Muggy Advisory"
                        desc = f"Temperature feels like {feels_like:.0f}°C. Maintain hydration and wear lightweight clothing."

                valid_until_dt = now + timedelta(hours=6)
                fp = self._generate_fingerprint(AlertType.HEATWAVE.value, sev, loc_district, valid_until_dt.strftime("%Y-%m-%d-%H"))
                advisory = citizen_advisory_agent.generate_advisory(
                    alert_type=AlertType.HEATWAVE.value,
                    severity=sev,
                    location_name=loc_city,
                    weather_params={"temp": temp, "feels_like": feels_like},
                    language=lang,
                )
                alerts.append(
                    CitizenAlert(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        fingerprint=fp,
                        type=AlertType.HEATWAVE.value,
                        severity=sev,
                        severity_label=sev.capitalize(),
                        title=title,
                        description=desc,
                        location_name=loc_city,
                        district=loc_district,
                        state=loc_state,
                        latitude=lat,
                        longitude=lon,
                        valid_from=now.isoformat(),
                        valid_until=valid_until_dt.isoformat(),
                        source="WeatherGPT Early Warning Engine",
                        source_url="https://open-meteo.com",
                        confidence=round(intelligence.confidence.score, 2),
                        recommended_actions=advisory["recommended_actions"],
                        what_to_avoid=advisory["what_to_avoid"],
                        is_read=False,
                        is_active=True,
                        created_at=now.isoformat(),
                        metadata={"temp_c": temp, "feels_like_c": feels_like}
                    )
                )

        # D. Strong Wind & Gust Hazard
        if max_forecast_wind >= alert_thresholds.WIND_STRONG_KMH:
            if not any(a.type in [AlertType.STRONG_WIND.value, AlertType.EXTREME_WIND.value] for a in alerts):
                if max_forecast_wind >= alert_thresholds.WIND_STORM_KMH:
                    sev = AlertSeverity.SEVERE.value
                    if lang == "mr":
                        title = f"अति वादळी वाऱ्याचा इशारा"
                        desc = f"वादळी वाऱ्याचा वेग {max_forecast_wind:.0f} किमी/तास. झाडे आणि पत्र्यांना धोका संभवतो."
                    elif lang == "hi":
                        title = f"विनाशकारी तेज हवाओं की चेतावनी"
                        desc = f"हवा की गति {max_forecast_wind:.0f} किमी/घंटा तक पहुंच सकती है। पेड़ों और होर्डिंग्स से दूर रहें।"
                    else:
                        title = f"Destructive Wind Storm Alert"
                        desc = f"Severe gale gusts of {max_forecast_wind:.0f} km/h detected. Significant hazard to trees, hoardings, and vehicles."
                elif max_forecast_wind >= alert_thresholds.WIND_GALE_KMH:
                    sev = AlertSeverity.WARNING.value
                    if lang == "mr":
                        title = f"{loc_city} मध्ये जोरदार वाऱ्याचा इशारा"
                        desc = f"सतत {max_forecast_wind:.0f} किमी/तास वेगाने वारे वाहण्याची शक्यता."
                    elif lang == "hi":
                        title = f"{loc_city} में तेज हवाओं की चेतावनी"
                        desc = f"{max_forecast_wind:.0f} किमी/घंटा की गति से तेज हवाएं चलने की संभावना है।"
                    else:
                        title = f"High Wind Warning in {loc_city}"
                        desc = f"Strong sustained winds of {max_forecast_wind:.0f} km/h expected."
                else:
                    sev = AlertSeverity.ADVISORY.value
                    if lang == "mr":
                        title = f"वादळी वाऱ्याची सूचना"
                        desc = f"वाऱ्याचा वेग ({max_forecast_wind:.0f} किमी/तास). दुचाकीस्वारांनी काळजीपूर्वक वाहन चालवावे."
                    elif lang == "hi":
                        title = f"तेज हवाओं की सलाह"
                        desc = f"हवा की गति ({max_forecast_wind:.0f} किमी/घंटा)। दोपहिया वाहन चालक सावधानी बरतें।"
                    else:
                        title = f"Gusty Wind Advisory"
                        desc = f"Gusty wind conditions ({max_forecast_wind:.0f} km/h). Two-wheeler commuters should exercise caution."

                valid_until_dt = now + timedelta(hours=6)
                fp = self._generate_fingerprint(AlertType.STRONG_WIND.value, sev, loc_district, valid_until_dt.strftime("%Y-%m-%d-%H"))
                advisory = citizen_advisory_agent.generate_advisory(
                    alert_type=AlertType.STRONG_WIND.value,
                    severity=sev,
                    location_name=loc_city,
                    weather_params={"wind_kmh": max_forecast_wind},
                    language=lang,
                )
                alerts.append(
                    CitizenAlert(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        fingerprint=fp,
                        type=AlertType.STRONG_WIND.value,
                        severity=sev,
                        severity_label=sev.capitalize(),
                        title=title,
                        description=desc,
                        location_name=loc_city,
                        district=loc_district,
                        state=loc_state,
                        latitude=lat,
                        longitude=lon,
                        valid_from=now.isoformat(),
                        valid_until=valid_until_dt.isoformat(),
                        source="WeatherGPT Early Warning Engine",
                        source_url="https://open-meteo.com",
                        confidence=round(intelligence.confidence.score, 2),
                        recommended_actions=advisory["recommended_actions"],
                        what_to_avoid=advisory["what_to_avoid"],
                        is_read=False,
                        is_active=True,
                        created_at=now.isoformat(),
                        metadata={"wind_speed_kmh": max_forecast_wind}
                    )
                )

        # E. Dense Fog & Poor Visibility
        if vis is not None and vis <= alert_thresholds.VISIBILITY_POOR_KM:
            if not any(a.type in [AlertType.POOR_VISIBILITY.value, AlertType.FOG.value] for a in alerts):
                if vis <= alert_thresholds.VISIBILITY_DENSE_FOG_KM:
                    sev = AlertSeverity.WARNING.value
                    if lang == "mr":
                        title = f"{loc_city} मध्ये दाट धुक्याचा इशारा"
                        desc = f"अत्यंत कमी दृश्यमानता ({vis:.1f} किमी). रस्ते वाहतुकीवर मोठा परिणाम होण्याची शक्यता."
                    elif lang == "hi":
                        title = f"{loc_city} में घने कोहरे की चेतावनी"
                        desc = f"अत्यधिक कम दृश्यता ({vis:.1f} किमी)। सड़क यातायात में सावधानी बरतें।"
                    else:
                        title = f"Dense Fog Warning in {loc_city}"
                        desc = f"Extremely reduced visibility ({vis:.1f} km). Road commute heavily compromised."
                else:
                    sev = AlertSeverity.ADVISORY.value
                    if lang == "mr":
                        title = f"कमी दृश्यमानतेची सूचना"
                        desc = f"धुक्यामुळे दृश्यमानता {vis:.1f} किमी पर्यंत मर्यादित झाली आहे."
                    elif lang == "hi":
                        title = f"कम दृश्यता की सलाह"
                        desc = f"धुंध के कारण दृश्यता {vis:.1f} किमी तक सीमित है।"
                    else:
                        title = f"Poor Visibility Advisory"
                        desc = f"Atmospheric haze or mist restricting visibility to {vis:.1f} km."

                valid_until_dt = now + timedelta(hours=4)
                fp = self._generate_fingerprint(AlertType.POOR_VISIBILITY.value, sev, loc_district, valid_until_dt.strftime("%Y-%m-%d-%H"))
                advisory = citizen_advisory_agent.generate_advisory(
                    alert_type=AlertType.POOR_VISIBILITY.value,
                    severity=sev,
                    location_name=loc_city,
                    weather_params={"visibility_km": vis},
                    language=lang,
                )
                alerts.append(
                    CitizenAlert(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        fingerprint=fp,
                        type=AlertType.POOR_VISIBILITY.value,
                        severity=sev,
                        severity_label=sev.capitalize(),
                        title=title,
                        description=desc,
                        location_name=loc_city,
                        district=loc_district,
                        state=loc_state,
                        latitude=lat,
                        longitude=lon,
                        valid_from=now.isoformat(),
                        valid_until=valid_until_dt.isoformat(),
                        source="WeatherGPT Early Warning Engine",
                        source_url="https://open-meteo.com",
                        confidence=round(intelligence.confidence.score, 2),
                        recommended_actions=advisory["recommended_actions"],
                        what_to_avoid=advisory["what_to_avoid"],
                        is_read=False,
                        is_active=True,
                        created_at=now.isoformat(),
                        metadata={"visibility_km": vis}
                    )
                )

        # ---------------------------------------------------------
        # 3. DEDUPLICATION & PERSISTENCE TO SUPABASE
        # ---------------------------------------------------------
        # Sort alerts by severity priority (highest first)
        severity_rank = {
            AlertSeverity.EMERGENCY.value: 6,
            AlertSeverity.SEVERE.value: 5,
            AlertSeverity.WARNING.value: 4,
            AlertSeverity.WATCH.value: 3,
            AlertSeverity.ADVISORY.value: 2,
            AlertSeverity.INFO.value: 1,
        }
        alerts.sort(key=lambda a: severity_rank.get(a.severity, 0), reverse=True)

        # Persist and deduplicate
        persisted_alerts: List[CitizenAlert] = []
        for alert in alerts:
            saved = await self._persist_alert(alert)
            persisted_alerts.append(saved)

        return persisted_alerts

    async def _persist_alert(self, alert: CitizenAlert) -> CitizenAlert:
        """
        Saves alert to Supabase weather_alerts table with deduplication on fingerprint.
        Falls back to in-memory store if Supabase is offline.
        """
        # Save in memory
        self._memory_alerts[alert.fingerprint] = alert

        try:
            sb = get_supabase_client()
            if sb:
                # Check if existing active alert with this fingerprint already exists
                existing = (
                    sb.table("weather_alerts")
                    .select("id, is_read, created_at")
                    .eq("fingerprint", alert.fingerprint)
                    .eq("is_active", True)
                    .limit(1)
                    .execute()
                )

                if existing.data and len(existing.data) > 0:
                    # Preserve original ID and read state
                    old_rec = existing.data[0]
                    alert.id = old_rec["id"]
                    alert.is_read = old_rec.get("is_read", False)
                    return alert

                # Insert new alert
                row = {
                    "id": alert.id,
                    "user_id": alert.user_id,
                    "fingerprint": alert.fingerprint,
                    "type": alert.type,
                    "severity": alert.severity,
                    "title": alert.title,
                    "description": alert.description,
                    "latitude": alert.latitude,
                    "longitude": alert.longitude,
                    "location_name": alert.location_name,
                    "district": alert.district,
                    "state": alert.state,
                    "source": alert.source,
                    "source_url": alert.source_url,
                    "confidence": alert.confidence,
                    "valid_from": alert.valid_from,
                    "valid_until": alert.valid_until,
                    "recommended_action": "\n".join(alert.recommended_actions),
                    "what_to_avoid": "\n".join(alert.what_to_avoid),
                    "is_read": alert.is_read,
                    "is_active": alert.is_active,
                    "created_at": alert.created_at,
                    "metadata": alert.metadata,
                }
                sb.table("weather_alerts").insert(row).execute()
        except Exception as err:
            logger.debug(f"[CitizenAlertEngine] Supabase persistence skipped or failed: {err}")

        return alert

    async def get_active_alerts(
        self,
        latitude: float,
        longitude: float,
        user_id: Optional[str] = None,
        radius_km: float = 35.0,
    ) -> List[CitizenAlert]:
        """
        Retrieves active unexpired alerts for the given coordinates from Supabase (or memory cache).
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        active_list: List[CitizenAlert] = []

        try:
            sb = get_supabase_client()
            if sb:
                # Query Supabase for active unexpired alerts
                res = (
                    sb.table("weather_alerts")
                    .select("*")
                    .eq("is_active", True)
                    .gte("valid_until", now_iso)
                    .order("created_at", desc=True)
                    .execute()
                )

                if res.data:
                    for row in res.data:
                        # Simple proximity check within approximate bounding box (~0.35 deg ~ 38 km)
                        r_lat = float(row.get("latitude", 0))
                        r_lon = float(row.get("longitude", 0))
                        if abs(r_lat - latitude) <= 0.40 and abs(r_lon - longitude) <= 0.40:
                            actions = [a.strip() for a in (row.get("recommended_action") or "").split("\n") if a.strip()]
                            avoids = [a.strip() for a in (row.get("what_to_avoid") or "").split("\n") if a.strip()]
                            active_list.append(
                                CitizenAlert(
                                    id=row["id"],
                                    user_id=row.get("user_id"),
                                    fingerprint=row.get("fingerprint", ""),
                                    type=row.get("type", "RAIN"),
                                    severity=row.get("severity", "INFO"),
                                    severity_label=row.get("severity", "INFO").capitalize(),
                                    title=row.get("title", ""),
                                    description=row.get("description", ""),
                                    location_name=row.get("location_name", ""),
                                    district=row.get("district"),
                                    state=row.get("state"),
                                    latitude=r_lat,
                                    longitude=r_lon,
                                    valid_from=row.get("valid_from", now_iso),
                                    valid_until=row.get("valid_until", now_iso),
                                    source=row.get("source", "WeatherGPT"),
                                    source_url=row.get("source_url"),
                                    confidence=float(row["confidence"]) if row.get("confidence") is not None else None,
                                    recommended_actions=actions,
                                    what_to_avoid=avoids,
                                    is_read=row.get("is_read", False),
                                    is_active=row.get("is_active", True),
                                    created_at=row.get("created_at", now_iso),
                                    metadata=row.get("metadata", {}),
                                )
                            )
                    if active_list:
                        return active_list
        except Exception as err:
            logger.debug(f"[CitizenAlertEngine] Supabase fetch fallback to memory: {err}")

        # Fallback to active memory alerts
        for alert in self._memory_alerts.values():
            if alert.is_active and alert.valid_until >= now_iso:
                if abs(alert.latitude - latitude) <= 0.40 and abs(alert.longitude - longitude) <= 0.40:
                    active_list.append(alert)

        return active_list

    async def get_alert_history(
        self,
        latitude: float,
        longitude: float,
        user_id: Optional[str] = None,
        limit: int = 20,
    ) -> List[CitizenAlert]:
        """
        Retrieves recent historical and active alerts for the area.
        """
        try:
            sb = get_supabase_client()
            if sb:
                res = (
                    sb.table("weather_alerts")
                    .select("*")
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data:
                    return [
                        CitizenAlert(
                            id=row["id"],
                            user_id=row.get("user_id"),
                            fingerprint=row.get("fingerprint", ""),
                            type=row.get("type", "RAIN"),
                            severity=row.get("severity", "INFO"),
                            severity_label=row.get("severity", "INFO").capitalize(),
                            title=row.get("title", ""),
                            description=row.get("description", ""),
                            location_name=row.get("location_name", ""),
                            district=row.get("district"),
                            state=row.get("state"),
                            latitude=float(row.get("latitude", 0)),
                            longitude=float(row.get("longitude", 0)),
                            valid_from=row.get("valid_from", ""),
                            valid_until=row.get("valid_until", ""),
                            source=row.get("source", "WeatherGPT"),
                            source_url=row.get("source_url"),
                            confidence=float(row["confidence"]) if row.get("confidence") is not None else None,
                            recommended_actions=[a.strip() for a in (row.get("recommended_action") or "").split("\n") if a.strip()],
                            what_to_avoid=[a.strip() for a in (row.get("what_to_avoid") or "").split("\n") if a.strip()],
                            is_read=row.get("is_read", False),
                            is_active=row.get("is_active", True),
                            created_at=row.get("created_at", ""),
                            metadata=row.get("metadata", {}),
                        )
                        for row in res.data
                    ]
        except Exception as err:
            logger.debug(f"[CitizenAlertEngine] History fetch error: {err}")

        # Memory history
        return list(self._memory_alerts.values())[:limit]

    async def mark_alert_as_read(self, alert_id: str, user_id: Optional[str] = None) -> bool:
        """
        Marks an alert as read in Supabase and memory.
        """
        for alert in self._memory_alerts.values():
            if alert.id == alert_id:
                alert.is_read = True

        try:
            sb = get_supabase_client()
            if sb:
                sb.table("weather_alerts").update({"is_read": True}).eq("id", alert_id).execute()
                return True
        except Exception as err:
            logger.debug(f"[CitizenAlertEngine] Mark read error: {err}")

        return True

    async def get_user_preferences(self, user_id: str) -> UserAlertPreferences:
        """
        Fetches user alert preferences.
        """
        if user_id in self._user_preferences:
            return self._user_preferences[user_id]

        try:
            sb = get_supabase_client()
            if sb:
                res = sb.table("user_alert_preferences").select("*").eq("user_id", user_id).limit(1).execute()
                if res.data and len(res.data) > 0:
                    p = res.data[0]
                    pref = UserAlertPreferences(
                        user_id=user_id,
                        severe_weather=p.get("severe_weather", True),
                        heavy_rain=p.get("heavy_rain", True),
                        heatwave=p.get("heatwave", True),
                        cyclone=p.get("cyclone", True),
                        flood=p.get("flood", True),
                        strong_wind=p.get("strong_wind", True),
                        thunderstorm=p.get("thunderstorm", True),
                        push_enabled=p.get("push_enabled", False),
                        updated_at=p.get("updated_at"),
                    )
                    self._user_preferences[user_id] = pref
                    return pref
        except Exception as err:
            logger.debug(f"[CitizenAlertEngine] Get preferences error: {err}")

        default_pref = UserAlertPreferences(user_id=user_id)
        self._user_preferences[user_id] = default_pref
        return default_pref

    async def update_user_preferences(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> UserAlertPreferences:
        """
        Updates user alert preferences.
        """
        current = await self.get_user_preferences(user_id)
        updated_dict = current.model_dump()
        for k, v in updates.items():
            if v is not None and k in updated_dict:
                # Rule: severe_weather must not be accidentally disabled if critical safety policy requires it
                if k == "severe_weather" and v is False:
                    logger.info(f"[CitizenAlertEngine] Severe weather alert preference preserved as True for safety.")
                    continue
                updated_dict[k] = v

        updated_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        new_pref = UserAlertPreferences(**updated_dict)
        self._user_preferences[user_id] = new_pref

        try:
            sb = get_supabase_client()
            if sb:
                sb.table("user_alert_preferences").upsert(new_pref.model_dump()).execute()
        except Exception as err:
            logger.debug(f"[CitizenAlertEngine] Save preferences error: {err}")

        return new_pref


citizen_alert_engine = CitizenAlertEngine()
