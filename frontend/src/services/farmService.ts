import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FarmProfile } from '../types/farm';

const FARM_STORAGE_KEY = 'weathergpt_farmer_farm_profile';

export class FarmService {
  /**
   * Retrieves the farm profile for a given user.
   * If none exists in DB/storage, returns null (or seeds default if requested).
   */
  public async getFarm(userId: string): Promise<FarmProfile | null> {
    if (!userId) return null;

    // Check localStorage first
    const cached = localStorage.getItem(`${FARM_STORAGE_KEY}_${userId}`);
    let localProfile: FarmProfile | null = null;
    if (cached) {
      try {
        localProfile = JSON.parse(cached);
      } catch {
        // ignore
      }
    }

    if (!isSupabaseConfigured()) {
      return localProfile;
    }

    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[FarmService] Supabase getFarm notice:', error.message);
        return localProfile;
      }

      if (data) {
        const normalized = this.normalizeFarmData(data);
        localStorage.setItem(`${FARM_STORAGE_KEY}_${userId}`, JSON.stringify(normalized));
        return normalized;
      }

      return localProfile;
    } catch (err) {
      console.warn('[FarmService] getFarm exception:', err);
      return localProfile;
    }
  }

  /**
   * Saves or updates a farm profile in Supabase and LocalStorage.
   */
  public async upsertFarm(farmData: Partial<FarmProfile> & { user_id: string }): Promise<FarmProfile> {
    const userId = farmData.user_id || 'farmer_user';
    const now = new Date().toISOString();
    
    // Existing farm or newly generated id
    const existing = await this.getFarm(userId);
    const farmId = farmData.id || existing?.id || `farm_${Date.now()}`;

    const payload: FarmProfile = {
      id: farmId,
      user_id: userId,
      farm_name: farmData.farm_name || existing?.farm_name || 'My Farm',
      latitude: farmData.latitude ?? existing?.latitude ?? 19.2437,
      longitude: farmData.longitude ?? existing?.longitude ?? 73.1355,
      address: farmData.address ?? existing?.address ?? null,
      village: farmData.village ?? existing?.village ?? null,
      district: farmData.district ?? existing?.district ?? 'Thane',
      state: farmData.state ?? existing?.state ?? 'Maharashtra',
      farm_size: farmData.farm_size ?? existing?.farm_size ?? 2.5,
      farm_size_unit: farmData.farm_size_unit ?? existing?.farm_size_unit ?? 'acres',
      primary_crop: farmData.primary_crop ?? existing?.primary_crop ?? 'soybean',
      crop_variety: farmData.crop_variety ?? existing?.crop_variety ?? 'JS 335',
      growth_stage: farmData.growth_stage ?? existing?.growth_stage ?? 'flowering',
      sowing_date: farmData.sowing_date ?? existing?.sowing_date ?? null,
      irrigation_type: farmData.irrigation_type ?? existing?.irrigation_type ?? 'drip',
      soil_type: farmData.soil_type ?? existing?.soil_type ?? 'black_cotton',
      background_image_url: farmData.background_image_url ?? existing?.background_image_url ?? null,
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    // Save to local storage
    localStorage.setItem(`${FARM_STORAGE_KEY}_${userId}`, JSON.stringify(payload));

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('farms')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (error) {
          console.warn('[FarmService] Supabase upsert error:', error.message);
        } else if (data) {
          const normalized = this.normalizeFarmData(data);
          localStorage.setItem(`${FARM_STORAGE_KEY}_${userId}`, JSON.stringify(normalized));
          return normalized;
        }
      } catch (err) {
        console.warn('[FarmService] Supabase upsert exception:', err);
      }
    }

    return payload;
  }

  private normalizeFarmData(data: any): FarmProfile {
    return {
      id: data.id,
      user_id: data.user_id,
      farm_name: data.farm_name || 'My Farm',
      latitude: typeof data.latitude === 'number' ? data.latitude : parseFloat(data.latitude || '19.2437'),
      longitude: typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude || '73.1355'),
      address: data.address || null,
      village: data.village || null,
      district: data.district || null,
      state: data.state || null,
      farm_size: typeof data.farm_size === 'number' ? data.farm_size : parseFloat(data.farm_size || '2.5'),
      farm_size_unit: data.farm_size_unit || 'acres',
      primary_crop: data.primary_crop || 'soybean',
      crop_variety: data.crop_variety || null,
      growth_stage: data.growth_stage || 'flowering',
      sowing_date: data.sowing_date || null,
      irrigation_type: data.irrigation_type || 'drip',
      soil_type: data.soil_type || 'black_cotton',
      background_image_url: data.background_image_url || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

export const farmService = new FarmService();
