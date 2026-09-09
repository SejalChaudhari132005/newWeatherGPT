export type UserRole =
  | 'citizen'
  | 'farmer'
  | 'fisherman'
  | 'disaster_manager'
  | 'urban_planner'
  | 'researcher'
  | 'aviation';

export type AuthStatus = 'LOADING' | 'UNAUTHENTICATED' | 'AUTHENTICATED' | 'PROFILE_INCOMPLETE' | 'PROFILE_COMPLETE';

export type OnboardingStep =
  | 'WELCOME'
  | 'PHONE'
  | 'OTP'
  | 'USERNAME'
  | 'ROLE'
  | 'ROLE_CONFIRM'
  | 'LOCATION'
  | 'LOCATION_CONFIRM'
  | 'COMPLETE';

export interface UserProfile {
  id: string;
  user_id?: string;
  username: string;
  phone?: string;
  role: UserRole;
  preferred_language?: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  formatted_address?: string | null;
  location_source?: 'gps' | 'manual' | string;
  location_updated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  icon: string;
  advisoryPreview: string;
}
