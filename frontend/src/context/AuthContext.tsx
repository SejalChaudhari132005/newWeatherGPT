import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthStatus, OnboardingStep, UserRole } from '../types/user';
import { UserLocation } from '../types/location';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { locationService } from '../services/locationService';

interface AuthContextType {
  authStatus: AuthStatus;
  onboardingStep: OnboardingStep;
  setOnboardingStep: (step: OnboardingStep) => void;
  userId: string | null;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  otpToken: string;
  setOtpToken: (otp: string) => void;
  otpSentMessage: string;
  resendTimer: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  profile: UserProfile | null;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;

  // Onboarding & Profile Actions
  handleSendOtp: (phone: string) => Promise<boolean>;
  handleVerifyOtp: (token: string) => Promise<boolean>;
  handleResendOtp: () => Promise<void>;
  handleSaveUsername: (username: string) => Promise<void>;
  handleSaveRole: (role: UserRole) => Promise<void>;
  handleSaveLocationGps: () => Promise<boolean>;
  handleSaveLocationManual: (location: UserLocation | any) => Promise<void>;
  handleUpdateLocation: (location: UserLocation) => Promise<void>;
  handleConfirmOnboarding: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  resetToOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('LOADING');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('WELCOME');
  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpToken, setOtpToken] = useState<string>('');
  const [otpSentMessage, setOtpSentMessage] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Timer effect for OTP resend countdown
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0 && onboardingStep === 'OTP') {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, onboardingStep]);

  const refreshProfile = async () => {
    if (!userId) return;
    const prof = await profileService.getProfile(userId);
    if (prof) {
      setUserProfile(prof);
      if (profileService.isProfileComplete(prof)) {
        setAuthStatus('PROFILE_COMPLETE');
        setOnboardingStep('COMPLETE');
      } else {
        setAuthStatus('PROFILE_INCOMPLETE');
      }
    }
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!userId) return;
    const finalProf = await profileService.upsertProfile({
      id: userId,
      user_id: userId,
      ...updated,
    });
    setUserProfile(finalProf);
  };

    const getValidUserId = () => {
      return userId || userProfile?.id || userProfile?.user_id || localStorage.getItem('weathergpt_user_id') || `usr-${Date.now()}`;
    };

    // Initial Session & Profile Check on Application Startup
    useEffect(() => {
      const initAuth = async () => {
        setAuthStatus('LOADING');
        try {
          // 1. Try Supabase session if configured
          const session = await authService.getSession();
          if (session && session.user) {
            const uid = session.user.id;
            setUserId(uid);
            setPhoneNumber(session.user.phone || '');

            const profile = await profileService.getProfile(uid);
            setUserProfile(profile);

            if (profileService.isProfileComplete(profile)) {
              console.log('[AuthContext] Supabase Session restored. Profile complete:', profile?.username, profile?.role);
              setAuthStatus('PROFILE_COMPLETE');
              setOnboardingStep('COMPLETE');
              return;
            } else {
              console.log('[AuthContext] Supabase Session restored. Incomplete profile:', profile);
              setAuthStatus('PROFILE_INCOMPLETE');
              if (!profile?.username) setOnboardingStep('USERNAME');
              else if (!profile?.role) setOnboardingStep('ROLE');
              else setOnboardingStep('LOCATION');
              return;
            }
          }

          // 2. Fallback to LocalStorage profile (works offline and in dev mode without Supabase connection)
          const localStr = localStorage.getItem('weathergpt_user_profile');
          if (localStr) {
            try {
              const localProf = JSON.parse(localStr);
              if (localProf && (localProf.id || localProf.user_id)) {
                const uid = localProf.id || localProf.user_id;
                setUserId(uid);
                setUserProfile(localProf);
                if (profileService.isProfileComplete(localProf)) {
                  console.log('[AuthContext] Local profile restored. Complete:', localProf.username, localProf.role);
                  setAuthStatus('PROFILE_COMPLETE');
                  setOnboardingStep('COMPLETE');
                  return;
                } else {
                  console.log('[AuthContext] Local profile restored. Incomplete:', localProf);
                  setAuthStatus('PROFILE_INCOMPLETE');
                  if (!localProf.username) setOnboardingStep('USERNAME');
                  else if (!localProf.role) setOnboardingStep('ROLE');
                  else setOnboardingStep('LOCATION');
                  return;
                }
              }
            } catch (err) {
              console.warn('[AuthContext] Failed to parse local profile:', err);
            }
          }

          // 3. Brand new session -> start at Welcome
          console.log('[AuthContext] No saved session found. Directing to Welcome screen.');
          setUserId(null);
          setUserProfile(null);
          setAuthStatus('UNAUTHENTICATED');
          setOnboardingStep('WELCOME');
        } catch (err) {
          console.error('[AuthContext] Init Auth error:', err);
          setAuthStatus('UNAUTHENTICATED');
          setOnboardingStep('WELCOME');
        }
      };

      initAuth();
    }, []);

    const handleSendOtp = async (phone: string): Promise<boolean> => {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await authService.sendPhoneOtp(phone);
      setIsSubmitting(false);

      if (res.success) {
        setPhoneNumber(phone);
        setOtpSentMessage(res.message || 'OTP Sent');
        setResendTimer(30);
        setOnboardingStep('OTP');
        return true;
      } else {
        setErrorMessage(res.message || 'Failed to send OTP.');
        return false;
      }
    };

    const handleVerifyOtp = async (token: string): Promise<boolean> => {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await authService.verifyPhoneOtp(phoneNumber, token);
      setIsSubmitting(false);

      if (res.success && res.user) {
        const uid = res.user.id;
        setUserId(uid);
        localStorage.setItem('weathergpt_user_id', uid);

        const existing = await profileService.getProfile(uid);
        if (existing) {
          setUserProfile(existing);
          if (profileService.isProfileComplete(existing)) {
            setAuthStatus('PROFILE_COMPLETE');
            setOnboardingStep('COMPLETE');
            return true;
          }
        }

        setAuthStatus('PROFILE_INCOMPLETE');
        setOnboardingStep('USERNAME');
        return true;
      } else {
        setErrorMessage(res.message || 'Verification failed. Please check the code.');
        return false;
      }
    };

    const handleResendOtp = async () => {
      if (resendTimer > 0) return;
      await handleSendOtp(phoneNumber);
    };

    const handleSaveUsername = async (username: string) => {
      if (!username.trim()) return;
      const uid = getValidUserId();
      setUserId(uid);
      localStorage.setItem('weathergpt_user_id', uid);

      const updated = await profileService.upsertProfile({
        ...(userProfile || {}),
        id: uid,
        user_id: uid,
        phone: phoneNumber,
        username: username.trim(),
        role: userProfile?.role || 'citizen',
      });

      setUserProfile(updated);
      setOnboardingStep('ROLE');
    };

    const handleSaveRole = async (role: UserRole) => {
      const uid = getValidUserId();
      setUserId(uid);
      localStorage.setItem('weathergpt_user_id', uid);

      const updated = await profileService.upsertProfile({
        ...(userProfile || {}),
        id: uid,
        user_id: uid,
        role,
      });

      if (updated) {
        setUserProfile(updated);
      }
      setOnboardingStep('ROLE_CONFIRM');
    };

    const handleSaveLocationGps = async (): Promise<boolean> => {
      setIsSubmitting(true);
      setErrorMessage(null);
      const uid = getValidUserId();
      setUserId(uid);
      localStorage.setItem('weathergpt_user_id', uid);

      try {
        const coords = await locationService.getExactGPSPosition();
        console.log('[AuthContext] GPS coordinates:', coords);
        
        const resolved = await locationService.resolveLocation(coords.latitude, coords.longitude, 'gps');
        console.log('[AuthContext] Resolved location:', resolved);

        const updated = await profileService.upsertProfile({
          ...(userProfile || {}),
          id: uid,
          user_id: uid,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          city: resolved.city || null,
          district: resolved.district || null,
          state: resolved.state || null,
          country: resolved.country || 'India',
          location_source: 'gps',
        });

        if (updated) {
          setUserProfile(updated);
        }
        setIsSubmitting(false);
        setOnboardingStep('LOCATION_CONFIRM');
        return true;
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMessage(err.message || 'Unable to access your location.');
        return false;
      }
    };

    const handleSaveLocationManual = async (locationOrOption: UserLocation | any) => {
      const uid = getValidUserId();
      setUserId(uid);
      localStorage.setItem('weathergpt_user_id', uid);

      const loc: UserLocation = {
        latitude: locationOrOption.latitude || locationOrOption.lat || 19.2437,
        longitude: locationOrOption.longitude || locationOrOption.lng || 73.1355,
        city: locationOrOption.city || locationOrOption.name || null,
        district: locationOrOption.district || locationOrOption.city || null,
        state: locationOrOption.state || null,
        country: locationOrOption.country || 'India',
        postalCode: locationOrOption.postal_code || locationOrOption.pincode || null,
        formattedAddress: locationOrOption.display_name || locationOrOption.formatted_address || null,
        source: 'manual',
      };

      const updated = await profileService.upsertProfile({
        ...(userProfile || {}),
        id: uid,
        user_id: uid,
        latitude: loc.latitude,
        longitude: loc.longitude,
        city: loc.city,
        district: loc.district,
        state: loc.state,
        country: loc.country,
        location_source: 'manual',
      });

      if (updated) {
        setUserProfile(updated);
      }
      setOnboardingStep('LOCATION_CONFIRM');
    };

    const handleUpdateLocation = async (location: UserLocation) => {
      const uid = getValidUserId();
      setUserId(uid);
      const updated = await profileService.updateLocation(uid, location);
      if (updated) {
        setUserProfile(updated);
      }
    };

    const handleConfirmOnboarding = async () => {
      const uid = getValidUserId();
      setUserId(uid);
      localStorage.setItem('weathergpt_user_id', uid);

      const finalProfile = await profileService.upsertProfile({
        id: uid,
        user_id: uid,
        username: userProfile?.username || 'WeatherGPT User',
        role: userProfile?.role || 'farmer',
        latitude: userProfile?.latitude ?? 19.2437,
        longitude: userProfile?.longitude ?? 73.1355,
        city: userProfile?.city || 'Kalyan',
        district: userProfile?.district || 'Thane',
        state: userProfile?.state || 'Maharashtra',
        country: userProfile?.country || 'India',
        phone: phoneNumber || userProfile?.phone || '',
        location_source: userProfile?.location_source || 'gps',
      });

      setUserProfile(finalProfile);
      setAuthStatus('PROFILE_COMPLETE');
      setOnboardingStep('COMPLETE');
    };

  const handleSignOut = async () => {
    await authService.signOut();
    localStorage.removeItem('weathergpt_user_profile');
    setUserProfile(null);
    setUserId(null);
    setAuthStatus('UNAUTHENTICATED');
    setOnboardingStep('WELCOME');
  };

  const resetToOnboarding = () => {
    localStorage.removeItem('weathergpt_user_profile');
    setUserProfile(null);
    setUserId(null);
    setAuthStatus('UNAUTHENTICATED');
    setOnboardingStep('WELCOME');
  };

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        onboardingStep,
        setOnboardingStep,
        userId,
        phoneNumber,
        setPhoneNumber,
        otpToken,
        setOtpToken,
        otpSentMessage,
        resendTimer,
        isSubmitting,
        errorMessage,
        setErrorMessage,
        userProfile,
        profile: userProfile,
        refreshProfile,
        updateProfile,
        signOut: handleSignOut,

        handleSendOtp,
        handleVerifyOtp,
        handleResendOtp,
        handleSaveUsername,
        handleSaveRole,
        handleSaveLocationGps,
        handleSaveLocationManual,
        handleUpdateLocation,
        handleConfirmOnboarding,
        handleSignOut,
        resetToOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
