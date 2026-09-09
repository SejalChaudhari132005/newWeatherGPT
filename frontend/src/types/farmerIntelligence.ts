export type DecisionBadgeColor = 'green' | 'yellow' | 'orange' | 'red';

export interface SoilStateData {
  moisture_surface_0_to_7cm: number | null;
  moisture_rootzone_7_to_28cm: number | null;
  soil_temperature_surface_c: number | null;
  et0_evapotranspiration_mm: number | null;
  moisture_status: 'deficit' | 'optimal' | 'saturated' | 'waterlogged';
  irrigation_urgency: 'none' | 'low' | 'moderate' | 'critical';
}

export interface FarmingWindowSlot {
  start_time: string;
  end_time: string;
  activity: 'spraying' | 'irrigation' | 'harvesting' | 'sowing' | 'field_work';
  suitability: 'optimal' | 'moderate' | 'unfavorable';
  score: number;
  rationale: string;
  limiting_factor: string | null;
}

export interface SprayingRiskAssessment {
  overall_risk: 'LOW' | 'MODERATE' | 'HIGH';
  badge_color: DecisionBadgeColor;
  wash_off_risk: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
  drift_risk: 'LOW' | 'MODERATE' | 'HIGH';
  optimal_window: string | null;
  rain_expected_hours_after: number | null;
  wind_speed_kmh: number;
  recommendations: string[];
}

export interface PestDiseaseRisk {
  crop: string;
  disease_or_pest_name: string;
  risk_level: 'low' | 'moderate' | 'high';
  favorable_conditions: string;
  preventive_action: string;
}

export interface FarmerDecisionData {
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    city?: string;
    state?: string;
  };
  crop: string;
  phenological_stage: string;
  current_temp_c: number;
  current_humidity_pct: number;
  current_rain_prob_pct: number;
  soil_state: SoilStateData;
  best_farming_windows: FarmingWindowSlot[];
  spraying_suitability: SprayingRiskAssessment;
  pest_disease_risks: PestDiseaseRisk[];
  executive_summary: string;
  regional_advisory_text: string;
  provenance: {
    source: string;
    evaluated_at: string;
    confidence_score: number;
    disclaimer: string;
  };
  generated_at: string;
}

export interface FarmerDecisionResponse {
  success: boolean;
  data?: FarmerDecisionData;
  message?: string;
}
