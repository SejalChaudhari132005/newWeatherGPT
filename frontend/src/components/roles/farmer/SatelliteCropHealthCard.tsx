import React from 'react';
import { Satellite, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface SatelliteCropHealthCardProps {
  ndviValue?: number;
  healthStatus?: string;
  trend?: string;
}

export const SatelliteCropHealthCard: React.FC<SatelliteCropHealthCardProps> = ({
  ndviValue = 0.72,
  healthStatus = 'Good',
  trend = 'Improving',
}) => {
  const { language } = useLanguage();

  return (
    <div className="gov-panel space-y-3">
      {/* Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-[#006B3C]" />
          <span>SATELLITE VEGETATION OBSERVATION (SENTINEL-2 NDVI)</span>
        </div>

        <span className="gov-badge gov-badge-info">
          SPACE APPLICATION CENTRE / COPERNICUS
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* 3 Telemetry Columns */}
        <div className="grid grid-cols-3 gap-2 text-left">
          {/* NDVI Index */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">
              Normalized NDVI
            </div>
            <div className="text-lg font-bold text-[#006B3C] mt-0.5">
              {ndviValue.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#5B6770]">Scale: -1.0 to +1.0</span>
          </div>

          {/* Vegetation Health */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">
              {language === 'mr' ? 'वनस्पती आरोग्य' : language === 'hi' ? 'वनस्पति स्वास्थ्य' : 'Crop Vigor'}
            </div>
            <div className="text-xs font-bold text-[#17365D] mt-1">
              {language === 'mr' ? 'उत्तम / निरोगी' : language === 'hi' ? 'उत्तम / स्वस्थ' : healthStatus}
            </div>
            <span className="gov-badge gov-badge-success mt-1 inline-block">HEALTHY CANOPY</span>
          </div>

          {/* Trend */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">
              {language === 'mr' ? 'प्रगती कल' : language === 'hi' ? 'प्रवृत्ति' : 'Biomass Trend'}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#006B3C] mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#006B3C]" />
              <span>{language === 'mr' ? 'सुधारत आहे' : language === 'hi' ? 'सुधार जारी' : trend}</span>
            </div>
            <span className="text-[10px] text-[#5B6770] mt-1 block">10-Day Delta: +0.04</span>
          </div>
        </div>

        {/* Source metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>Payload: MSI Sentinel-2 (10m Resolution)</span>
          <span>Cloud Cover: &lt; 5%</span>
        </div>
      </div>
    </div>
  );
};
