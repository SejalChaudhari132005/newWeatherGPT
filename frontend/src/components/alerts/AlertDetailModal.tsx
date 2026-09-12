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
          headerBg: 'bg-[#B42318]',
          badgeClass: 'gov-badge-danger',
          icon: ShieldAlert,
          label: 'EMERGENCY WARNING BULLETIN',
        };
      case 'SEVERE':
        return {
          headerBg: 'bg-[#B42318]',
          badgeClass: 'gov-badge-danger',
          icon: ShieldAlert,
          label: 'SEVERE WEATHER BULLETIN',
        };
      case 'WARNING':
        return {
          headerBg: 'bg-[#B7791F]',
          badgeClass: 'gov-badge-warning',
          icon: AlertTriangle,
          label: 'WEATHER WARNING',
        };
      case 'WATCH':
        return {
          headerBg: 'bg-[#B7791F]',
          badgeClass: 'gov-badge-warning',
          icon: AlertTriangle,
          label: 'WEATHER WATCH',
        };
      case 'ADVISORY':
        return {
          headerBg: 'bg-[#006B3C]',
          badgeClass: 'gov-badge-success',
          icon: AlertCircle,
          label: 'AGROMET ADVISORY BULLETIN',
        };
      case 'INFO':
      default:
        return {
          headerBg: 'bg-[#17365D]',
          badgeClass: 'gov-badge-info',
          icon: Info,
          label: 'WEATHER INFORMATION NOTICE',
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
    const speechContent = `${alert.title}. ${alert.description}. Recommended actions: ${alert.recommended_actions?.join('. ') || ''}`;
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
    whatShouldDo: language === 'mr' ? 'काय करावे (कृती योजना)' : language === 'hi' ? 'क्या करें (कार्य योजना)' : 'Recommended Actions (Action Plan)',
    whatToAvoid: language === 'mr' ? 'काय टाळावे (खबरदारी)' : language === 'hi' ? 'क्या न करें (सावधानी)' : 'Precautionary Measures (What to Avoid)',
    source: language === 'mr' ? 'स्रोत:' : language === 'hi' ? 'स्रोत:' : 'Issuing Authority:',
    confidence: language === 'mr' ? 'विश्वसनीयता:' : language === 'hi' ? 'विश्वसनीयता:' : 'Confidence Metric:',
    acknowledge: language === 'mr' ? 'समजले आणि बंद करा' : language === 'hi' ? 'स्वीकारें और बंद करें' : 'Acknowledge & Close',
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#17365D]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans animate-fadeIn">
      <div className="w-full max-w-xl bg-white border border-[#D6DCE1] max-h-[90vh] flex flex-col overflow-hidden shadow-lg">
        {/* Modal Top Government Bar */}
        <div className={`p-3.5 ${badge.headerBg} text-white flex items-center justify-between border-b border-[#D6DCE1]`}>
          <div className="flex items-center gap-2">
            <BadgeIcon className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              title="Listen with BHASHINI Voice"
              className={`px-2 py-1 border text-[11px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                isPlayingAudio
                  ? 'bg-white text-[#B42318] border-white'
                  : 'bg-white/15 text-white border-white/30 hover:bg-white/25'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Title & Metadata Panel */}
          <div className="border-b border-[#D6DCE1] pb-3 space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-[#17365D] leading-snug">
              {alert.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#5B6770]">
              <span className="inline-flex items-center gap-1 text-[#1F2933] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#006B3C]" />
                <span>{alert.location_name}{alert.state ? `, ${alert.state}` : ''}</span>
              </span>

              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#5B6770]" />
                <span>{labels.validUntil} {formatTime(alert.valid_until)}</span>
              </span>
            </div>
          </div>

          {/* Detailed Narrative Description */}
          <div className="p-3 bg-[#F8FAFC] border border-[#D6DCE1] text-xs leading-relaxed text-[#1F2933]">
            {alert.description}
          </div>

          {/* Recommended Actions */}
          {alert.recommended_actions && alert.recommended_actions.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase text-[#006B3C] tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#006B3C]" />
                <span>{labels.whatShouldDo}</span>
              </h3>
              <div className="border border-[#D6DCE1] divide-y divide-[#D6DCE1]">
                {alert.recommended_actions.map((act, idx) => (
                  <div key={idx} className="p-2.5 bg-white text-xs text-[#1F2933] flex items-start gap-2">
                    <span className="font-bold text-[#006B3C] shrink-0">{idx + 1}.</span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to Avoid */}
          {alert.what_to_avoid && alert.what_to_avoid.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase text-[#B42318] tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-[#B42318]" />
                <span>{labels.whatToAvoid}</span>
              </h3>
              <div className="border border-[#D6DCE1] divide-y divide-[#D6DCE1]">
                {alert.what_to_avoid.map((avoid, idx) => (
                  <div key={idx} className="p-2.5 bg-red-50/50 text-xs text-[#1F2933] flex items-start gap-2">
                    <span className="font-bold text-[#B42318] shrink-0">!</span>
                    <span>{avoid}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 border-t border-[#D6DCE1] bg-[#F8FAFC] flex items-center justify-end gap-2">
          <button
            onClick={() => {
              if (onMarkRead) onMarkRead(alert.id);
              onClose();
            }}
            className="gov-btn-primary px-4 py-2 text-xs uppercase font-bold cursor-pointer"
          >
            {labels.acknowledge}
          </button>
        </div>
      </div>
    </div>
  );
};
