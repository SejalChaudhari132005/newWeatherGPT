export interface WeatherSourceInfo {
  provider: string;
  type?: string;
}

export interface WeatherConfidenceInfo {
  score: number;
  level: string;
  agreement?: string;
}

export interface WeatherAlertSummary {
  id: string;
  severity: string;
  severity_label?: string;
  title: string;
}

export interface WeatherLocationInfo {
  latitude: number;
  longitude: number;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  is_override?: boolean;
}

export interface WeatherContextPayload {
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    district?: string;
    state?: string;
    source?: string;
  };
  current_weather?: {
    temperature: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_direction: string | number;
    visibility: number;
    pressure: number;
    uv_index: number;
    rain_probability: number;
    condition: string;
    icon?: string;
  };
  forecast?: {
    daily?: Array<{
      day: string;
      date: string;
      high: number;
      low: number;
      condition: string;
      icon?: string;
      rain_probability: number;
    }>;
    hourly?: Array<{
      time: string;
      temp: number;
      condition: string;
      rain_probability: number;
    }>;
  };
  alerts?: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    severity_label?: string;
    source?: string;
    valid_until?: string;
  }>;
  confidence?: {
    score: number;
    label?: string;
  };
  sources?: Array<{
    name: string;
    type: string;
  }>;
  retrieved_at?: string;
}

export interface ChatMetadata {
  intent?: string;
  time_range?: string;
  location?: WeatherLocationInfo;
  sources?: WeatherSourceInfo[];
  confidence?: WeatherConfidenceInfo;
  alerts?: WeatherAlertSummary[];
  weather_context?: WeatherContextPayload;
  action_buttons?: Array<{ id: string; label: string; action: string }>;
  route_analysis?: Record<string, any>;
  latencies?: Record<string, number>;
  validation?: Record<string, any>;
  timestamp?: string;
}

export interface ExplainableMetadata {
  sources: string[];
  confidenceScore: number;
  resolution: string;
  updatedAt: string;
  rationale: string;
}

export interface WeatherDataPayload {
  temperature?: number;
  tempC?: number;
  condition?: string;
  feelsLike?: number;
  humidity?: number;
  humidityPct?: number;
  windSpeed?: number;
  windSpeedKmH?: number;
  windDirection?: string;
  visibility?: number;
  rainProbability?: number;
  pressure?: number;
  uvIndex?: number;
  locationName?: string;
  timeWindow?: string;
  confidenceScore?: number;
  sources?: string[];
  advisory?: WeatherAdvisoryPayload | string;
  isDemoData?: boolean;
}

export interface WeatherAdvisoryPayload {
  title?: string;
  role?: string;
  headline?: string;
  recommendation?: string;
  advisoryText?: string;
  impactLevel?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  steps?: string[];
  actionableSteps?: string[];
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  userId?: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  metadata?: ChatMetadata;
  explainable?: ExplainableMetadata;
  suggestedFollowups?: string[];
  roleContext?: string;
  weatherData?: WeatherDataPayload;
  weatherAdvisory?: WeatherAdvisoryPayload;
}

export interface Conversation {
  id: string;
  userId?: string;
  title: string;
  role: string;
  locationName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ActiveNavPage =
  | 'chat'
  | 'dashboard'
  | 'map'
  | 'travel'
  | 'alerts'
  | 'climate'
  | 'profile'
  | 'settings';

export interface PromptSuggestion {
  id: string;
  title?: string;
  text?: string;
  prompt?: string;
  icon: string;
  role?: string;
  roleCategory?: string;
}
