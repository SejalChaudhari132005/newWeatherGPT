import React, { createContext, useContext } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { UserProfile, UserRole } from '../types/user';
import { UserLocation } from '../types/location';

interface UserContextType {
  user: any;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  updateLocation: (location: UserLocation) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthContext();

  const user = auth.userProfile ? { id: auth.userId, phone: auth.phoneNumber } : null;
  const profile = auth.userProfile;
  const role: UserRole = auth.userProfile?.role || 'citizen';
  const loading = auth.authStatus === 'LOADING';

  const refreshProfile = async () => {
    if (auth.userId) {
      await auth.refreshProfile();
    }
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    await auth.updateProfile(updated);
  };

  const updateRole = async (newRole: UserRole) => {
    await auth.handleSaveRole(newRole);
  };

  const updateLocation = async (location: UserLocation) => {
    await auth.handleUpdateLocation(location);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        refreshProfile,
        updateProfile,
        updateRole,
        updateLocation,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
