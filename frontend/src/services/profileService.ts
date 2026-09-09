import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/user';
import { UserLocation } from '../types/location';

export class ProfileService {
  public isProfileComplete(profile: UserProfile | null): boolean {
    if (!profile) return false;

    const hasUsername = Boolean(profile.username && profile.username.trim().length > 0);
    const hasRole = Boolean(profile.role && profile.role.trim().length > 0);
    const hasLat = profile.latitude !== undefined && profile.latitude !== null && !isNaN(profile.latitude);
    const hasLng = profile.longitude !== undefined && profile.longitude !== null && !isNaN(profile.longitude);

    return hasUsername && hasRole && hasLat && hasLng;
  }

  public async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    if (!isSupabaseConfigured()) {
      const local = localStorage.getItem('weathergpt_user_profile');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed.id === userId || parsed.user_id === userId) {
            return parsed;
          }
        } catch {
          // ignore
        }
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.log('[ProfileService] Supabase getProfile notice:', error?.message || 'No profile found');
        return null;
      }

      return this.normalizeProfileData(data);
    } catch (err) {
      console.warn('[ProfileService] getProfile exception:', err);
      return null;
    }
  }

  public async upsertProfile(profileData: Partial<UserProfile> & { user_id?: string; id?: string }): Promise<UserProfile> {
    const targetId = profileData.id || profileData.user_id || '00000000-0000-4000-a000-000000000001';

    const now = new Date().toISOString();
    const payload = {
      id: targetId,
      username: profileData.username || '',
      phone: profileData.phone || '',
      role: profileData.role || 'citizen',
      preferred_language: profileData.preferred_language || 'en',
      latitude: profileData.latitude !== undefined ? profileData.latitude : null,
      longitude: profileData.longitude !== undefined ? profileData.longitude : null,
      city: profileData.city || null,
      district: profileData.district || null,
      state: profileData.state || null,
      country: profileData.country || null,
      postal_code: profileData.postal_code || (profileData as any).postalCode || null,
      formatted_address: profileData.formatted_address || (profileData as any).formattedAddress || null,
      location_source: profileData.location_source || 'gps',
      location_updated_at: profileData.location_updated_at || now,
      updated_at: now,
    };

    localStorage.setItem('weathergpt_user_profile', JSON.stringify({ ...payload, user_id: targetId }));

    if (isSupabaseConfigured()) {
      try {
        console.log('[ProfileService] Saving profile payload to Supabase profiles table:', payload);
        const { data, error } = await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.error('[ProfileService] Supabase upsert error details:', error.message, error.details, error.hint, error.code);
        } else if (data) {
          console.log('[ProfileService] Successfully saved profile to Supabase:', data);
          return this.normalizeProfileData(data);
        }
      } catch (err) {
        console.error('[ProfileService] Supabase upsert exception:', err);
      }
    } else {
      console.warn('[ProfileService] Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }

    return this.normalizeProfileData(payload);
  }

  public async updateRole(userId: string, role: UserRole): Promise<UserProfile | null> {
    const existing = await this.getProfile(userId);
    return this.upsertProfile({
      ...(existing || {}),
      id: userId,
      role,
    });
  }

  public async updateLocation(userId: string, location: UserLocation): Promise<UserProfile | null> {
    const existing = await this.getProfile(userId);
    return this.upsertProfile({
      ...(existing || {}),
      id: userId,
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city || null,
      district: location.district || null,
      state: location.state || null,
      country: location.country || null,
      postal_code: location.postalCode || location.postal_code || null,
      formatted_address: location.formattedAddress || location.formatted_address || null,
      location_source: location.source,
      location_updated_at: new Date().toISOString(),
    });
  }

  public async updateLanguage(userId: string, language: string): Promise<UserProfile | null> {
    const existing = await this.getProfile(userId);
    return this.upsertProfile({
      ...(existing || {}),
      id: userId,
      preferred_language: language,
    });
  }

  private normalizeProfileData(data: any): UserProfile {
    const uid = data.id || data.user_id;
    return {
      id: uid,
      user_id: uid,
      username: data.username || '',
      phone: data.phone || '',
      role: (data.role as UserRole) || 'citizen',
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || null,
      district: data.district || null,
      state: data.state || null,
      country: data.country || null,
      postal_code: data.postal_code || null,
      formatted_address: data.formatted_address || null,
      location_source: data.location_source || 'gps',
      location_updated_at: data.location_updated_at || data.updated_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

export const profileService = new ProfileService();
