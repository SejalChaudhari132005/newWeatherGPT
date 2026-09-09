import React from 'react';
import { Sprout, Layers } from 'lucide-react';

export interface CropOption {
  id: string;
  name: string;
  marathiName: string;
  icon: string;
}

export interface StageOption {
  id: string;
  name: string;
  marathiName: string;
}

export const CROPS: CropOption[] = [
  { id: 'soybean', name: 'Soybean', marathiName: 'सोयाबीन', icon: '🌱' },
  { id: 'cotton', name: 'Cotton', marathiName: 'कापूस', icon: '🌿' },
  { id: 'wheat', name: 'Wheat', marathiName: 'गहू', icon: '🌾' },
  { id: 'rice', name: 'Rice / Paddy', marathiName: 'भात (धान)', icon: '🌾' },
  { id: 'sugarcane', name: 'Sugarcane', marathiName: 'ऊस', icon: '🎋' },
  { id: 'groundnut', name: 'Groundnut', marathiName: 'भुईमूग', icon: '🥜' },
  { id: 'chilli', name: 'Chilli / Veg', marathiName: 'मिरची / भाजीपाला', icon: '🌶️' },
];

export const STAGES: StageOption[] = [
  { id: 'sowing', name: 'Sowing / Emergence', marathiName: 'पेरणी / उगवण' },
  { id: 'vegetative', name: 'Vegetative Growth', marathiName: 'शाकीय वाढ' },
  { id: 'flowering', name: 'Flowering & Bloom', marathiName: 'फुलोरा अवस्था' },
  { id: 'pod_filling', name: 'Pod / Boll Filling', marathiName: 'शेंगा / बोंड भरणे' },
  { id: 'maturity', name: 'Maturity / Harvest', marathiName: 'पक्वता / कापणी' },
];

interface CropStageSelectorProps {
  selectedCrop: string;
  selectedStage: string;
  onCropChange: (crop: string) => void;
  onStageChange: (stage: string) => void;
}

export const CropStageSelector: React.FC<CropStageSelectorProps> = ({
  selectedCrop,
  selectedStage,
  onCropChange,
  onStageChange,
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs space-y-3.5">
      {/* Crop Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select Your Crop (पीक निवडा):</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Swipe ➔</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar snap-x -mx-1 px-1">
          {CROPS.map((crop) => {
            const isSelected = selectedCrop.toLowerCase() === crop.id.toLowerCase();
            return (
              <button
                key={crop.id}
                onClick={() => onCropChange(crop.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 snap-start active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/40'
                    : 'bg-emerald-50/50 border-emerald-200/70 text-slate-800 hover:bg-emerald-100/60'
                }`}
              >
                <span className="text-base">{crop.icon}</span>
                <div className="text-left">
                  <div className="font-extrabold">{crop.name}</div>
                  <div className={`text-[10px] font-medium ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {crop.marathiName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Selector */}
      <div className="pt-2.5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Growth Stage (वाढीची अवस्था):</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Swipe ➔</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar snap-x -mx-1 px-1">
          {STAGES.map((st) => {
            const isSelected = selectedStage.toLowerCase() === st.id.toLowerCase();
            return (
              <button
                key={st.id}
                onClick={() => onStageChange(st.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 snap-start active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{st.name}</span>
                <span className={`ml-1 text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  ({st.marathiName})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
