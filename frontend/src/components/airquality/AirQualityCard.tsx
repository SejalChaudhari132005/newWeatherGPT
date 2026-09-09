import React, { useEffect, useState } from 'react';
import { Wind, ArrowRight, RefreshCw, HeartPulse, Sparkles, MessageSquare } from 'lucide-react';
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

  if (loading && !data) {
    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between font-['Arimo']">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center animate-pulse">
            <Wind className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
            <div className="w-36 h-2.5 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between gap-2 font-['Arimo']">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-slate-400" />
          <span>{translatePhrase('airQualityStatus', language)} unavailable.</span>
        </div>
        <button
          onClick={fetchAQI}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const badgeStyle = airQualityService.getCategoryBadgeStyle(data.category);
  const localizedCategory = translateAQICategory(data.category, language);
  const localizedPrimary = translatePollutant(data.primary_pollutant, language);
  const localizedAdvisory = translateAirAdvisory(data.category, data.health_advisory, language);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-white to-slate-50/50 border border-slate-200/90 shadow-xs space-y-3 font-['Arimo'] transition-all">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#004aad]/10 text-[#004aad]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {translatePhrase('airQualityAndHealthAdvisory', language)}
            </h3>
            <p className="text-[10px] font-bold text-slate-400">
              {data.aqi_scale}
            </p>
          </div>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5"
          style={{
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.text,
            border: `1px solid ${badgeStyle.border}`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: badgeStyle.text }}
          />
          {localizedCategory}
        </span>
      </div>

      {/* Main AQI Value & Key Pollutant */}
      <div className="flex items-center justify-between bg-slate-50/80 rounded-xl p-3 border border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {translatePhrase('currentIndex', language)}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: airQualityService.getCategoryColor(data.category) }}
            >
              {data.aqi}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              AQI
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {translatePhrase('primaryPollutant', language)}
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-800">
            {localizedPrimary || 'Particulate Matter'}
          </span>
        </div>
      </div>

      {/* Health Advisory */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 text-slate-700">
          <HeartPulse className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed">
            {localizedAdvisory}
          </p>
        </div>

        {data.sensitive_group_advisory && (
          <div className="flex items-start gap-2 text-slate-600 pl-6">
            <p className="text-[11px] font-medium leading-relaxed italic text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-100/80 w-full">
              ⚠️ <span className="font-bold">{translatePhrase('sensitiveGroupsGuidance', language)}:</span> {data.sensitive_group_advisory}
            </p>
          </div>
        )}
      </div>

      {/* Weather Synergy Note */}
      {data.weather_synergy_note && (
        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-[11px] font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{data.weather_synergy_note}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1 gap-2">
        {onAskGpt && (
          <button
            onClick={() => onAskGpt(`How is the air quality in ${locationName || 'my location'} and is it safe to exercise outdoors?`)}
            className="text-[11px] font-bold text-[#004aad] hover:text-[#38b6ff] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{translatePhrase('askWeatherGptAir', language)}</span>
          </button>
        )}

        {onOpenDetails && (
          <button
            onClick={onOpenDetails}
            className="text-[11px] font-black text-slate-700 hover:text-slate-900 flex items-center gap-1 ml-auto cursor-pointer group transition-colors"
          >
            <span>{translatePhrase('detailedBreakdown', language)}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#004aad]" />
          </button>
        )}
      </div>
    </div>
  );
};
