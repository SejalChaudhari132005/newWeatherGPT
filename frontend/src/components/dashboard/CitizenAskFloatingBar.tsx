import React from 'react';
import { MessageSquare, Mic, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  onOpenChat: () => void;
  onOpenVoice?: () => void;
}

export const CitizenAskFloatingBar: React.FC<Props> = ({
  onOpenChat,
  onOpenVoice,
}) => {
  const { language } = useLanguage();

  return (
    <div
      onClick={onOpenChat}
      className="p-3 bg-white border border-[#D6DCE1] rounded-xs shadow-none hover:border-[#006B3C] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xs bg-[#006B3C] text-white flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
            {translatePhrase('officialAdvisoryDesk', language)}
          </h4>
          <p className="text-[11px] text-[#5B6770] font-normal truncate">
            {translatePhrase('askWeatherGptDesc', language)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenVoice) onOpenVoice();
            else onOpenChat();
          }}
          className="p-1.5 rounded-xs bg-[#006B3C] hover:bg-[#004D2C] border border-[#004D2C] text-white transition-colors cursor-pointer"
          title="Voice query"
        >
          <Mic className="w-3.5 h-3.5 text-white" />
        </button>
        <div className="gov-btn-green px-2.5 py-1 text-[11px] font-bold uppercase flex items-center gap-1">
          <span>{translatePhrase('ask', language)}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
