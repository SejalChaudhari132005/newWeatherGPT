/**
 * Deterministic Farm Image Resolution System
 * Preferred Hierarchy:
 * 1. Farm-specific image saved by user (farm.background_image_url)
 * 2. Crop-specific Indian agricultural image
 * 3. Region/state agricultural image
 * 4. Generic Indian farmland fallback
 */

const CROP_IMAGES: Record<string, string> = {
  soybean: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=1200&q=80',
  cotton: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=1200&q=80',
  wheat: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  rice: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=1200&q=80',
  paddy: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=1200&q=80',
  sugarcane: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1200&q=80',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=80',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=80',
  onion: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=1200&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=80',
  groundnut: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  tur: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  gram: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80',
  grapes: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=1200&q=80',
  pomegranate: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=1200&q=80',
};

const REGION_IMAGES: Record<string, string> = {
  maharashtra: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  punjab: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  haryana: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  gujarat: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=1200&q=80',
  karnataka: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=1200&q=80',
  'andhra pradesh': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=1200&q=80',
  'tamil nadu': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=1200&q=80',
  'uttar pradesh': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  'madhya pradesh': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=1200&q=80',
};

// High quality Indian farmland hero fallback matching the reference mockup
const DEFAULT_INDIAN_FARMLAND_IMAGE =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';

export class FarmImageService {
  public resolveFarmImage(params: {
    customImageUrl?: string | null;
    crop?: string | null;
    state?: string | null;
    district?: string | null;
  }): string {
    // 1. User-provided custom farm image
    if (params.customImageUrl && params.customImageUrl.trim().length > 0) {
      return params.customImageUrl;
    }

    // 2. Crop-specific image
    if (params.crop) {
      const cropKey = params.crop.toLowerCase().trim();
      if (CROP_IMAGES[cropKey]) {
        return CROP_IMAGES[cropKey];
      }
    }

    // 3. Region / State agricultural image
    if (params.state) {
      const stateKey = params.state.toLowerCase().trim();
      if (REGION_IMAGES[stateKey]) {
        return REGION_IMAGES[stateKey];
      }
    }

    // 4. Deterministic Indian farmland fallback
    return DEFAULT_INDIAN_FARMLAND_IMAGE;
  }
}

export const farmImageService = new FarmImageService();
