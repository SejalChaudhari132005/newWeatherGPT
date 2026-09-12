import React, { useState } from 'react';
import {
  X,
  Sprout,
  Save,
  MapPin,
  Maximize2,
  Droplets,
  Calendar,
  Layers,
  Image,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { FarmProfile } from '../../../types/farm';
import { farmService } from '../../../services/farmService';
import { useLanguage } from '../../../context/LanguageContext';
import {
  translateCrop,
  translateGrowthStage,
  translateIrrigationType,
  translatePhrase,
} from '../../../utils/dashboardTranslator';

interface ManageFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  farm: FarmProfile | null;
  userId: string;
  onFarmUpdated: (updatedFarm: FarmProfile) => void;
}

const CROPS_LIST = [
  { value: 'soybean', label: 'Soybean (सोयाबीन)' },
  { value: 'cotton', label: 'Cotton (कापूस)' },
  { value: 'wheat', label: 'Wheat (गहू)' },
  { value: 'rice', label: 'Rice / Paddy (भात)' },
  { value: 'sugarcane', label: 'Sugarcane (ऊस)' },
  { value: 'maize', label: 'Maize / Corn (मका)' },
  { value: 'onion', label: 'Onion (कांदा)' },
  { value: 'tomato', label: 'Tomato (टोमॅटो)' },
  { value: 'groundnut', label: 'Groundnut (भुईमूग)' },
  { value: 'gram', label: 'Gram (हरभरा)' },
  { value: 'tur', label: 'Tur (तूर)' },
  { value: 'banana', label: 'Banana (केळी)' },
  { value: 'grapes', label: 'Grapes (द्राक्षे)' },
  { value: 'pomegranate', label: 'Pomegranate (डाळिंब)' },
];

const STAGES_LIST = [
  { value: 'sowing', label: 'Sowing / Planting (पेरणी / लागवड)' },
  { value: 'germination', label: 'Germination (उगवण अवस्था)' },
  { value: 'vegetative', label: 'Vegetative Growth (शाकीय वाढ)' },
  { value: 'flowering', label: 'Flowering (फुलोरा अवस्था)' },
  { value: 'pod_filling', label: 'Pod / Grain Filling (शेंगा / दाणे भरणे)' },
  { value: 'grain_formation', label: 'Grain Formation (दाणे तयार होणे)' },
  { value: 'maturity', label: 'Maturity (पक्वता अवस्था)' },
  { value: 'harvesting', label: 'Harvesting (काढणी)' },
];

const IRRIGATION_LIST = [
  { value: 'drip', label: 'Drip Irrigation (ठिबक सिंचन)' },
  { value: 'sprinkler', label: 'Sprinkler (तुषार सिंचन)' },
  { value: 'flood', label: 'Flood / Surface (पाटपाणी)' },
  { value: 'rainfed', label: 'Rainfed (जिरायती / पावसावर)' },
];

const SOIL_LIST = [
  { value: 'black_cotton', label: 'Black Cotton Soil (काळी जमीन / रेगूर)' },
  { value: 'alluvial', label: 'Alluvial Soil (गाळाची जमीन)' },
  { value: 'red_soil', label: 'Red Soil (तांबडी माती)' },
  { value: 'laterite', label: 'Laterite (जांभा दगड / माती)' },
  { value: 'sandy_loam', label: 'Sandy Loam (वाळूयुक्त पोयटा)' },
  { value: 'clay', label: 'Clay (चिकणमाती)' },
];

