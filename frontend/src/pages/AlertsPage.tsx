import React, { useEffect, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { alertService } from '../services/alertService';
import { CitizenAlert } from '../types/alert';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  MapPin,
  Clock,
  History,
  Bell,
  CloudRain,
  Flame,
  Wind,
  Zap,
  Eye,
  AlertCircle,
  ArrowRight,
  Sprout,
  Bug,
  Droplets,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translatePhrase } from '../utils/dashboardTranslator';

interface AlertsPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onOpenChatWithPrompt }) => {
  const { location } = useLocation();
  const { profile } = useAuthContext();
  const { language } = useLanguage();

  const [activeAlerts, setActiveAlerts] = useState<CitizenAlert[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<CitizenAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<CitizenAlert | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'rain' | 'spray' | 'pest' | 'history'>('all');

  const userId = profile?.user_id || 'anonymous';
  const lat = location?.latitude || profile?.latitude || 19.2437;
  const lon = location?.longitude || profile?.longitude || 73.1355;
  const city = location?.city || profile?.city || 'Kalyan-Dombivli';
  const district = location?.district || city;
  const state = location?.state || profile?.state || 'Maharashtra';

  const fetchAlerts = async () => {
    setLoading(true);
    try {
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
          borderAccent: 'border-l-4 border-l-[#B42318]',
          badgeClass: 'gov-badge-danger',
          iconBg: 'bg-red-50 text-[#B42318] border border-red-200',
          actionBtn: 'gov-btn-danger',
          boxBg: 'bg-red-50/70 border-red-200 text-red-950',
          label: translatePhrase('emergency', language) || 'EMERGENCY',
        };
      case 'SEVERE':
        return {
          borderAccent: 'border-l-4 border-l-[#B42318]',
          badgeClass: 'gov-badge-danger',
          iconBg: 'bg-red-50 text-[#B42318] border border-red-200',
          actionBtn: 'gov-btn-danger',
          boxBg: 'bg-red-50/70 border-red-200 text-red-950',
          label: translatePhrase('severe', language) || 'SEVERE',
        };
      case 'WARNING':
        return {
          borderAccent: 'border-l-4 border-l-[#B7791F]',
          badgeClass: 'gov-badge-warning',
          iconBg: 'bg-amber-50 text-[#B7791F] border border-amber-200',
          actionBtn: 'gov-btn-primary',
          boxBg: 'bg-amber-50/70 border-amber-200 text-amber-950',
          label: translatePhrase('warning', language) || 'WARNING',
        };
      case 'WATCH':
        return {
          borderAccent: 'border-l-4 border-l-[#B7791F]',
          badgeClass: 'gov-badge-warning',
          iconBg: 'bg-orange-50 text-orange-700 border border-orange-200',
          actionBtn: 'gov-btn-primary',
          boxBg: 'bg-orange-50/70 border-orange-200 text-orange-950',
          label: translatePhrase('watch', language) || 'WATCH',
        };
      case 'ADVISORY':
        return {
          borderAccent: 'border-l-4 border-l-[#006B3C]',
          badgeClass: 'gov-badge-success',
          iconBg: 'bg-emerald-50 text-[#006B3C] border border-emerald-200',
          actionBtn: 'gov-btn-primary',
          boxBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
          label: translatePhrase('advisory', language) || 'ADVISORY',
        };
      case 'INFO':
      default:
        return {
          borderAccent: 'border-l-4 border-l-[#1D5F91]',
          badgeClass: 'gov-badge-info',
          iconBg: 'bg-sky-50 text-[#1D5F91] border border-sky-200',
          actionBtn: 'gov-btn-secondary',
          boxBg: 'bg-sky-50/70 border-sky-200 text-slate-900',
          label: translatePhrase('info', language) || 'NOTICE',
        };
    }
  };

