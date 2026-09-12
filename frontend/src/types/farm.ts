export type CropType =
  | 'soybean'
  | 'cotton'
  | 'wheat'
  | 'rice'
  | 'sugarcane'
  | 'maize'
  | 'onion'
  | 'tomato'
  | 'groundnut'
  | 'gram'
  | 'tur'
  | 'banana'
  | 'grapes'
  | 'pomegranate';

export type GrowthStage =
  | 'sowing'
  | 'germination'
  | 'vegetative'
  | 'flowering'
  | 'pod_filling'
  | 'grain_formation'
  | 'maturity'
  | 'harvesting';

export type IrrigationType =
  | 'drip'
  | 'sprinkler'
  | 'flood'
  | 'rainfed'
  | 'furrow'
  | 'manual';

export type SoilType =
  | 'black_cotton'
  | 'alluvial'
  | 'red_soil'
  | 'laterite'
  | 'sandy_loam'
  | 'clay';

export interface FarmProfile {
  id: string;
  user_id: string;
  farm_name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  farm_size: number;
  farm_size_unit: 'acres' | 'hectares' | 'guntha' | 'bigha';
  primary_crop: CropType | string;
  crop_variety?: string | null;
  growth_stage: GrowthStage | string;
  sowing_date?: string | null;
  irrigation_type: IrrigationType | string;
  soil_type?: SoilType | string | null;
  background_image_url?: string | null;
  boundary_geojson?: any;
  created_at?: string;
  updated_at?: string;
}