export const ManageFarmModal: React.FC<ManageFarmModalProps> = ({
  isOpen,
  onClose,
  farm,
  userId,
  onFarmUpdated,
}) => {
  const { language } = useLanguage();

  const [farmName, setFarmName] = useState(farm?.farm_name || 'My Farm');
  const [primaryCrop, setPrimaryCrop] = useState(farm?.primary_crop || 'soybean');
  const [cropVariety, setCropVariety] = useState(farm?.crop_variety || 'JS 335');
  const [growthStage, setGrowthStage] = useState(farm?.growth_stage || 'flowering');
  const [farmSize, setFarmSize] = useState(String(farm?.farm_size ?? 2.5));
  const [farmSizeUnit, setFarmSizeUnit] = useState<any>(farm?.farm_size_unit || 'acres');
  const [irrigationType, setIrrigationType] = useState(farm?.irrigation_type || 'drip');
  const [soilType, setSoilType] = useState(farm?.soil_type || 'black_cotton');
  const [sowingDate, setSowingDate] = useState(farm?.sowing_date || '');
  const [village, setVillage] = useState(farm?.village || 'Kalyan');
  const [district, setDistrict] = useState(farm?.district || 'Thane');
  const [state, setState] = useState(farm?.state || 'Maharashtra');
  const [bgImageUrl, setBgImageUrl] = useState(farm?.background_image_url || '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<FarmProfile> & { user_id: string } = {
        id: farm?.id,
        user_id: userId,
        farm_name: farmName.trim() || 'My Farm',
        primary_crop: primaryCrop,
        crop_variety: cropVariety.trim() || null,
        growth_stage: growthStage,
        farm_size: parseFloat(farmSize) || 2.5,
        farm_size_unit: farmSizeUnit,
        irrigation_type: irrigationType,
        soil_type: soilType,
        sowing_date: sowingDate || null,
        village: village.trim() || null,
        district: district.trim() || null,
        state: state.trim() || null,
        background_image_url: bgImageUrl.trim() || null,
      };

      const updated = await farmService.upsertFarm(payload);
      setSuccess(true);
      setTimeout(() => {
        onFarmUpdated(updated);
        setSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('[ManageFarmModal] Failed to save farm:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-2xl">
              <Sprout className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {translatePhrase('manageFarm', language)}
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Update crop, stage, soil & irrigation parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1 font-sans">
          {/* Farm Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Farm Name (शेताचे नाव)
            </label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="e.g. Green Acres / माझे शेत"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold py-2.5 px-3 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Primary Crop & Variety 2-Col Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Primary Crop (मुख्य पीक)
              </label>
              <select
                value={primaryCrop}
                onChange={(e) => setPrimaryCrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold py-2.5 px-3 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
              >
                {CROPS_LIST.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Crop Variety / वाण (Optional)
              </label>
              <input
                type="text"
                value={cropVariety}
                onChange={(e) => setCropVariety(e.target.value)}
                placeholder="e.g. JS 335, Phule Sangam"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold py-2.5 px-3 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Growth Stage */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Current Growth Stage (पिकाची सध्याची वाढीची अवस्था)
            </label>
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold py-2.5 px-3 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
            >
              {STAGES_LIST.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Farm Size & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Farm Size (क्षेत्रफळ)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold py-2.5 px-3 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Unit (एकक)
              </label>
              <select
                value={farmSizeUnit}
                onChange={(e) => setFarmSizeUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold py-2.5 px-3 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="acres">Acres (एकर)</option>
                <option value="hectares">Hectares (हेक्टर)</option>
                <option value="guntha">Guntha (गुंठा)</option>
                <option value="bigha">Bigha (बीघा)</option>
              </select>
            </div>
          </div>

          {/* Irrigation & Soil Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Irrigation Method (सिंचन प्रकार)
              </label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold py-2.5 px-3 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
              >
                {IRRIGATION_LIST.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Soil Type (जमिनीचा प्रकार)
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold py-2.5 px-3 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
              >
                {SOIL_LIST.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Details: Village, District, State */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Village/City
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Village"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium py-2 px-2.5 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="District"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium py-2 px-2.5 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium py-2 px-2.5 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Custom Background Image URL */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Custom Farm Image URL (ऐच्छिक फोटो लिंक)
            </label>
            <input
              type="url"
              value={bgImageUrl}
              onChange={(e) => setBgImageUrl(e.target.value)}
              placeholder="https://... (Leave blank to use crop/regional automatic image)"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium py-2 px-3 rounded-2xl outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Farm...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Farm Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
