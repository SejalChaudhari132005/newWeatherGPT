import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  CloudRain,
  Flame,
  Snowflake,
  Wind,
  Info,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { CitizenAlert, AlertSeverity } from '../../types/alert';
import { AlertDetailModal } from '../alerts/AlertDetailModal';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  alerts?: CitizenAlert[];
  onOpenAlerts?: () => void;
  locationName?: string;
}

export const WeatherAlerts: React.FC<Props> = ({ alerts = [], onOpenAlerts, locationName }) => {
  const { language } = useLanguage();
  const [selectedAlert, setSelectedAlert] = useState<CitizenAlert | null>(null);

  const activeAlerts = alerts.filter((a) => a.is_active);

  const labels = {
    headerTitle: language === 'mr' ? 'हवामान चेतावणी व पूर्वसूचना' : language === 'hi' ? 'मौसम चेतावनियां और पूर्व चेतावनी' : 'Weather Alerts & Early Warnings',
    allClear: language === 'mr' ? 'सर्व सुरक्षित' : language === 'hi' ? 'सब सुरक्षित' : 'All Clear',
    active: language === 'mr' ? 'सक्रिय' : language === 'hi' ? 'सक्रिय' : 'Active',
    noAlertsTitle: language === 'mr' ? '✓ कोणतीही तीव्र हवामान चेतावणी नाही' : language === 'hi' ? '✓ कोई गंभीर मौसम चेतावनी सक्रिय नहीं है' : '✓ No active severe weather warnings',
    noAlertsDesc: language === 'mr' ? `${locationName || 'तुमच्या परिसरातील'} हवामान सामान्य मर्यादेत आहे.` : language === 'hi' ? `${locationName || 'आपके क्षेत्र'} की वायुमंडलीय स्थिति सामान्य सीमा में है।` : `Atmospheric conditions for ${locationName || 'your location'} are within normal operating thresholds.`,
    viewDetails: language === 'mr' ? 'तपशील पहा' : language === 'hi' ? 'विवरण देखें' : 'View details',
    openCenter: language === 'mr' ? 'पूर्वसूचना केंद्र उघडा' : language === 'hi' ? 'पूर्व चेतावनी केंद्र खोलें' : 'Open Early Warning Center',
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'EMERGENCY':
        return {
          cardBg: 'bg-red-50 border-red-400',
          badgeBg: 'bg-red-600 text-white',
          titleColor: 'text-red-950',
          descColor: 'text-red-900',
          iconColor: 'text-red-600',
          severityText: 'EMERGENCY',
        };
      case 'SEVERE':
        return {
          cardBg: 'bg-rose-50/90 border-rose-300',
          badgeBg: 'bg-rose-600 text-white',
          titleColor: 'text-rose-950',
          descColor: 'text-rose-900',
          iconColor: 'text-rose-600',
          severityText: 'SEVERE WARNING',
        };
      case 'WARNING':
        return {
          cardBg: 'bg-orange-50/90 border-orange-300',
          badgeBg: 'bg-orange-600 text-white',
          titleColor: 'text-orange-950',
          descColor: 'text-orange-900',
          iconColor: 'text-orange-600',
          severityText: 'WARNING',
        };
      case 'WATCH':
        return {
          cardBg: 'bg-amber-50/90 border-amber-300',
          badgeBg: 'bg-amber-500 text-slate-900',
          titleColor: 'text-amber-950',
          descColor: 'text-amber-900',
          iconColor: 'text-amber-600',
          severityText: 'WATCH',
        };
      case 'ADVISORY':
        return {
          cardBg: 'bg-yellow-50/90 border-yellow-300',
          badgeBg: 'bg-yellow-400 text-slate-900',
          titleColor: 'text-yellow-950',
          descColor: 'text-yellow-900',
          iconColor: 'text-yellow-700',
          severityText: 'ADVISORY',
        };
      case 'INFO':
      default:
        return {
          cardBg: 'bg-blue-50/70 border-blue-200',
          badgeBg: 'bg-blue-100 text-blue-900',
          titleColor: 'text-blue-950',
          descColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          severityText: 'NOTICE',
        };
    }
  };

  const getAlertIcon = (type: string) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('RAIN')) return <CloudRain className="w-5 h-5 shrink-0" />;
    if (t.includes('THUNDER') || t.includes('LIGHTNING')) return <Zap className="w-5 h-5 shrink-0" />;
    if (t.includes('HEAT') || t.includes('TEMPERATURE')) return <Flame className="w-5 h-5 shrink-0" />;
    if (t.includes('COLD')) return <Snowflake className="w-5 h-5 shrink-0" />;
    if (t.includes('WIND') || t.includes('CYCLONE')) return <Wind className="w-5 h-5 shrink-0" />;
    if (t.includes('FOG') || t.includes('VISIBILITY')) return <Eye className="w-5 h-5 shrink-0" />;
    return <AlertTriangle className="w-5 h-5 shrink-0" />;
  };

  return (
    <>
      <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 font-['Arimo']">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
              <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
                {labels.headerTitle}
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                IMD & WeatherGPT Early Warning Engine
              </p>
            </div>
          </div>

          {activeAlerts.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase shrink-0 border border-rose-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              {activeAlerts.length} {labels.active}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase shrink-0 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {labels.allClear}
            </span>
          )}
        </div>

        {/* Body: Active Alerts or Clean Normal State */}
        {activeAlerts.length === 0 ? (
          <div className="p-4 rounded-xl sm:rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-emerald-950">
                {labels.noAlertsTitle}
              </h4>
              <p className="text-[11px] text-emerald-800 font-medium">
                {labels.noAlertsDesc}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeAlerts.map((item, index) => {
              const style = getSeverityStyle(item.severity);
              return (
                <div
                  key={item.id || index}
                  onClick={() => setSelectedAlert(item)}
                  className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${style.cardBg} space-y-2 cursor-pointer hover:shadow-md transition-all`}
                >
                  {/* Title & Severity Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={style.iconColor}>{getAlertIcon(item.type)}</span>
                      <span className={`text-xs sm:text-sm font-black ${style.titleColor} truncate`}>
                        {item.title}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full ${style.badgeBg} text-[9px] font-black uppercase shrink-0 tracking-wide`}
                    >
                      {item.severity_label || style.severityText}
                    </span>
                  </div>

                  {/* Description */}
                  <p className={`text-[11px] sm:text-xs ${style.descColor} leading-relaxed font-medium line-clamp-2`}>
                    {item.description}
                  </p>

                  {/* Recommended Action Pill */}
                  {item.recommended_actions && item.recommended_actions.length > 0 && (
                    <div className="p-2 rounded-xl bg-white/70 border border-slate-200/60 text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-[#004aad]">👉</span>
                      <span className="truncate">{item.recommended_actions[0]}</span>
                    </div>
                  )}

                  {/* Area and Validity Info */}
                  <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-600 pt-1 border-t border-slate-200/50 gap-2">
                    <span className="truncate">📍 {item.location_name || locationName || 'Local Region'}</span>
                    <span className="text-[10px] font-extrabold text-[#004aad] hover:underline flex items-center gap-1">
                      <span>{labels.viewDetails}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Button */}
        {onOpenAlerts && (
          <button
            onClick={onOpenAlerts}
            className="w-full py-2.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200/70 text-slate-800 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>{labels.openCenter}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
      />
    </>
  );
};
