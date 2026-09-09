from typing import Dict, Any, Optional, List, Tuple
from backend.app.core.weather_thresholds import weather_thresholds, WeatherThresholds
from backend.app.schemas.weather_intelligence import ConfidenceAssessment

class ConfidenceService:
    """
    Confidence Evaluation & Conflict Detection Engine.
    Computes a transparent 0-100 algorithmic score indicating the
    robustness, completeness, freshness, and cross-provider agreement
    of meteorological telemetry.
    
    IMPORTANT: This is an application confidence indicator, not a weather probability.
    """

    def __init__(self, thresholds: Optional[WeatherThresholds] = None):
        self.t = thresholds or weather_thresholds

    def evaluate_confidence(
        self,
        open_meteo_current: Optional[Dict[str, Any]],
        imd_observation: Optional[Dict[str, Any]],
        open_meteo_available: bool,
        imd_available: bool,
        is_cached: bool = False,
        age_minutes: int = 0,
    ) -> ConfidenceAssessment:
        score = 50
        factors: List[str] = []
        conflict_warnings: List[str] = []
        agreement_level: str = "unverified"

        # 1. Base Provider Availability Scoring
        if open_meteo_available and imd_available:
            score += 25
            factors.append("Dual-provider telemetry active (Open-Meteo + IMD)")
        elif open_meteo_available:
            score += 15
            factors.append("Primary numerical model active (Open-Meteo)")
        elif imd_available:
            score += 15
            factors.append("Official meteorological observation active (IMD)")
        else:
            score = 10
            factors.append("No active providers responding")
            return ConfidenceAssessment(
                score=score,
                level="low",
                agreement_level="unverified",
                conflict_warnings=["Both meteorological providers currently unavailable"],
                factors=factors,
                note="WeatherGPT algorithmic data confidence score"
            )

        # 2. Data Freshness Scoring
        if age_minutes <= 15:
            score += 15
            factors.append("Real-time telemetry (< 15 min old)")
        elif age_minutes <= 60:
            score += 10
            factors.append("Recent telemetry (< 1 hour old)")
        else:
            score -= 10
            factors.append(f"Older telemetry ({age_minutes} min old)")

        # 3. Completeness of Key Parameters
        if open_meteo_current:
            required_fields = ["temperature", "humidity", "wind_speed", "pressure", "visibility"]
            present_fields = [f for f in required_fields if open_meteo_current.get(f) is not None]
            completeness_ratio = len(present_fields) / len(required_fields)

            if completeness_ratio == 1.0:
                score += 10
                factors.append("Complete parameter suite available")
            elif completeness_ratio >= 0.6:
                score += 5
                factors.append("Core parameters available")
            else:
                score -= 5
                factors.append("Partial parameter set")

        # 4. Cross-Provider Conflict Detection
        if open_meteo_current and imd_observation:
            om_temp = open_meteo_current.get("temperature")
            imd_temp = imd_observation.get("temperature")

            if om_temp is not None and imd_temp is not None:
                delta_temp = abs(om_temp - imd_temp)

                if delta_temp <= 1.5:
                    score += 10
                    agreement_level = "good"
                    factors.append(f"Close temperature alignment (delta: {delta_temp:.1f}°C)")
                elif delta_temp <= self.t.TEMP_CONFLICT_DELTA_C:
                    score += 5
                    agreement_level = "moderate"
                    factors.append(f"Moderate temperature variance (delta: {delta_temp:.1f}°C)")
                else:
                    score -= 10
                    agreement_level = "low"
                    conflict_msg = (
                        f"Significant temperature divergence: Open-Meteo model ({om_temp}°C) "
                        f"vs IMD observation ({imd_temp}°C), difference of {delta_temp:.1f}°C."
                    )
                    conflict_warnings.append(conflict_msg)
                    factors.append("Cross-provider temperature variance detected")
            else:
                agreement_level = "unverified"
        else:
            agreement_level = "unverified"
            factors.append("Single-source telemetry verification")

        # Final Score Clamping & Level Classification
        final_score = max(5, min(100, score))

        if final_score >= 80:
            level = "high"
        elif final_score >= 50:
            level = "moderate"
        else:
            level = "low"

        return ConfidenceAssessment(
            score=final_score,
            level=level,
            agreement_level=agreement_level,
            conflict_warnings=conflict_warnings,
            factors=factors,
            note="WeatherGPT algorithmic data confidence score"
        )

confidence_service = ConfidenceService()
