import React from 'react';
import {
  Sprout,
  Edit3,
  Calendar,
  ChevronRight,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  CloudLightning,
  CloudSnow,
  Wheat,
} from 'lucide-react';
import { FarmProfile } from '../../../types/farm';
import { useLanguage } from '../../../context/LanguageContext';
import {
  translateCrop,
  translateGrowthStage,
  translatePhrase,
  translateCondition,
} from '../../../utils/dashboardTranslator';

interface FarmerSummaryWeatherCardProps {
  farm: FarmProfile | null;
  weather?: any;
  onOpenManageFarm?: () => void;
  onOpenForecast?: () => void;
}

export const FarmerSummaryWeatherCard: React.FC<FarmerSummaryWeatherCardProps> = ({
  farm,
  onOpenManageFarm,
}) => {
  const { language } = useLanguage();

  const farmName = farm?.farm_name || 'My Farm';
  const primaryCrop = farm?.primary_crop || 'rice';
  const cropVariety = farm?.crop_variety || 'Kolam';
  const farmSize = farm?.farm_size ?? 2.5;
  const farmSizeUnit = farm?.farm_size_unit || 'Acres';

  return (
    <div className="w-full bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
      {/* Farm Avatar + Identity Details + Main Farm Badge + Manage Farm Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Farm Avatar Illustration */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 via-emerald-200 to-teal-300 p-0.5 shadow-sm shrink-0 flex items-center justify-center overflow-hidden border border-emerald-300">
            <div className="w-full h-full rounded-[14px] bg-[#E8F8EE] flex items-center justify-center">
              <span className="text-2xl select-none">🏡</span>
            </div>
          </div>

          {/* Farm Identity Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                {farmName}
              </h2>
            </div>
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-600 font-semibold mt-0.5">
              <span>{translateCrop(primaryCrop, language)}</span>
              <span>•</span>
              <span className="text-slate-700 font-bold">{cropVariety}</span>
              <span>•</span>
              <span>
                {farmSize} {farmSizeUnit}
              </span>
              <span className="ml-1 inline-flex items-center px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200/80">
                {language === 'mr' ? 'मुख्य शेत' : language === 'hi' ? 'मुख्य खेत' : 'Main Farm'}
              </span>
            </div>
          </div>
        </div>

        {/* Manage Farm Button (Solid Green) */}
        {onOpenManageFarm && (
          <button
            type="button"
            onClick={onOpenManageFarm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shrink-0 shadow-md shadow-emerald-600/25 active:scale-95 border border-emerald-500"
            title="Update Farm Profile"
          >
            <Edit3 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            <span>{language === 'mr' ? 'शेत व्यवस्थापन' : language === 'hi' ? 'खेत प्रबंधन' : 'Manage Farm'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
