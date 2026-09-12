import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { FarmActivityItem } from '../../../../services/farmRouteEngine';
import { useLanguage } from '../../../../context/LanguageContext';

interface FarmRouteActivityDetailModalProps {
  activity: FarmActivityItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAskGpt?: (prompt: string) => void;
}

export const FarmRouteActivityDetailModal: React.FC<FarmRouteActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  onAskGpt,
}) => {
  const { language } = useLanguage();

  if (!isOpen || !activity) return null;

  const actName = activity.localizedActivityName?.[language] || activity.activityName;
  const statusText = activity.localizedStatusBadge?.[language] || activity.statusBadge;
  const reasonText = activity.localizedSummaryReason?.[language] || activity.summaryReason;

  const handleAskWeatherGpt = () => {
    if (onAskGpt) {
      const prompt =
        language === 'mr'
          ? `मला आजच्या ${actName} कामाबद्दल अधिक सांगा (${activity.timeWindow}). हवामानानुसार काय काळजी घ्यावी?`
          : language === 'hi'
          ? `मुझे आज के ${actName} कार्य (${activity.timeWindow}) के बारे में अधिक जानकारी दें। मौसम अनुसार क्या सावधानी रखनी चाहिए?`
          : `Give me detailed guidance for ${activity.activityName} today between ${activity.timeWindow}. What precautions should I take?`;
      onAskGpt(prompt);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#17365D]/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-xs border border-[#D6DCE1] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between">
        {/* Top Header */}
        <div className="bg-[#17365D] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              ACTIVITY SPECIFICATION & GUIDELINES
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xs bg-[#0F233D] hover:bg-[#081525] border border-[#2A4D7A] text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Main Title & Time Block */}
          <div className="flex items-center justify-between border-b border-[#D6DCE1] pb-2.5">
            <div>
              <h3 className="text-base font-bold text-[#1F2933] uppercase">{actName}</h3>
              <div className="flex items-center gap-1 text-xs text-[#5B6770] font-semibold mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#1D5F91]" />
                <span>Scheduled Window: {activity.timeWindow}</span>
              </div>
            </div>
            <span className="gov-badge gov-badge-success">{statusText.toUpperCase()}</span>
          </div>

          {/* Suitability Score Table */}
          {activity.suitabilityScore !== null && (
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider block">
                  Suitability Assessment
                </span>
                <p className="text-xs text-[#1F2933] font-medium mt-0.5">
                  {reasonText}
                </p>
              </div>
              <div className="text-xl font-bold text-[#006B3C] pl-3 border-l border-[#D6DCE1] shrink-0">
                {activity.suitabilityScore} <span className="text-xs font-normal text-[#5B6770]">/ 100</span>
              </div>
            </div>
          )}

          {/* Meteorological Parameters Checklist */}
          {activity.whyPoints && activity.whyPoints.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#17365D] uppercase tracking-wider block">
                Meteorological Evaluation Factors:
              </span>
              <div className="space-y-1">
                {activity.whyPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#1F2933] p-1.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006B3C] shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caution Alert */}
          {activity.avoidAfter && (
            <div className="p-2.5 bg-white border border-[#D6DCE1] border-l-4 border-l-[#B42318] rounded-xs text-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B42318] uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B42318] shrink-0" />
                <span>
                  {language === 'mr'
                    ? `मर्यादा: ${activity.avoidAfter} नंतर काम थांबवा`
                    : language === 'hi'
                    ? `प्रतिबंध: ${activity.avoidAfter} के बाद कार्य रोकें`
                    : `RESTRICTION: Conclude prior to ${activity.avoidAfter}`}
                </span>
              </div>
              {activity.avoidReason && (
                <p className="text-xs text-[#5B6770] mt-1 pl-5 font-medium">
                  {activity.avoidReason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 bg-[#F8FAFC] border-t border-[#D6DCE1] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3 rounded-xs bg-white border border-[#D6DCE1] text-[#1F2933] text-xs font-bold hover:bg-[#F1F5F9] transition-colors cursor-pointer uppercase tracking-wider"
          >
            {language === 'mr' ? 'बंद करा' : language === 'hi' ? 'बंद करें' : 'CLOSE'}
          </button>

          <button
            type="button"
            onClick={handleAskWeatherGpt}
            className="py-1.5 px-3.5 rounded-xs bg-[#006B3C] hover:bg-[#00522E] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'तज्ञांचा सल्ला घ्या' : language === 'hi' ? 'सलाह लें' : 'QUERY DESK'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
