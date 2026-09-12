import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Wind,
  Eye,
  Clock,
  MapPin,
  CheckCircle2,
  Car,
  Bell,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { RouteAnalysisResponse, RouteSegment } from '../../types/route';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  analysis: RouteAnalysisResponse;
  onSetAlert?: () => void;
  onAskGpt?: (query: string) => void;
}

export const RouteTimeline: React.FC<Props> = ({ analysis, onSetAlert, onAskGpt }) => {
  const { language } = useLanguage();

  const getShortName = (name: string) => {
    if (!name) return '';
    const parts = name.split(',');
    if (parts.length > 2) {
      return `${parts[0].trim()}, ${parts[1].trim()}`;
    }
    return name.length > 30 ? name.substring(0, 28) + '...' : name;
  };

  const getRiskStyle = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'severe':
        return {
          cardBg: 'bg-red-50 border-red-300 text-red-950',
          badgeBg: 'bg-red-600 text-white',
          dotBg: 'bg-red-600',
          label: language === 'mr' ? 'अति तीव्र जोखीम' : language === 'hi' ? 'गंभीर जोखिम' : 'Severe Risk',
        };
      case 'high':
        return {
          cardBg: 'bg-orange-50 border-orange-300 text-orange-950',
          badgeBg: 'bg-orange-600 text-white',
          dotBg: 'bg-orange-500',
          label: language === 'mr' ? 'जास्त जोखीम' : language === 'hi' ? 'उच्च जोखिम' : 'High Risk',
        };
      case 'moderate':
        return {
          cardBg: 'bg-amber-50 border-amber-300 text-amber-950',
          badgeBg: 'bg-amber-500 text-slate-900',
          dotBg: 'bg-amber-400',
          label: language === 'mr' ? 'मध्यम जोखीम' : language === 'hi' ? 'मध्यम जोखिम' : 'Moderate Risk',
        };
      case 'low':
      default:
        return {
          cardBg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          badgeBg: 'bg-emerald-600 text-white',
          dotBg: 'bg-emerald-500',
          label: language === 'mr' ? 'कमी जोखीम' : language === 'hi' ? 'कम जोखिम' : 'Low Risk',
        };
    }
  };

  const overallStyle = getRiskStyle(analysis.overall_risk);

  const labels = {
    title: language === 'mr' ? 'मार्ग हवामान अहवाल' : language === 'hi' ? 'मार्ग मौसम रिपोर्ट' : 'Route Weather Assessment',
    reasons: language === 'mr' ? 'मुख्य निरीक्षण' : language === 'hi' ? 'मुख्य अवलोकन' : 'Key Observations',
    precautions: language === 'mr' ? 'खबरदारी' : language === 'hi' ? 'सावधानियां' : 'Precautions',
    timeline: language === 'mr' ? 'मार्ग टप्पे व हवामान' : language === 'hi' ? 'मार्ग खंड और मौसम' : 'Route Waypoints',
    setAlert: language === 'mr' ? 'प्रवास चेतावणी सेट करा' : language === 'hi' ? 'यात्रा अलर्ट सेट करें' : 'Set Route Alert',
    askGpt: language === 'mr' ? 'AI कडून विचारा' : language === 'hi' ? 'AI से पूछें' : 'Ask WeatherGPT about this route',
  };

  // Filter out redundant "favorable" lines if real hazards exist, and keep at most 2 concise points
  const displayReasons = React.useMemo(() => {
    if (!analysis.reasons || analysis.reasons.length === 0) return [];
    const nonFavorable = analysis.reasons.filter((r) => !r.toLowerCase().includes('favorable'));
    const sourceList = nonFavorable.length > 0 ? nonFavorable : analysis.reasons;
    return sourceList.slice(0, 2);
  }, [analysis.reasons]);

  return (
    <div className="space-y-3.5 font-['Arimo']">
      {/* 1. Overall Route Risk Hero Card */}
      <div className={`p-4 sm:p-5 rounded-3xl border ${overallStyle.cardBg} shadow-sm space-y-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 truncate block">
              {getShortName(analysis.origin.name)} → {getShortName(analysis.destination.name)}
            </span>
            <h3 className="text-base font-black tracking-tight text-slate-900">
              {labels.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{analysis.distance_km} km • {analysis.formatted_duration}</span>
              </span>
              <span>({analysis.origin.departure_time} – {analysis.destination.arrival_time})</span>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0 ${overallStyle.badgeBg} shadow-xs`}>
            {overallStyle.label}
          </span>
        </div>

        {/* Hazard Bullet Points (Concise - Max 2 points) */}
        {displayReasons.length > 0 && (
          <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1.5 shadow-2xs">
            <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
              {labels.reasons}
            </h4>
            <ul className="space-y-1 text-xs text-slate-800 font-medium">
              {displayReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0 mt-1.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Precautions (Concise badges) */}
        {analysis.recommendation?.key_precautions && analysis.recommendation.key_precautions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analysis.recommendation.key_precautions.slice(0, 2).map((p, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-xl bg-white text-[10px] font-bold text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{p}</span>
              </span>
            ))}
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {onSetAlert && (
            <button
              onClick={onSetAlert}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-98"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>{labels.setAlert}</span>
            </button>
          )}

          {onAskGpt && (
            <button
              onClick={() => onAskGpt(`Provide concise weather safety advice for traveling from ${analysis.origin.name} to ${analysis.destination.name}.`)}
              className="py-1.5 px-3 rounded-xl bg-[#004aad] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{labels.askGpt}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Visual Waypoint Segment Timeline */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3.5">
        <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
          <Car className="w-3.5 h-3.5 text-[#004aad]" />
          <span>{labels.timeline} ({analysis.segments.length})</span>
        </h4>

        <div className="relative pl-5 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {analysis.segments.map((seg, idx) => {
            const segStyle = getRiskStyle(seg.risk);
            const conditionName = seg.condition && !seg.condition.toLowerCase().includes('model')
              ? seg.condition
              : 'Partly Cloudy';

            return (
              <div key={idx} className="relative space-y-1.5">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${segStyle.dotBg}`}
                />

                {/* Waypoint Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {seg.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{seg.eta}</span>
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${segStyle.badgeBg}`}>
                    {segStyle.label}
                  </span>
                </div>

                {/* Waypoint Weather Metrics Pill */}
                <div className="p-2 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                  <span className="text-slate-900 font-black">
                    {seg.temperature.toFixed(1)}°C • {conditionName}
                  </span>
                  <div className="flex items-center gap-2.5 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-blue-600" />
                      <span>{seg.rain_probability}%</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-teal-600" />
                      <span>{seg.wind_speed.toFixed(0)} km/h</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>{seg.visibility_km.toFixed(1)} km</span>
                    </span>
                  </div>
                </div>

                {/* Specific Hazards on Segment */}
                {seg.hazards && seg.hazards.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {seg.hazards.map((h, h_idx) => (
                      <span
                        key={h_idx}
                        className="px-2 py-0.5 rounded-lg bg-red-50 text-red-800 text-[10px] font-bold border border-red-200 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

