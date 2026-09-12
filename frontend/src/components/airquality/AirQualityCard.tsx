import React, { useEffect, useState } from 'react';
import { Wind, ArrowRight, RefreshCw, HeartPulse, Sparkles, MessageSquare, Activity } from 'lucide-react';
import { CurrentAirQualityResponse } from '../../types/airQuality';
import { airQualityService } from '../../services/airQualityService';
import { useLanguage } from '../../context/LanguageContext';
import {
  translatePhrase,
  translateAQICategory,
  translatePollutant,
  translateAirAdvisory,
} from '../../utils/dashboardTranslator';

interface Props {
  latitude: number;
  longitude: number;
  locationName?: string;
  onOpenDetails?: () => void;
  onAskGpt?: (prompt: string) => void;
}

export const AirQualityCard: React.FC<Props> = ({
  latitude,
  longitude,
  locationName,
  onOpenDetails,
  onAskGpt,
}) => {
  const { language } = useLanguage();
  const [data, setData] = useState<CurrentAirQualityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAQI = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await airQualityService.getCurrentAirQuality(latitude, longitude);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load air quality:', err);
      setError(err.message || 'Air quality data unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchAQI();
    }
  }, [latitude, longitude]);

  const getBadgeClass = (category?: string) => {
    switch ((category || '').toUpperCase()) {
      case 'GOOD':
      case 'FAIR':
        return 'gov-badge-success';
      case 'MODERATE':
        return 'gov-badge-warning';
      case 'POOR':
      case 'UNHEALTHY':
      case 'VERY_POOR':
      case 'HAZARDOUS':
        return 'gov-badge-danger';
      default:
        return 'gov-badge-info';
    }
  };

  if (loading && !data) {
    return (
      <div className="gov-panel p-4 flex items-center justify-between font-sans">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-[#F8FAFC] border border-[#D6DCE1] flex items-center justify-center animate-pulse">
            <Activity className="w-4 h-4 text-[#17365D]" />
          </div>
          <div className="space-y-1">
            <div className="w-24 h-3 bg-slate-200 rounded-none animate-pulse" />
            <div className="w-36 h-2.5 bg-slate-100 rounded-none animate-pulse" />
          </div>
        </div>
        <RefreshCw className="w-4 h-4 text-[#17365D] animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="gov-panel p-3 bg-[#F8FAFC] flex items-center justify-between gap-2 font-sans text-xs">
        <div className="flex items-center gap-2 text-[#5B6770]">
          <Activity className="w-4 h-4 text-[#B42318]" />
          <span>{translatePhrase('airQualityStatus', language)} unavailable.</span>
        </div>
        <button
          type="button"
          onClick={fetchAQI}
          className="px-2.5 py-1 rounded-xs bg-white border border-[#D6DCE1] text-[#17365D] text-[10px] font-bold hover:bg-[#F1F5F9] cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const localizedCategory = translateAQICategory(data.category, language);
  const localizedPrimary = translatePollutant(data.primary_pollutant, language);
  const localizedAdvisory = translateAirAdvisory(data.category, data.health_advisory, language);
  const badgeClass = getBadgeClass(data.category);

  return (
    <div className="gov-panel font-sans">
      {/* Header Row */}
      <div className="gov-panel-header">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#17365D]" />
          <span>{translatePhrase('airQualityAndHealthAdvisory', language).toUpperCase()}</span>
        </div>
        <span className={`gov-badge ${badgeClass}`}>
          {localizedCategory}
        </span>
      </div>

      <div className="p-3 space-y-2.5 bg-white">
        {/* Main AQI Value & Key Pollutant Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider block">
              {translatePhrase('currentIndex', language)}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className="text-2xl font-black"
                style={{ color: airQualityService.getCategoryColor(data.category) }}
              >
                {data.aqi}
              </span>
              <span className="text-[10px] font-bold text-[#5B6770]">
                AQI
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider block">
              {translatePhrase('primaryPollutant', language)}
            </span>
            <span className="text-xs font-bold text-[#1F2933] mt-1 block truncate">
              {localizedPrimary || 'Particulate Matter'}
            </span>
          </div>
        </div>

        {/* Health Advisory */}
        <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] border-l-3 border-l-[#287D3C] rounded-xs">
          <p className="text-xs font-semibold leading-relaxed text-[#1F2933]">
            {localizedAdvisory}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1 gap-2 border-t border-[#D6DCE1]">
          {onAskGpt && (
            <button
              type="button"
              onClick={() => onAskGpt(`How is the air quality in ${locationName || 'my location'} and is it safe to exercise outdoors?`)}
              className="text-[11px] font-bold text-[#17365D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#006B3C]" />
              <span>{translatePhrase('askWeatherGptAir', language)}</span>
            </button>
          )}

          {onOpenDetails && (
            <button
              type="button"
              onClick={onOpenDetails}
              className="text-[11px] font-bold text-[#17365D] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
            >
              <span>{translatePhrase('detailedBreakdown', language)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#17365D]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
