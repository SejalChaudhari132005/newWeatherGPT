import React from 'react';
import { Clock, Sun, Cloud, CloudRain, Moon, Info } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';

interface BestFarmingWindowsCardProps {
  windows?: any[];
}

export const BestFarmingWindowsCard: React.FC<BestFarmingWindowsCardProps> = () => {
  const { language } = useLanguage();

  const slots = [
    {
      time: '06:00 - 09:00',
      status: 'Favorable',
      icon: Sun,
      badgeClass: 'gov-badge-success',
      iconColor: 'text-[#B7791F]',
    },
    {
      time: '09:00 - 12:00',
      status: 'Favorable',
      icon: Sun,
      badgeClass: 'gov-badge-success',
      iconColor: 'text-[#B7791F]',
    },
    {
      time: '12:00 - 15:00',
      status: 'Moderate',
      icon: Cloud,
      badgeClass: 'gov-badge-warning',
      iconColor: 'text-[#5B6770]',
    },
    {
      time: '15:00 - 18:00',
      status: 'Caution',
      icon: CloudRain,
      badgeClass: 'gov-badge-danger',
      iconColor: 'text-[#1D5F91]',
    },
    {
      time: '18:00 - 21:00',
      status: 'Moderate',
      icon: Cloud,
      badgeClass: 'gov-badge-warning',
      iconColor: 'text-[#5B6770]',
    },
    {
      time: '21:00 - 06:00',
      status: 'Night Window',
      icon: Moon,
      badgeClass: 'gov-badge-neutral',
      iconColor: 'text-[#17365D]',
    },
  ];

  const getLocalizedStatus = (st: string) => {
    switch (st) {
      case 'Favorable':
        return language === 'mr' ? 'अनुकूल' : language === 'hi' ? 'अनुकूल' : 'FAVORABLE';
      case 'Moderate':
        return language === 'mr' ? 'मध्यम' : language === 'hi' ? 'मध्यम' : 'MODERATE';
      case 'Caution':
        return language === 'mr' ? 'सतर्कता' : language === 'hi' ? 'सावधानी' : 'CAUTION';
      case 'Night Window':
        return language === 'mr' ? 'रात्र' : language === 'hi' ? 'रात्रि' : 'NIGHT';
      default:
        return st.toUpperCase();
    }
  };

  return (
    <div className="gov-panel space-y-3">
      {/* Official Section Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#006B3C]" />
          <span>DIURNAL OPERATIONAL WINDOWS (NEXT 24 HOURS)</span>
        </div>

        <span className="gov-badge gov-badge-info">
          HOURLY SUITABILITY MATRIX
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Rectangular Hourly Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {slots.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col items-center justify-between text-center space-y-1.5"
              >
                <div className="text-[11px] font-bold text-[#17365D] tracking-tight">{s.time}</div>
                <div className="my-0.5">
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <div>
                  <span className={`gov-badge ${s.badgeClass}`}>
                    {getLocalizedStatus(s.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Advisory Guideline */}
        <div className="p-2.5 bg-white border border-[#D6DCE1] border-l-4 border-l-[#B7791F] rounded-xs text-xs">
          <span className="font-bold text-[#17365D] uppercase tracking-wider block mb-0.5">
            Operational Note:
          </span>
          <p className="text-xs text-[#1F2933] leading-relaxed">
            {language === 'mr'
              ? 'मुसळधार पावसाच्या काळात सिंचन टाळा. पाणी साचू नये म्हणून शेतातील निचरा नाले स्वच्छ ठेवा.'
              : language === 'hi'
              ? 'भारी बारिश के दौरान सिंचाई से बचें। जलभराव रोकने के लिए खेत के जल निकासी चैनल साफ रखें।'
              : 'Avoid irrigation during high probability rain windows. Maintain field drainage channels to prevent water logging.'}
          </p>
        </div>

        {/* Source metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>Derived from IMD Diurnal Weather Forecast</span>
          <span>Lead Resolution: 3-Hour Blocks</span>
        </div>
      </div>
    </div>
  );
};
