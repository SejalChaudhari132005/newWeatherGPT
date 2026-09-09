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
    reasons: language === 'mr' ? 'जोखीम कारणे व निरीक्षण' : language === 'hi' ? 'जोखिम के कारण और अवलोकन' : 'Risk Reasons & Observations',
    precautions: language === 'mr' ? 'प्रवास खबरदारी व सूचना' : language === 'hi' ? 'यात्रा सावधानियां' : 'Travel Precautions',
    timeline: language === 'mr' ? 'मार्ग टप्पे व हवामान' : language === 'hi' ? 'मार्ग खंड और मौसम' : 'Route Waypoint Timeline',
    setAlert: language === 'mr' ? '🔔 प्रवास चेतावणी सेट करा' : language === 'hi' ? '🔔 यात्रा अलर्ट सेट करें' : '🔔 Set Route Alert',
    askGpt: language === 'mr' ? '✨ AI कडून अधिक जाणून घ्या' : language === 'hi' ? '✨ AI से पूछें' : '✨ Ask WeatherGPT about this route',
  };

  return (
    <div className="space-y-4 font-['Arimo']">
      {/* 1. Overall Route Risk Hero Card */}
      <div className={`p-4 sm:p-5 rounded-3xl border ${overallStyle.cardBg} shadow-md space-y-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {analysis.origin.name} → {analysis.destination.name}
            </span>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              {labels.title}
            </h3>
            <p className="text-xs font-bold text-slate-600">
              ⏱️ {analysis.distance_km} km • {analysis.formatted_duration} • {analysis.origin.departure_time} to {analysis.destination.arrival_time}
            </p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shrink-0 ${overallStyle.badgeBg} shadow-xs`}>
            {overallStyle.label}
          </span>
        </div>

        {/* Hazard Bullet Points */}
        {analysis.reasons && analysis.reasons.length > 0 && (
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/60 space-y-1.5">
            <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
              {labels.reasons}
            </h4>
            <ul className="space-y-1 text-xs text-slate-800 font-medium">
              {analysis.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#004aad] font-bold">👉</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Precautions */}
        {analysis.recommendation?.key_precautions && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {analysis.recommendation.key_precautions.map((p, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-xl bg-white text-[10px] font-bold text-slate-700 border border-slate-200/80 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{p}</span>
              </span>
            ))}
          </div>
        )}

        {/* Quick Action Triggers */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {onSetAlert && (
            <button
              onClick={onSetAlert}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-98"
            >
              <Bell className="w-3.5 h-3.5 text-[#fcd444]" />
              <span>{labels.setAlert}</span>
            </button>
          )}

          {onAskGpt && (
            <button
              onClick={() => onAskGpt(`Why is the route from ${analysis.origin.name} to ${analysis.destination.name} rated ${analysis.overall_risk}?`)}
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#004aad] to-[#38b6ff] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#fcd444]" />
              <span>{labels.askGpt}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Visual Waypoint Segment Timeline */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4">
        <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
          <Car className="w-4 h-4 text-[#004aad]" />
          <span>{labels.timeline}</span>
        </h4>

        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {analysis.segments.map((seg, idx) => {
            const segStyle = getRiskStyle(seg.risk);
            return (
              <div key={idx} className="relative space-y-1.5">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${segStyle.dotBg}`}
                />

                {/* Waypoint Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {seg.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{seg.eta}</span>
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${segStyle.badgeBg}`}>
                    {segStyle.label}
                  </span>
                </div>

                {/* Waypoint Weather Metrics Pill */}
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                  <span className="text-slate-900 font-black">{seg.temperature.toFixed(1)}°C • {seg.condition}</span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-blue-600" />
                      <span>{seg.rain_probability}% rain</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-teal-600" />
                      <span>{seg.wind_speed.toFixed(0)} km/h</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-500" />
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
                        className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 text-[10px] font-extrabold border border-red-200 flex items-center gap-1"
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
