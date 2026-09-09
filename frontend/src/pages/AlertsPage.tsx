import React, { useEffect, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { alertService } from '../services/alertService';
import { CitizenAlert, AlertSeverity } from '../types/alert';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle2,
  History,
  Bell,
  CloudRain,
  Flame,
  Wind,
  Zap,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { DemoBadge } from '../components/common/DemoBadge';
import { useLanguage } from '../context/LanguageContext';

export const AlertsPage: React.FC = () => {
  const { location } = useLocation();
  const { profile } = useAuthContext();
  const { language } = useLanguage();

  const [activeAlerts, setActiveAlerts] = useState<CitizenAlert[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<CitizenAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<CitizenAlert | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'history'>('all');

  const userId = profile?.user_id || 'anonymous';
  const lat = location?.latitude || profile?.latitude || 19.2437;
  const lon = location?.longitude || profile?.longitude || 73.1355;
  const city = location?.city || profile?.city || 'Kalyan-Dombivli';
  const district = location?.district || city;
  const state = location?.state || profile?.state || 'Maharashtra';

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // 1. Fetch current active alerts in user's selected language
      const curRes = await alertService.getCurrentAlerts(
        lat,
        lon,
        city,
        district,
        state,
        userId,
        language
      );
      setActiveAlerts(curRes.alerts || []);

      // 2. Fetch history alerts from Supabase
      const hist = await alertService.getAlertHistory(lat, lon, city, userId, 20);
      setHistoryAlerts(hist || []);
    } catch (err) {
      console.error('[AlertsPage] Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [lat, lon, city, language]);

  const handleMarkRead = async (alertId: string) => {
    await alertService.markAlertAsRead(alertId, userId);
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
    setHistoryAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'EMERGENCY':
        return {
          cardBg: 'bg-red-50 border-red-400',
          badgeBg: 'bg-red-600 text-white',
          titleColor: 'text-red-950',
          iconColor: 'text-red-600',
        };
      case 'SEVERE':
        return {
          cardBg: 'bg-rose-50 border-rose-300',
          badgeBg: 'bg-rose-600 text-white',
          titleColor: 'text-rose-950',
          iconColor: 'text-rose-600',
        };
      case 'WARNING':
        return {
          cardBg: 'bg-orange-50 border-orange-300',
          badgeBg: 'bg-orange-600 text-white',
          titleColor: 'text-orange-950',
          iconColor: 'text-orange-600',
        };
      case 'WATCH':
        return {
          cardBg: 'bg-amber-50 border-amber-300',
          badgeBg: 'bg-amber-500 text-slate-900',
          titleColor: 'text-amber-950',
          iconColor: 'text-amber-600',
        };
      case 'ADVISORY':
        return {
          cardBg: 'bg-yellow-50 border-yellow-300',
          badgeBg: 'bg-yellow-400 text-slate-900',
          titleColor: 'text-yellow-950',
          iconColor: 'text-yellow-700',
        };
      case 'INFO':
      default:
        return {
          cardBg: 'bg-blue-50/70 border-blue-200',
          badgeBg: 'bg-blue-100 text-blue-900',
          titleColor: 'text-blue-950',
          iconColor: 'text-blue-600',
        };
    }
  };

  const getAlertIcon = (type: string) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('RAIN')) return <CloudRain className="w-5 h-5 shrink-0" />;
    if (t.includes('THUNDER') || t.includes('LIGHTNING')) return <Zap className="w-5 h-5 shrink-0" />;
    if (t.includes('HEAT') || t.includes('TEMPERATURE')) return <Flame className="w-5 h-5 shrink-0" />;
    if (t.includes('WIND') || t.includes('CYCLONE')) return <Wind className="w-5 h-5 shrink-0" />;
    if (t.includes('FOG') || t.includes('VISIBILITY')) return <Eye className="w-5 h-5 shrink-0" />;
    return <AlertTriangle className="w-5 h-5 shrink-0" />;
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return ts;
    }
  };

  const pageLabels = {
    title: language === 'mr' ? 'WeatherGPT हवामान चेतावणी' : language === 'hi' ? 'WeatherGPT मौसम चेतावनियां' : 'WeatherGPT Alerts',
    liveBadge: language === 'mr' ? 'थेट पूर्वसूचना' : language === 'hi' ? 'लाइव पूर्व चेतावनी' : 'Live Early Warning',
    currentLocation: language === 'mr' ? 'सध्याचे स्थान' : language === 'hi' ? 'वर्तमान स्थान' : 'Current Location',
    refresh: language === 'mr' ? 'चेतावणी रीफ्रेश करा' : language === 'hi' ? 'चेतावनी रीफ्रेश करें' : 'Refresh Warnings',
    all: language === 'mr' ? 'सर्व' : language === 'hi' ? 'सभी' : 'All',
    activeNow: language === 'mr' ? 'सध्या सक्रिय' : language === 'hi' ? 'अभी सक्रिय' : 'Active Now',
    recentAlerts: language === 'mr' ? 'मागील चेतावण्या' : language === 'hi' ? 'हालिया चेतावनियां' : 'Recent Alerts',
    evaluating: language === 'mr' ? `${city} साठी हवामान धोक्यांचे मूल्यांकन सुरू आहे...` : language === 'hi' ? `${city} के लिए मौसम खतरों का मूल्यांकन किया जा रहा है...` : `Evaluating multi-hazard meteorological alerts for ${city}...`,
    noAlertsTitle: language === 'mr' ? '✓ कोणतीही तीव्र हवामान चेतावणी नाही' : language === 'hi' ? '✓ कोई गंभीर मौसम चेतावनी सक्रिय नहीं है' : '✓ No active severe weather warnings',
    noAlertsDesc: language === 'mr' ? `${city} परिसरातील हवामान घटक सध्या सुरक्षित मर्यादेत आहेत.` : language === 'hi' ? `${city} के लिए मौसम की स्थिति वर्तमान में सुरक्षित सीमा में है।` : `Atmospheric parameters for ${city} are currently within safe thresholds.`,
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto p-4 sm:p-6 font-['Arimo'] pb-20">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{pageLabels.title}</h1>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase">
              {pageLabels.liveBadge}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 pt-1">
            <MapPin className="w-3.5 h-3.5 text-[#004aad]" />
            <span>{pageLabels.currentLocation}: <strong className="text-slate-900 underline decoration-sky-400">{city}, {state}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#004aad] transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#38b6ff]' : ''}`} />
            <span>{pageLabels.refresh}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 w-fit">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {pageLabels.all} ({activeAlerts.length + historyAlerts.length})
        </button>
        <button
          onClick={() => setFilterTab('active')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{pageLabels.activeNow}</span>
          {activeAlerts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setFilterTab('history')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {pageLabels.recentAlerts} ({historyAlerts.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#004aad] animate-spin" />
          <p className="text-xs font-bold text-slate-600">{pageLabels.evaluating}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: ACTIVE NOW */}
          {(filterTab === 'all' || filterTab === 'active') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-orange-600" />
                  <span>{pageLabels.activeNow} ({activeAlerts.length})</span>
                </h3>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="p-5 bg-white rounded-3xl border border-emerald-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950">{pageLabels.noAlertsTitle}</h3>
                    <p className="text-xs text-slate-500 font-medium pt-0.5">
                      {pageLabels.noAlertsDesc}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {activeAlerts.map((alert) => {
                    const style = getSeverityStyle(alert.severity);
                    return (
                      <div
                        key={alert.id}
                        onClick={() => {
                          setSelectedAlert(alert);
                          handleMarkRead(alert.id);
                        }}
                        className={`p-4 sm:p-5 bg-white rounded-3xl border ${style.cardBg} shadow-sm space-y-3 cursor-pointer hover:shadow-md transition-all relative overflow-hidden`}
                      >
                        {!alert.is_read && (
                          <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-rose-100" />
                        )}

                        <div className="flex items-start justify-between gap-3 pr-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={style.iconColor}>{getAlertIcon(alert.type)}</span>
                            <span className={`text-base font-black ${style.titleColor}`}>
                              {alert.title}
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full ${style.badgeBg} text-[10px] font-black uppercase tracking-wider`}>
                            {alert.severity}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {alert.description}
                        </p>

                        {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                          <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200/70 text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-[#004aad]">👉</span>
                            <span>{alert.recommended_actions[0]}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-500 gap-2">
                          <span>📍 {alert.location_name}</span>
                          <span>🕒 Valid until: {formatTimestamp(alert.valid_until)}</span>
                          <span className="text-[#004aad] font-extrabold hover:underline">Tap for details & actions →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: RECENT ALERTS (History from Supabase) */}
          {(filterTab === 'all' || filterTab === 'history') && historyAlerts.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Recent Alert History ({historyAlerts.length})</span>
                </h3>
              </div>

              <div className="space-y-2.5">
                {historyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 font-['Arimo']"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900 truncate">
                            {alert.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-extrabold uppercase">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold pt-0.5">
                          {formatTimestamp(alert.created_at)} • {alert.location_name}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-[#004aad] shrink-0">
                      View →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        onMarkRead={handleMarkRead}
      />
    </div>
  );
};
