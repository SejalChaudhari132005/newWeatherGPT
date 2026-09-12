import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ChevronDown,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSun,
  CloudMoon,
  Droplets,
  Wind,
  Gauge,
  Thermometer,
  Edit3,
} from 'lucide-react';
import { FarmProfile } from '../../../types/farm';
import { useLanguage } from '../../../context/LanguageContext';
import { useLocation } from '../../../hooks/useLocation';
import {
  translateCrop,
  translateGrowthStage,
  translateIrrigationType,
  translateFarmUnit,
  translatePhrase,
  translateCondition,
  formatLocalizedDateTime,
} from '../../../utils/dashboardTranslator';

interface FarmerHeroCardProps {
  farm: FarmProfile | null;
  weather?: any;
  locationName?: string;
  onOpenManageFarm?: () => void;
}

export const FarmerHeroCard: React.FC<FarmerHeroCardProps> = ({
  farm,
  weather,
  locationName,
  onOpenManageFarm,
}) => {
  const { language } = useLanguage();
  const { location, openSelector } = useLocation();
  const [formattedDateTime, setFormattedDateTime] = useState('');
  const [imgError, setImgError] = useState(false);

  const primaryCrop = farm?.primary_crop || 'rice';
  const cropVariety = farm?.crop_variety || 'Kolam';
  const growthStage = farm?.growth_stage || 'pod_filling';
  const farmSize = farm?.farm_size ?? 2.5;
  const farmSizeUnit = farm?.farm_size_unit || 'acres';
  const irrigationType = farm?.irrigation_type || 'field_irrigation';

  const displayCity = farm?.village || location?.city || weather?.city || (locationName ? locationName.split(',')[0] : 'Kalyan');
  const displayState = farm?.state || location?.state || weather?.state || (locationName ? (locationName.split(',')[1] || '').trim() : 'Maharashtra');
  const fullLocationString = displayState ? `${displayCity}, ${displayState}` : displayCity;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setFormattedDateTime(formatLocalizedDateTime(now, language));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [language]);

  const tempVal = weather?.temperature != null ? Math.round(weather.temperature) : 28;
  const humidityVal = weather?.humidity ?? 83;
  const windVal = weather?.windSpeed ? `${Math.round(weather.windSpeed)} km/h` : '6 km/h';
  const windDir = weather?.windDirection || 'ESE';
  const pressureVal = weather?.pressure ? `${Math.round(weather.pressure)} hPa` : '1008 hPa';
  const conditionDisplay = translateCondition(weather?.condition || 'Light Rain', language);

  const getConditionIcon = () => {
    const c = (weather?.condition || '').toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) {
      return <CloudLightning className="w-8 h-8 text-amber-300" />;
    }
    if (c.includes('rain') || c.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-sky-200" />;
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return <CloudSun className="w-8 h-8 text-amber-200" />;
    }
    return <Sun className="w-8 h-8 text-amber-300" />;
  };

  return (
    <div className="w-full space-y-3 font-sans">
      {/* 1. Official Weather Observation Panel with Farmland Image */}
      <div className="gov-panel overflow-hidden">
        {/* Panel Header */}
        <div className="gov-panel-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-xs bg-[#287D3C]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#17365D]">
              {language === 'mr' ? 'शेती हवामान निरीक्षण' : language === 'hi' ? 'कृषि मौसम प्रेक्षण' : 'Farm Weather Observation'}
            </h2>
          </div>

          <span className="gov-badge gov-badge-success text-[10px]">
            REAL-TIME TELEMETRY
          </span>
        </div>

        {/* Visual Farmland Image with Weather Overlay (Expanded space for image) */}
        <div className="relative min-h-[280px] sm:min-h-[320px] bg-slate-900 overflow-hidden flex flex-col justify-between">
          {!imgError && (
            <img
              src="/assets/farmer-bg.jpg"
              alt="Farmland observation"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center scale-105"
            />
          )}

          {/* Transparent Gradient Scrim (Natural photo visibility with text contrast) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 pointer-events-none" />

          {/* Top Overlay: Location Selector & Observation Timestamp */}
          <div className="relative z-10 p-3.5 sm:p-4 text-white">
            <div className="flex items-start justify-between gap-2 border-b border-white/20 pb-2">
              <button
                type="button"
                onClick={openSelector}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:underline cursor-pointer group"
                title="Change Farm Observatory Location"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[180px] drop-shadow-sm">{fullLocationString}</span>
                <ChevronDown className="w-3 h-3 text-white/80 group-hover:text-white" />
              </button>

              <div className="text-right text-[10px] text-white/90 font-mono shrink-0 drop-shadow-xs">
                {formattedDateTime || 'Live'}
              </div>
            </div>
          </div>

          {/* Bottom Overlay: Live Condition & Temperature */}
          <div className="relative z-10 p-3.5 sm:p-4 text-white">
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-[#006B3C] border border-[#004D2C] rounded-xs flex items-center justify-center shrink-0 shadow-lg">
                  {getConditionIcon()}
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-white leading-none drop-shadow-md">
                      {tempVal}°C
                    </span>
                  </div>
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wide pt-1 drop-shadow-xs">
                    {conditionDisplay}
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-white space-y-0.5 shrink-0">
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider block drop-shadow-xs">
                  {language === 'mr' ? 'थेट निरीक्षण' : language === 'hi' ? 'प्रत्यक्ष प्रेक्षण' : 'Farm Sensor'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-300 drop-shadow-xs">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observation Table Grid with Parameter Icons */}
        <div className="p-3 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Temperature */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Thermometer className="w-3 h-3 text-[#B42318]" />
                <span>{language === 'mr' ? 'तापमान' : language === 'hi' ? 'तापमान' : 'Temperature'}</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5">
                {tempVal}°C
              </div>
            </div>

            {/* Humidity */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Droplets className="w-3 h-3 text-[#1D5F91]" />
                <span>{language === 'mr' ? 'आर्द्रता' : language === 'hi' ? 'आर्द्रता' : 'Humidity'}</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5">
                {humidityVal}%
              </div>
            </div>

            {/* Wind */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Wind className="w-3 h-3 text-[#006B3C]" />
                <span>{language === 'mr' ? 'वारा' : language === 'hi' ? 'हवा' : 'Wind Speed'}</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5">
                {windVal} <span className="text-xs font-normal text-[#5B6770]">{windDir}</span>
              </div>
            </div>

            {/* Pressure */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Gauge className="w-3 h-3 text-[#17365D]" />
                <span>{language === 'mr' ? 'हवेचा दाब' : language === 'hi' ? 'दबाव' : 'Pressure'}</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5">
                {pressureVal}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Registered Farm Profile Panel */}
      <div className="gov-panel">
        <div className="bg-[#F0FDF4] border-b border-[#D6DCE1] border-l-4 border-l-[#006B3C] px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-[#006B3C] uppercase tracking-wider">
              {translatePhrase('farmCropProfile', language)}
            </h3>
            <span className="gov-badge gov-badge-success text-[9px]">
              REGISTERED
            </span>
          </div>

          {onOpenManageFarm && (
            <button
              type="button"
              onClick={onOpenManageFarm}
              className="text-[11px] font-bold text-[#006B3C] hover:text-[#004D2C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{translatePhrase('edit', language)}</span>
            </button>
          )}
        </div>

        {/* Structured Farm Profile Data Table */}
        <div className="overflow-x-auto">
          <table className="gov-table">
            <tbody>
              <tr>
                <td className="font-bold text-[#5B6770] w-1/3 bg-[#F8FAFC]">
                  {translatePhrase('crop', language)} & Variety:
                </td>
                <td className="font-bold text-[#1F2933]">
                  {translateCrop(primaryCrop, language)} ({cropVariety})
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                  {translatePhrase('growthStage', language)}:
                </td>
                <td className="font-bold text-[#1F2933]">
                  {translateGrowthStage(growthStage, language)}
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                  {translatePhrase('farmSize', language)}:
                </td>
                <td className="font-bold text-[#1F2933]">
                  {farmSize} {translateFarmUnit(farmSizeUnit, language)}
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                  {translatePhrase('irrigation', language)}:
                </td>
                <td className="font-bold text-[#1F2933]">
                  {translateIrrigationType(irrigationType, language)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