  const getAlertIcon = (type: string) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('RAIN') || t.includes('PRECIPITATION')) return <CloudRain className="w-4 h-4 shrink-0" />;
    if (t.includes('SPRAY') || t.includes('AGRICULTURE') || t.includes('CROP')) return <Sprout className="w-4 h-4 shrink-0" />;
    if (t.includes('PEST') || t.includes('DISEASE') || t.includes('FUNGAL')) return <Bug className="w-4 h-4 shrink-0" />;
    if (t.includes('IRRIGATION') || t.includes('SOIL') || t.includes('MOISTURE')) return <Droplets className="w-4 h-4 shrink-0" />;
    if (t.includes('THUNDER') || t.includes('LIGHTNING')) return <Zap className="w-4 h-4 shrink-0" />;
    if (t.includes('HEAT') || t.includes('TEMPERATURE')) return <Flame className="w-4 h-4 shrink-0" />;
    if (t.includes('WIND') || t.includes('CYCLONE')) return <Wind className="w-4 h-4 shrink-0" />;
    if (t.includes('FOG') || t.includes('VISIBILITY')) return <Eye className="w-4 h-4 shrink-0" />;
    return <AlertTriangle className="w-4 h-4 shrink-0" />;
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    } catch {
      return ts;
    }
  };

  const handleAskAgriAI = (alertTitle: string, alertDesc: string) => {
    if (onOpenChatWithPrompt) {
      const prompt =
        language === 'mr'
          ? `चेतावणी: "${alertTitle}" - ${alertDesc} यावर माझ्या पिकासाठी काय खबरदारी घ्यावी व काय उपाय करावेत?`
          : language === 'hi'
          ? `चेतावनी: "${alertTitle}" - ${alertDesc} इस स्थिति में मेरी फसल के लिए क्या सावधानी और उपाय करने चाहिए?`
          : `Alert: "${alertTitle}" - ${alertDesc}. What immediate precautions and field actions should I take for my crops?`;
      onOpenChatWithPrompt(prompt);
    }
  };

  const isFarmer = (profile?.role || '').toLowerCase() === 'farmer';

  const isAgriAlert = (a: CitizenAlert) => {
    const t = (a.type || '').toUpperCase();
    const title = (a.title || '').toUpperCase();
    const desc = (a.description || '').toUpperCase();
    return (
      t.includes('SPRAY') ||
      t.includes('PEST') ||
      t.includes('DISEASE') ||
      t.includes('FUNGAL') ||
      t.includes('CROP') ||
      t.includes('AGRICULTURE') ||
      t.includes('SOIL') ||
      t.includes('IRRIGAT') ||
      title.includes('SPRAY') ||
      title.includes('PEST') ||
      title.includes('CROP') ||
      title.includes('पिका') ||
      title.includes('फसल') ||
      desc.includes('पिका') ||
      desc.includes('फसल')
    );
  };

  const filteredAlerts = activeAlerts.filter((a) => {
    if (!isFarmer && isAgriAlert(a)) return false;
    if (filterTab === 'all' || filterTab === 'active') return true;
    const t = (a.type || '').toUpperCase();
    if (filterTab === 'rain') return t.includes('RAIN') || t.includes('FLOOD') || t.includes('PRECIPITATION');
    if (filterTab === 'spray') return t.includes('SPRAY') || t.includes('WIND') || t.includes('HEAT');
    if (filterTab === 'pest') return t.includes('PEST') || t.includes('DISEASE') || t.includes('FUNGAL');
    return true;
  });

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto px-3 sm:px-4 py-2 font-sans pb-28">
      {/* 1. Official National Weather & Early Warning Bulletin Header */}
      <div className="gov-panel">
        <div className="h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#006B3C]" />
        <div className="p-3.5 sm:p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 border-b border-[#D6DCE1] pb-2">
            <div className="flex items-center gap-2">
              <span className="gov-badge gov-badge-danger flex items-center gap-1 text-[10px]">
                <ShieldAlert className="w-3 h-3" />
                <span>{translatePhrase('liveEarlyWarning', language) || 'EARLY WARNING BULLETIN'}</span>
              </span>
              <span className="text-[11px] text-[#5B6770] font-semibold hidden sm:inline">
                National Weather & Disaster Information
              </span>
            </div>

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="gov-btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1.5 shrink-0"
              title="Refresh Warnings"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#006B3C]' : 'text-[#1F2933]'}`} />
              <span>{translatePhrase('refreshWarnings', language) || 'Refresh'}</span>
            </button>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#17365D] uppercase tracking-wide">
              {isFarmer
                ? (translatePhrase('farmAlertsTitle', language) || 'Meteorological & Agricultural Warning Bulletins')
                : 'Meteorological Hazard & Weather Warning Bulletins'}
            </h1>
            <p className="text-xs text-[#5B6770] pt-0.5">
              {isFarmer
                ? (translatePhrase('farmAlertsSubtitle', language) || 'Official localized advisories issued for crop protection and disaster mitigation')
                : 'Official localized alerts issued for public safety and disaster mitigation'}
            </p>
          </div>

          <div className="pt-1 flex items-center gap-1.5 text-xs text-[#1F2933] font-medium bg-[#F8FAFC] p-2 border border-[#D6DCE1]">
            <MapPin className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
            <span className="truncate">
              {translatePhrase('monitoredLocation', language) || 'Monitored Jurisdiction'}:{' '}
              <strong className="font-bold text-[#17365D]">
                {city}, {district !== city ? `${district}, ` : ''}{state}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Government Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-white border border-[#D6DCE1] rounded-none overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            filterTab === 'all'
              ? 'bg-[#17365D] text-white border-[#17365D]'
              : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
          }`}
        >
          {translatePhrase('all', language) || 'All Bulletins'} ({filteredAlerts.length})
        </button>
        <button
          onClick={() => setFilterTab('active')}
          className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            filterTab === 'active'
              ? 'bg-[#17365D] text-white border-[#17365D]'
              : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
          }`}
        >
          <span>{translatePhrase('activeNow', language) || 'Active Warnings'}</span>
          {filteredAlerts.length > 0 && (
            <span className="w-2 h-2 rounded-none bg-[#B42318]" />
          )}
        </button>
        <button
          onClick={() => setFilterTab('rain')}
          className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
            filterTab === 'rain'
              ? 'bg-[#17365D] text-white border-[#17365D]'
              : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5 text-[#1D5F91]" />
          <span>{translatePhrase('rainAndFlood', language) || 'Rain & Flooding'}</span>
        </button>
        {isFarmer && (
          <>
            <button
              onClick={() => setFilterTab('spray')}
              className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                filterTab === 'spray'
                  ? 'bg-[#17365D] text-white border-[#17365D]'
                  : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
              }`}
            >
              <Sprout className="w-3.5 h-3.5 text-[#006B3C]" />
              <span>{translatePhrase('sprayingAndField', language) || 'Agromet Operations'}</span>
            </button>
            <button
              onClick={() => setFilterTab('pest')}
              className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                filterTab === 'pest'
                  ? 'bg-[#17365D] text-white border-[#17365D]'
                  : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-[#B7791F]" />
              <span>{translatePhrase('pestAndDisease', language) || 'Pest & Disease'}</span>
            </button>
          </>
        )}
        <button
          onClick={() => setFilterTab('history')}
          className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            filterTab === 'history'
              ? 'bg-[#17365D] text-white border-[#17365D]'
              : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
          }`}
        >
          {translatePhrase('recentAlerts', language) || 'Archived Records'} ({historyAlerts.length})
        </button>
      </div>

      {/* 3. Bulletins Content */}
      {loading ? (
        <div className="gov-panel p-8 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-[#006B3C] animate-spin" />
          <p className="text-xs font-bold text-[#1F2933] uppercase tracking-wide">
            {translatePhrase('evaluatingAlerts', language) || 'Retrieving Official Meteorological Data...'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* SECTION 1: ACTIVE WARNINGS */}
          {filterTab !== 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase text-[#17365D] tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#006B3C]" />
                  <span>
                    {translatePhrase('activeNow', language) || 'Active Warnings'} ({filteredAlerts.length})
                  </span>
                </h2>
              </div>

              {filteredAlerts.length === 0 ? (
                <div className="gov-panel p-4 flex items-center gap-3 border-l-4 border-l-[#006B3C]">
                  <div className="w-9 h-9 bg-emerald-50 border border-emerald-200 text-[#006B3C] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
                      {translatePhrase('noAlertsTitle', language) || 'No Severe Weather Warnings Active'}
                    </h3>
                    <p className="text-xs text-[#5B6770] pt-0.5">
                      {translatePhrase('noAlertsDesc', language) || 'Current atmospheric conditions are within normal baseline thresholds for this district.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => {
                    const style = getSeverityStyle(alert.severity);
                    return (
                      <div
                        key={alert.id}
                        className={`gov-panel ${style.borderAccent} p-3.5 space-y-2.5`}
                      >
                        {/* Bulletin Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-[#D6DCE1] pb-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-1.5 ${style.iconBg} shrink-0 mt-0.5`}>
                              {getAlertIcon(alert.type)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-[#1F2933] leading-snug">
                                {alert.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5B6770] pt-0.5">
                                <span className="inline-flex items-center gap-1 text-[#1F2933] font-semibold">
                                  <MapPin className="w-3 h-3 text-[#006B3C]" />
                                  <span>{alert.location_name}</span>
                                </span>
                                <span>|</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#5B6770]" />
                                  <span>Valid: {formatTimestamp(alert.valid_until)}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`gov-badge ${style.badgeClass}`}>
                              {style.label}
                            </span>
                          </div>
                        </div>

                        {/* Bulletin Body */}
                        <p className="text-xs text-[#1F2933] leading-relaxed">
                          {alert.description}
                        </p>

                        {/* Advisory Recommendations */}
                        {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                          <div className={`p-2.5 ${style.boxBg} border text-xs space-y-1`}>
                            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#17365D]">
                              <AlertCircle className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
                              <span>{translatePhrase('cropImpact', language) || 'Mandatory Field Advisory'}</span>
                            </div>
                            <p className="text-xs text-[#1F2933] pl-4">
                              {alert.recommended_actions[0]}
                            </p>
                          </div>
                        )}

                        {/* Bulletin Actions */}
                        <div className="pt-2 border-t border-[#D6DCE1] flex flex-wrap items-center justify-end gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAskAgriAI(alert.title, alert.description)}
                              className="gov-btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1"
                              title="Consult WeatherGPT Advisory Desk"
                            >
                              <MessageSquare className="w-3 h-3 text-[#006B3C]" />
                              <span>{translatePhrase('askAgriAI', language) || 'Agromet Query'}</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedAlert(alert);
                                handleMarkRead(alert.id);
                              }}
                              className={`${style.actionBtn} px-2.5 py-1 text-[11px] flex items-center gap-1`}
                            >
                              <span>{translatePhrase('viewDetails', language) || 'Full Bulletin'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: ARCHIVED RECORDS */}
          {(filterTab === 'all' || filterTab === 'history') && historyAlerts.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h2 className="text-xs font-bold uppercase text-[#5B6770] tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#5B6770]" />
                <span>
                  {translatePhrase('historyTitle', language) || 'Historical Warning Archive'} ({historyAlerts.length})
                </span>
              </h2>

              <div className="gov-panel overflow-x-auto">
                <table className="gov-table min-w-[420px] sm:min-w-full">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap">{language === 'mr' ? 'दिनांक / वेळ' : language === 'hi' ? 'दिनांक / समय' : 'Date / Time'}</th>
                      <th>{language === 'mr' ? 'धोका प्रकार' : language === 'hi' ? 'खतरा प्रकार' : 'Hazard Type'}</th>
                      <th>{language === 'mr' ? 'स्थान' : language === 'hi' ? 'स्थान' : 'Location'}</th>
                      <th className="whitespace-nowrap">{language === 'mr' ? 'तीव्रता' : language === 'hi' ? 'तीव्रता' : 'Severity'}</th>
                      <th className="text-right whitespace-nowrap">{language === 'mr' ? 'कृती' : language === 'hi' ? 'कार्रवाई' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-[#F8FAFC] cursor-pointer" onClick={() => setSelectedAlert(alert)}>
                        <td className="text-[11px] sm:text-xs font-mono whitespace-nowrap">{formatTimestamp(alert.created_at)}</td>
                        <td className="font-medium text-[#1F2933]">{alert.title}</td>
                        <td className="text-[11px] sm:text-xs text-[#5B6770]">{alert.location_name}</td>
                        <td>
                          <span className="gov-badge gov-badge-neutral text-[9px] uppercase whitespace-nowrap">
                            {alert.severity}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <button className="text-[11px] sm:text-xs font-bold text-[#006B3C] hover:underline">
                            {language === 'mr' ? 'पहा' : language === 'hi' ? 'देखें' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
