import React, { useEffect, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { airQualityService } from '../services/airQualityService';
import { CurrentAirQualityResponse, HourlyAirQualityResponse } from '../types/airQuality';
import { PollutantBreakdown } from '../components/airquality/PollutantBreakdown';
import { HourlyAirQualityChart } from '../components/airquality/HourlyAirQualityChart';
import {
  translatePhrase,
  translateAQICategory,
  translateAQITrend,
  translatePollutant,
  translateAirAdvisory,
} from '../utils/dashboardTranslator';
import {
  Wind,
  Sparkles,
  RefreshCw,
  MapPin,
  AlertTriangle,
  MessageSquare,
  Activity,
  ShieldCheck,
  CloudFog,
  ChevronDown,
} from 'lucide-react';

interface Props {
  onOpenChatWithPrompt?: (promptText: string) => void;
}

export const AirQualityPage: React.FC<Props> = ({ onOpenChatWithPrompt }) => {
  const { location, openSelector } = useLocation();
  const { profile } = useAuthContext();
  const { language } = useLanguage();

  const [currentAQI, setCurrentAQI] = useState<CurrentAirQualityResponse | null>(null);
  const [hourlyAQI, setHourlyAQI] = useState<HourlyAirQualityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const lat = location?.latitude || profile?.latitude || 19.2437;
  const lon = location?.longitude || profile?.longitude || 73.1355;
  const locationName = location?.city
    ? (location.state ? `${location.city}, ${location.state}` : location.city)
    : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [currRes, hourRes] = await Promise.all([
        airQualityService.getCurrentAirQuality(lat, lon, location?.city || undefined, location?.state || undefined),
        airQualityService.getHourlyAirQuality(lat, lon, 24),
      ]);
      setCurrentAQI(currRes);
      setHourlyAQI(hourRes);
    } catch (err: any) {
      console.error('Error fetching air quality data:', err);
      setError(err.message || 'Failed to load air quality intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon]);

  const handleAskGpt = (prompt: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(prompt);
    }
  };

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

  const localizedCategory = currentAQI ? translateAQICategory(currentAQI.category, language) : '';
  const localizedPrimary = currentAQI ? translatePollutant(currentAQI.primary_pollutant, language) : '';
  const localizedTrend = hourlyAQI ? translateAQITrend(hourlyAQI.trend, language) : '';
  const localizedAdvisory = currentAQI ? translateAirAdvisory(currentAQI.category, currentAQI.health_advisory, language) : '';

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-3 sm:p-4 md:p-6 font-sans max-w-4xl mx-auto space-y-3 sm:space-y-4 pb-24 overflow-x-hidden">
      {/* Top Header & Action Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-white p-3 border border-[#D6DCE1] rounded-xs shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xs bg-[#17365D] text-white flex items-center justify-center font-black shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[#17365D] tracking-tight truncate uppercase">
              {translatePhrase('airQualityIntelligence', language)}
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-[#5B6770] font-semibold">
              <MapPin className="w-3 h-3 text-[#006B3C] shrink-0" />
              <span className="truncate">{locationName}</span>
              <button
                type="button"
                onClick={openSelector}
                className="text-[#1D5F91] font-bold hover:underline ml-1 cursor-pointer"
              >
                {language === 'mr' ? 'बदला' : language === 'hi' ? 'बदलें' : 'Change'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-xs bg-white border border-[#D6DCE1] text-[#17365D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            title="Refresh AQI Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#17365D]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleAskGpt(
              language === 'mr'
                ? `सध्या ${locationName} मध्ये हवेची गुणवत्ता कशी आहे आणि मी कोणती खबरदारी घ्यावी?`
                : language === 'hi'
                ? `वर्तमान में ${locationName} में वायु गुणवत्ता कैसी है और मुझे क्या सावधानियां बरतनी चाहिए?`
                : `How is the air quality right now in ${locationName}, and what precautions should I take?`
            )}
            className="px-3 py-1.5 rounded-xs bg-[#17365D] hover:bg-[#0F233D] text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors border border-[#0F233D]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
            <span>{translatePhrase('askWeatherGptAir', language)}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xs bg-[#FEE2E2] border border-[#FCA5A5] text-[#7F1D1D] text-xs flex items-center justify-between gap-2 font-bold">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchData}
            className="px-2.5 py-1 rounded-xs bg-[#B42318] text-white font-bold text-[10px] hover:bg-[#911C13] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !currentAQI ? (
        <div className="p-8 rounded-xs bg-white border border-[#D6DCE1] flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 text-[#17365D] animate-spin" />
          <p className="text-xs font-bold text-[#5B6770]">
            {language === 'mr' ? 'हवेची गुणवत्ता व प्रदूषक घटकांची माहिती मिळवत आहे...' : language === 'hi' ? 'वायु गुणवत्ता और प्रदूषक डेटा प्राप्त किया जा रहा है...' : 'Fetching live atmospheric & pollutant data...'}
          </p>
        </div>
      ) : currentAQI ? (
        <>
          {/* Main Government AQI Panel */}
          <div className="gov-panel">
            {/* Panel Header */}
            <div className="gov-panel-header">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#287D3C]" />
                <span>NATIONAL AIR QUALITY MONITORING BULLETIN</span>
              </div>
              <span className={`gov-badge ${getBadgeClass(currentAQI.category)}`}>
                {localizedCategory}
              </span>
            </div>

            {/* Panel Content */}
            <div className="p-3 space-y-3 bg-white">
              {/* Status Row */}
              <div className="flex items-center justify-between pb-2 border-b border-[#D6DCE1]">
                <div>
                  <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider block">
                    {translatePhrase('airQualityStatus', language)}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#1F2933]">
                    {localizedCategory} {translatePhrase('airQualityStatus', language)}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#5B6770] block">SCALE</span>
                  <span className="text-xs font-bold text-[#17365D]">{currentAQI.aqi_scale}</span>
                </div>
              </div>

              {/* 3 Telemetry Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* AQI Index Box */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#17365D] uppercase">
                      {translatePhrase('currentIndex', language)}
                    </span>
                    <Activity className="w-3.5 h-3.5 text-[#1D5F91]" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span
                      className="text-3xl sm:text-4xl font-black"
                      style={{ color: airQualityService.getCategoryColor(currentAQI.category) }}
                    >
                      {currentAQI.aqi}
                    </span>
                    <span className="text-xs font-bold text-[#5B6770]">
                      / 100+
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#5B6770]">
                    Index Category: {currentAQI.category}
                  </span>
                </div>

                {/* Primary Pollutant Box */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#17365D] uppercase">
                      {translatePhrase('dominantContaminant', language)}
                    </span>
                    <CloudFog className="w-3.5 h-3.5 text-[#1D5F91]" />
                  </div>
                  <div className="my-1">
                    <span className="text-base sm:text-lg font-bold text-[#1F2933] block">
                      {localizedPrimary}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5B6770] font-medium line-clamp-1">
                    {language === 'mr' ? 'हवेच्या गुणवत्तेवर प्रभाव टाकणारा मुख्य घटक' : language === 'hi' ? 'वायु गुणवत्ता को प्रभावित करने वाला मुख्य कारक' : 'Primary influencing contaminant'}
                  </span>
                </div>

                {/* 24-Hour Trend Box */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#17365D] uppercase">
                      {translatePhrase('shortTermTrend', language)}
                    </span>
                    <Wind className="w-3.5 h-3.5 text-[#1D5F91]" />
                  </div>
                  <div className="my-1">
                    <span className="text-base sm:text-lg font-bold text-[#1F2933] capitalize block">
                      {localizedTrend}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5B6770] font-medium line-clamp-1">
                    {hourlyAQI?.trend_summary || 'Conditions steady'}
                  </span>
                </div>
              </div>

              {/* Health Advisories in Official Strips */}
              <div className="space-y-2 pt-1 border-t border-[#D6DCE1]">
                {/* General Advisory */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] border-l-3 border-l-[#287D3C] rounded-xs flex items-start gap-2.5">
                  <div className="p-1 rounded-xs bg-[#DCFCE7] text-[#14532D] shrink-0 mt-0.5 border border-[#86EFAC]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase text-[#17365D]">
                      {translatePhrase('generalPublicAdvisory', language)}
                    </h4>
                    <p className="text-xs font-semibold leading-relaxed text-[#1F2933] mt-0.5">
                      {localizedAdvisory}
                    </p>
                  </div>
                </div>

                {/* Sensitive Group Guidance */}
                {currentAQI.sensitive_group_advisory && (
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] border-l-3 border-l-[#B7791F] rounded-xs flex items-start gap-2.5">
                    <div className="p-1 rounded-xs bg-[#FEF3C7] text-[#78350F] shrink-0 mt-0.5 border border-[#FDE68A]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-[#17365D]">
                        {translatePhrase('sensitiveGroupsGuidance', language)}
                      </h4>
                      <p className="text-xs leading-relaxed font-semibold text-[#1F2933] mt-0.5">
                        {currentAQI.sensitive_group_advisory}
                      </p>
                    </div>
                  </div>
                )}

                {/* Weather Synergy Note */}
                {currentAQI.weather_synergy_note && (
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] border-l-3 border-l-[#1D5F91] rounded-xs flex items-start gap-2.5">
                    <div className="p-1 rounded-xs bg-[#E0F2FE] text-[#0369A1] shrink-0 mt-0.5 border border-[#BAE6FD]">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-[#17365D]">
                        {translatePhrase('weatherSynergyTitle', language)}
                      </h4>
                      <p className="text-xs leading-relaxed font-semibold text-[#1F2933] mt-0.5">
                        {currentAQI.weather_synergy_note}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 24-Hour Hourly Forecast Chart */}
          {hourlyAQI && (
            <HourlyAirQualityChart
              hourly={hourlyAQI.hourly}
              trend={hourlyAQI.trend}
              trendSummary={hourlyAQI.trend_summary}
            />
          )}

          {/* Pollutant Breakdown Grid */}
          <PollutantBreakdown
            pollutants={currentAQI.pollutants}
            primaryCode={currentAQI.primary_pollutant}
          />

          {/* Official Inquiries / FAQ Guidance */}
          <div className="gov-panel">
            <div className="gov-panel-header">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#17365D]" />
                <span>{translatePhrase('quickAirQualityQuestions', language).toUpperCase()}</span>
              </div>
            </div>
            <div className="p-3 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAskGpt(
                    language === 'mr'
                      ? `आज ${locationName} मध्ये बाहेर व्यायाम करणे किंवा फिरणे सुरक्षित आहे का?`
                      : language === 'hi'
                      ? `क्या आज ${locationName} में बाहर व्यायाम या दौड़ना सुरक्षित है?`
                      : `Is it safe to go for a run or workout outdoors in ${locationName} today?`
                  )}
                  className="p-2.5 rounded-xs bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#D6DCE1] text-left text-xs font-bold text-[#17365D] transition-colors cursor-pointer"
                >
                  🏃 {language === 'mr' ? 'आज बाहेर व्यायाम करणे सुरक्षित आहे का?' : language === 'hi' ? 'क्या आज बाहर व्यायाम करना सुरक्षित है?' : 'Is it safe to exercise outdoors today?'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAskGpt(
                    language === 'mr'
                      ? `PM2.5 आणि PM10 मध्ये काय फरक आहे आणि ते आरोग्यासाठी कसे घातक आहेत?`
                      : language === 'hi'
                      ? `PM2.5 और PM10 में क्या अंतर है और यह स्वास्थ्य को कैसे प्रभावित करता है?`
                      : `What is the difference between PM2.5 and PM10, and why is PM2.5 dangerous?`
                  )}
                  className="p-2.5 rounded-xs bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#D6DCE1] text-left text-xs font-bold text-[#17365D] transition-colors cursor-pointer"
                >
                  🔬 {language === 'mr' ? 'PM2.5 काय आहे आणि ते आरोग्याला कसे हानी पोहोचवते?' : language === 'hi' ? 'PM2.5 क्या है और यह स्वास्थ्य को कैसे प्रभावित करता है?' : 'What is PM2.5 and how does it affect health?'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAskGpt(
                    language === 'mr'
                      ? `आज ${locationName} मध्ये संवेदनशील व्यक्तींनी (वृद्ध/दमेकरी) N95 मास्क वापरावा का?`
                      : language === 'hi'
                      ? `क्या आज ${locationName} में संवेदनशील लोगों को मास्क पहनना चाहिए?`
                      : `Should sensitive people wear an N95 mask outside in ${locationName} today?`
                  )}
                  className="p-2.5 rounded-xs bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#D6DCE1] text-left text-xs font-bold text-[#17365D] transition-colors cursor-pointer"
                >
                  😷 {language === 'mr' ? 'संवेदनशील व्यक्तींनी बाहेर मास्क वापरावा का?' : language === 'hi' ? 'क्या संवेदनशील लोगों को मास्क पहनना चाहिए?' : 'Should sensitive individuals wear a mask?'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAskGpt(
                    language === 'mr'
                      ? `${locationName} मध्ये हवेची गुणवत्ता कधी सुधारण्याची शक्यता आहे?`
                      : language === 'hi'
                      ? `${locationName} में हवा की गुणवत्ता कब सुधरने की संभावना है?`
                      : `When is the air quality expected to improve in ${locationName}?`
                  )}
                  className="p-2.5 rounded-xs bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#D6DCE1] text-left text-xs font-bold text-[#17365D] transition-colors cursor-pointer"
                >
                  ⏳ {language === 'mr' ? 'हवेची गुणवत्ता कधी सुधारेल?' : language === 'hi' ? 'हवा की गुणवत्ता कब सुधरेगी?' : 'When will air quality improve?'}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
