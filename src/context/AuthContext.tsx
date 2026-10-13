import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, DEFAULT_DEMO_USER } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  loginWithEmail: (email: string, password: string, name?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  updateProfile: (updatedData: Partial<UserProfile>) => void;
  updateAvatar: (avatarDataUrl: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'seo_aeo_user_profile_2026';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      console.warn('Could not load stored user profile', e);
    }
  }, []);

  // Save to localStorage automatically on user change
  const saveUser = (newUser: UserProfile | null) => {
    setUser(newUser);
    if (newUser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } catch (e) {
        console.warn('Could not save user profile to localStorage', e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const loginWithEmail = async (email: string, _password: string, name?: string): Promise<boolean> => {
    const displayName = name || email.split('@')[0].replace(/[\._]/g, ' ') || 'Verified Member';
    const capitalizedName = displayName
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const newUser: UserProfile = {
      id: `usr_email_${Date.now()}`,
      name: capitalizedName,
      email: email,
      avatarUrl: user?.avatarUrl || '',
      role: 'Enterprise SEO Specialist',
      company: 'Multi-Engine Growth Agency',
      website: '',
      authProvider: 'email',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      eeatTrustScore: 98,
      auditsCompleted: 12,
    };

    saveUser(newUser);
    setIsAuthModalOpen(false);
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    // Simulating Google OAuth profile sync
    await new Promise(res => setTimeout(res, 400));
    const newUser: UserProfile = {
      ...DEFAULT_DEMO_USER,
      id: `usr_google_${Date.now()}`,
      authProvider: 'google',
      name: 'Muhammad Anas Mughal',
      email: 'muhammadanasmughal428@gmail.com',
      avatarUrl: user?.avatarUrl || '',
    };
    saveUser(newUser);
    setIsAuthModalOpen(false);
    return true;
  };

  const loginWithFacebook = async (): Promise<boolean> => {
    // Simulating Facebook OAuth profile sync
    await new Promise(res => setTimeout(res, 400));
    const newUser: UserProfile = {
      id: `usr_fb_${Date.now()}`,
      name: 'Muhammad Anas (FB)',
      email: 'muhammadanas.fb@domain.com',
      avatarUrl: user?.avatarUrl || '',
      role: 'Growth Marketing Director',
      company: 'Global Digital Agency',
      website: '',
      authProvider: 'facebook',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      eeatTrustScore: 97,
      auditsCompleted: 24,
    };
    saveUser(newUser);
    setIsAuthModalOpen(false);
    return true;
  };

  const updateProfile = (updatedData: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    saveUser(updated);
  };

  // Automatically update and save avatar photo
  const updateAvatar = (avatarDataUrl: string) => {
    if (!user) {
      // If user is not logged in yet, create a default user with this avatar
      const tempUser: UserProfile = {
        ...DEFAULT_DEMO_USER,
        avatarUrl: avatarDataUrl,
      };
      saveUser(tempUser);
      return;
    }
    const updated = { ...user, avatarUrl: avatarDataUrl };
    saveUser(updated);
  };

  const logout = () => {
    saveUser(null);
    setIsProfileModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        isProfileModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        openProfileModal: () => setIsProfileModalOpen(true),
        closeProfileModal: () => setIsProfileModalOpen(false),
        loginWithEmail,
        loginWithGoogle,
        loginWithFacebook,
        updateProfile,
        updateAvatar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
