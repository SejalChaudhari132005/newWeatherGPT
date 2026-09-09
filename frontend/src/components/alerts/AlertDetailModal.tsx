import React from 'react';
import { CitizenAlert, AlertSeverity } from '../../types/alert';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Info,
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { bhashiniVoiceService } from '../../services/bhashiniVoiceService';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  alert: CitizenAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
}

export const AlertDetailModal: React.FC<Props> = ({
  alert,
  isOpen,
  onClose,
  onMarkRead,
}) => {
  const { language } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  if (!isOpen || !alert) return null;

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'EMERGENCY':
        return {
          bg: 'bg-red-600 text-white border-red-700',
          icon: ShieldAlert,
          label: '🚨 EMERGENCY ALERT',
        };
      case 'SEVERE':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: ShieldAlert,
          label: '⚠️ SEVERE WARNING',
        };
      case 'WARNING':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: AlertTriangle,
          label: '⚠️ WEATHER WARNING',
        };
      case 'WATCH':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: AlertTriangle,
          label: '👁 WEATHER WATCH',
        };
      case 'ADVISORY':
        return {
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: AlertCircle,
          label: '🌧 WEATHER ADVISORY',
        };
      case 'INFO':
      default:
        return {
          bg: 'bg-sky-100 text-sky-800 border-sky-300',
          icon: Info,
          label: 'ℹ WEATHER NOTICE',
        };
    }
  };

  const badge = getSeverityBadge(alert.severity);
  const BadgeIcon = badge.icon;

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return isoString;
    }
  };

  const handleSpeak = () => {
    if (isPlayingAudio) {
      bhashiniVoiceService.stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }
    const speechContent = `${alert.title}. ${alert.description}. Recommended actions: ${alert.recommended_actions.join('. ')}`;
    setIsPlayingAudio(true);
    bhashiniVoiceService.speakText(
      speechContent,
      language,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  const labels = {
    validUntil: language === 'mr' ? 'वैधता:' : language === 'hi' ? 'वैधता:' : 'Valid until:',
    whatShouldDo: language === 'mr' ? 'तुम्ही काय करावे' : language === 'hi' ? 'आपको क्या करना चाहिए' : 'What You Should Do',
    whatToAvoid: language === 'mr' ? 'काय टाळावे' : language === 'hi' ? 'किन बातों से बचें' : 'What To Avoid',
    source: language === 'mr' ? 'स्रोत:' : language === 'hi' ? 'स्रोत:' : 'Source:',
    confidence: language === 'mr' ? 'विश्वसनीयता:' : language === 'hi' ? 'विश्वसनीयता:' : 'Confidence:',
    acknowledge: language === 'mr' ? 'समजले आणि बंद करा' : language === 'hi' ? 'स्वीकारें और बंद करें' : 'Acknowledge & Close',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-['Arimo'] animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${badge.bg}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              title="Listen with BHASHINI Voice"
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isPlayingAudio
                  ? 'bg-sky-500 text-white border-sky-600 animate-pulse'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Title & Location */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {alert.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
              <span className="inline-flex items-center gap-1 text-[#004aad]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{alert.location_name}{alert.state ? `, ${alert.state}` : ''}</span>
              </span>

              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{labels.validUntil} {formatTime(alert.valid_until)}</span>
              </span>
            </div>
          </div>

          {/* Detailed Narrative Description */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm leading-relaxed text-slate-800 font-medium">
            {alert.description}
          </div>

          {/* What You Should Do */}
          {alert.recommended_actions && alert.recommended_actions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{labels.whatShouldDo}</span>
              </h3>
              <ul className="space-y-2">
                {alert.recommended_actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs font-bold text-emerald-950">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to Avoid */}
          {alert.what_to_avoid && alert.what_to_avoid.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-rose-800 tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{labels.whatToAvoid}</span>
              </h3>
              <ul className="space-y-2">
                {alert.what_to_avoid.map((avoid, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs font-bold text-rose-950">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0 mt-1.5" />
                    <span>{avoid}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transparent Source & Confidence Attribution */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>{labels.source} <strong className="text-slate-800">{alert.source}</strong></span>
            </div>

            {alert.confidence && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                {labels.confidence} {Math.round(alert.confidence * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (onMarkRead) onMarkRead(alert.id);
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#004aad] hover:bg-[#003882] text-white text-xs font-extrabold shadow-md cursor-pointer transition-all text-center"
          >
            {labels.acknowledge}
          </button>
        </div>
      </div>
    </div>
  );
};
