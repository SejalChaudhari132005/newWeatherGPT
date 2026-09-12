import React from 'react';
import {
  CloudRain,
  Droplets,
  Wind,
  CloudSun,
  Sun,
  CloudLightning,
  Cloud,
  ChevronRight,
  Gauge,
} from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import { translateCondition } from '../../../../utils/dashboardTranslator';

interface FarmRouteWeatherSnapshotProps {
  temperature?: number;
  condition?: string;
  humidity?: number;
  windSpeed?: number;
  windDirection?: string;
  rainfallToday?: number;
  weatherCode?: number;
  onOpenForecast?: () => void;
}

export const FarmRouteWeatherSnapshot: React.FC<FarmRouteWeatherSnapshotProps> = ({
  temperature = 27.4,
  condition = 'Light Rain',
  humidity = 83,
  windSpeed = 6.2,
  windDirection = 'ESE',
  rainfallToday = 8.4,
  weatherCode = 51,
  onOpenForecast,
}) => {
  const { language } = useLanguage();

  const renderIcon = () => {
    const c = (condition || '').toLowerCase();
    if (weatherCode >= 95 || c.includes('thunder') || c.includes('storm')) {
      return <CloudLightning className="w-6 h-6 text-purple-700 stroke-[2]" />;
    }
    if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || c.includes('rain') || c.includes('drizzle')) {
      return <CloudRain className="w-6 h-6 text-[#1D5F91] stroke-[2]" />;
    }
    if ((weatherCode >= 1 && weatherCode <= 3) || c.includes('partly')) {
      return <CloudSun className="w-6 h-6 text-[#B7791F] stroke-[2]" />;
    }
    if (weatherCode === 0 || c.includes('clear') || c.includes('sun')) {
      return <Sun className="w-6 h-6 text-[#B7791F] stroke-[2]" />;
    }
    return <Cloud className="w-6 h-6 text-[#5B6770] stroke-[2]" />;
  };

  return (
    <div className="gov-panel space-y-3">
      {/* Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#006B3C]" />
          <span>CURRENT METEOROLOGICAL TELEMETRY</span>
        </div>

        {onOpenForecast && (
          <button
            type="button"
            onClick={onOpenForecast}
            className="text-[11px] font-bold text-[#006B3C] hover:underline flex items-center gap-0.5 cursor-pointer uppercase tracking-wider"
          >
            <span>{language === 'mr' ? '७ दिवसांचा अंदाज' : language === 'hi' ? '७ दिन पूर्वानुमान' : '7-DAY BULLETIN'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Main Observation Row + 3 Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* Main Temp & Condition */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex items-center gap-3">
            <div className="p-2 bg-white border border-[#D6DCE1] rounded-xs text-[#006B3C] shrink-0">
              {renderIcon()}
            </div>
            <div>
              <div className="text-xl font-bold text-[#1F2933]">
                {temperature.toFixed(1)}°C
              </div>
              <div className="text-xs font-semibold text-[#5B6770]">
                {translateCondition(condition, language)}
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <Droplets className="w-3.5 h-3.5 text-[#1D5F91]" />
              <span>{language === 'mr' ? 'आर्द्रता' : language === 'hi' ? 'आर्द्रता' : 'Relative Humidity'}</span>
            </div>
            <div className="text-lg font-bold text-[#1F2933] mt-1">
              {humidity}%
            </div>
            <span className="text-[10px] text-[#5B6770]">RH Level</span>
          </div>

          {/* Wind */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <Wind className="w-3.5 h-3.5 text-[#1D5F91]" />
              <span>{language === 'mr' ? 'वारा' : language === 'hi' ? 'हवा' : 'Wind Vector'}</span>
            </div>
            <div className="text-lg font-bold text-[#1F2933] mt-1">
              {windSpeed} <span className="text-xs font-semibold text-[#5B6770]">km/h</span>
            </div>
            <span className="text-[10px] text-[#5B6770]">Dir: {windDirection}</span>
          </div>

          {/* Rain */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <CloudRain className="w-3.5 h-3.5 text-[#1D5F91]" />
              <span>{language === 'mr' ? 'पाऊस' : language === 'hi' ? 'वर्षा' : 'Rainfall (24h)'}</span>
            </div>
            <div className="text-lg font-bold text-[#1D5F91] mt-1">
              {rainfallToday.toFixed(1)} <span className="text-xs font-semibold text-[#5B6770]">mm</span>
            </div>
            <span className="text-[10px] text-[#5B6770]">Observed Gage</span>
          </div>
        </div>

        {/* Telemetry metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>Surface Observation Telemetry</span>
          <span>Quality: Synchronized</span>
        </div>
      </div>
    </div>
  );
};
