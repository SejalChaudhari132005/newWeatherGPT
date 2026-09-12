import React from 'react';
import {
  Layers,
  Sprout,
  Flower2,
  Droplets,
  Mountain,
  Edit3,
  Building2,
} from 'lucide-react';
import { FarmProfile } from '../../../types/farm';
import { useLanguage } from '../../../context/LanguageContext';
import {
  translateCrop,
  translateGrowthStage,
  translateIrrigationType,
  translateFarmUnit,
  translateSoilType,
  translatePhrase,
} from '../../../utils/dashboardTranslator';

interface FarmOverviewCardProps {
  farm: FarmProfile | null;
  onOpenManageFarm?: () => void;
}

export const FarmOverviewCard: React.FC<FarmOverviewCardProps> = ({
  farm,
  onOpenManageFarm,
}) => {
  const { language } = useLanguage();

  const farmName = farm?.farm_name || 'My Farm';
  const primaryCrop = farm?.primary_crop || 'rice';
  const cropVariety = farm?.crop_variety || 'Kolam';
  const growthStage = farm?.growth_stage || 'pod_filling';
  const farmSize = farm?.farm_size ?? 2.5;
  const farmSizeUnit = farm?.farm_size_unit || 'Acres';
  const irrigationType = farm?.irrigation_type || 'field_irrigation';
  const soilType = farm?.soil_type || 'alluvial';

  return (
    <div className="gov-panel h-full flex flex-col justify-between">
      {/* Official Section Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#006B3C]" />
          <span>FARM REGISTRY & CROP PROFILE</span>
        </div>

        {onOpenManageFarm && (
          <button
            type="button"
            onClick={onOpenManageFarm}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006B3C] hover:bg-[#00522E] text-white text-[11px] font-bold rounded-xs tracking-wider transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3 text-white" />
            <span>{language === 'mr' ? 'सुधारणा' : language === 'hi' ? 'संपादित करें' : 'MANAGE FARM'}</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
        {/* Farm Name Banner */}
        <div className="flex items-center justify-between p-2 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
          <div>
            <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider block">
              Registered Holding
            </span>
            <span className="text-sm font-bold text-[#17365D]">
              {farmName}
            </span>
          </div>
          <span className="gov-badge gov-badge-success">
            {language === 'mr' ? 'मुख्य शेत' : language === 'hi' ? 'मुख्य खेत' : 'PRIMARY HOLDING'}
          </span>
        </div>

        {/* Structured Parameter Table */}
        <div className="border border-[#D6DCE1] rounded-xs overflow-x-auto bg-white">
          <table className="gov-table w-full text-left text-xs">
            <tbody>
              <tr>
                <td className="w-1/3 text-[#5B6770] font-semibold bg-[#F8FAFC]">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#17365D]" />
                    <span>Total Area</span>
                  </div>
                </td>
                <td className="font-bold text-[#1F2933]">
                  {farmSize} {translateFarmUnit(farmSizeUnit, language)}
                </td>
              </tr>
              <tr>
                <td className="text-[#5B6770] font-semibold bg-[#F8FAFC]">
                  <div className="flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-[#006B3C]" />
                    <span>Crop & Variety</span>
                  </div>
                </td>
                <td className="font-bold text-[#1F2933]">
                  {translateCrop(primaryCrop, language)} {cropVariety ? `(${cropVariety})` : ''}
                </td>
              </tr>
              <tr>
                <td className="text-[#5B6770] font-semibold bg-[#F8FAFC]">
                  <div className="flex items-center gap-1.5">
                    <Flower2 className="w-3.5 h-3.5 text-[#B7791F]" />
                    <span>Growth Stage</span>
                  </div>
                </td>
                <td className="font-bold text-[#1F2933]">
                  <span className="mr-1.5">{translateGrowthStage(growthStage, language)}</span>
                  <span className="gov-badge gov-badge-info">Active</span>
                </td>
              </tr>
              <tr>
                <td className="text-[#5B6770] font-semibold bg-[#F8FAFC]">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#1D5F91]" />
                    <span>Irrigation System</span>
                  </div>
                </td>
                <td className="font-bold text-[#1F2933]">
                  {translateIrrigationType(irrigationType, language)}
                </td>
              </tr>
              <tr>
                <td className="text-[#5B6770] font-semibold bg-[#F8FAFC]">
                  <div className="flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-[#5B6770]" />
                    <span>Soil Classification</span>
                  </div>
                </td>
                <td className="font-bold text-[#1F2933]">
                  {translateSoilType(soilType, language)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Source metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>Database: Central Farmer Database (Kisan Record)</span>
          <span>Verified: YES</span>
        </div>
      </div>
    </div>
  );
};
