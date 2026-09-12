import React from 'react';
import { AlertTriangle, ArrowRight, CloudRain, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  alert?: {
    title?: string;
    description?: string;
  } | null;
  locationName?: string;
  rainProbability?: number;
  onViewDetails?: () => void;
}

export const CitizenAlertBanner: React.FC<Props> = ({
  alert,
  locationName = 'Kalyan-Dombivli',
  rainProbability = 86,
  onViewDetails,
}) => {
  const { language } = useLanguage();
  const city = locationName.split(',')[0].trim() || 'Your City';

  // Dynamic rainfall advisory based on language and real rain probability
  let title = alert?.title;
  let description = alert?.description;

  if (!title) {
    if (rainProbability >= 40) {
      if (language === 'mr') {
        title = `${city} साठी पावसाचा अंदाज (${rainProbability}%)`;
        description = `पुढील काही तासांत पावसाची शक्यता आहे. आवश्यक खबरदारी घ्या.`;
      } else if (language === 'hi') {
        title = `${city} के लिए वर्षा अनुमान (${rainProbability}%)`;
        description = `अगले कुछ घंटों में वर्षा की संभावना है। कृपया सावधानी बरतें।`;
      } else {
        title = `IMD Rainfall Advisory: ${city} (${rainProbability}% Chance)`;
        description = `Elevated precipitation probability detected for current observation sector.`;
      }
    } else {
      if (language === 'mr') {
        title = `${city} साठी नियमित हवामान बुलेटिन`;
        description = `हवामान सामान्य मर्यादेत आहे. कोणताही गंभीर इशारा नाही.`;
      } else if (language === 'hi') {
        title = `${city} के लिए नियमित मौसम बुलेटिन`;
        description = `मौसम सामान्य है। कोई गंभीर चेतावनी सक्रिय नहीं है।`;
      } else {
        title = `Meteorological Notice: ${city}`;
        description = `Standard meteorological conditions prevailing. No active disaster warnings.`;
      }
    }
  }

  const isRain = rainProbability >= 40 || title?.toLowerCase().includes('rain') || title?.toLowerCase().includes('पावसा') || title?.toLowerCase().includes('shower');

  return (
    <div className={`gov-panel p-3 flex items-center justify-between gap-3 border-l-4 ${isRain ? 'border-l-[#B7791F]' : 'border-l-[#1D5F91]'}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-xs flex items-center justify-center shrink-0 border ${isRain ? 'bg-[#D97706] border-[#B45309] text-white' : 'bg-[#17365D] border-[#0F233D] text-white'}`}>
          {isRain ? (
            <CloudRain className="w-4 h-4 text-white" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#1F2933] uppercase tracking-wide truncate">
            {title}
          </h4>
          <p className="text-[11px] text-[#5B6770] font-medium truncate">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onViewDetails}
        className="gov-btn-secondary px-3 py-1.5 text-[11px] flex items-center gap-1 shrink-0 font-bold uppercase cursor-pointer"
      >
        <span>{translatePhrase('details', language)}</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
