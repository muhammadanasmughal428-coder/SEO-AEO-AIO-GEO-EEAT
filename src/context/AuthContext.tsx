import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthResponse } from '../types.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (params: { email: string; password: string; name: string; company?: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuth: (provider: 'google' | 'facebook', email?: string, name?: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; resetToken?: string; error?: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateProfile: (updates: { name?: string; company?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('saas_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validate session on boot
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('saas_auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Accept': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem('saas_auth_token');
            setUser(null);
            setToken(null);
          }
        } else {
          localStorage.removeItem('saas_auth_token');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Authentication check request error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error || 'Authentication failed. Please verify credentials.';
        setError(msg);
        return { success: false, error: msg };
      }

      localStorage.setItem('saas_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Unable to connect to authentication server.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (params: { email: string; password: string; name: string; company?: string }) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error || 'Account registration failed.';
        setError(msg);
        return { success: false, error: msg };
      }

      localStorage.setItem('saas_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Registration connection error.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const loginWithOAuth = async (
    provider: 'google' | 'facebook',
    email?: string,
    name?: string,
    avatar?: string
  ) => {
    setError(null);
    try {
      // Default to user's specified Gmail if not custom provided
      const targetEmail = email || (provider === 'google' ? 'muhammadanasmughal428@gmail.com' : 'user.facebook@example.com');
      const targetName = name || (provider === 'google' ? 'Muhammad Anas Mughal' : 'Facebook User');

      const res = await fetch('/api/auth/oauth-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          provider,
          email: targetEmail,
          name: targetName,
          avatar
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error || 'OAuth authentication failed.';
        setError(msg);
        return { success: false, error: msg };
      }

      localStorage.setItem('saas_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'OAuth network error.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to request password reset' };
      }
      return { success: true, message: data.message, resetToken: data.resetToken };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server error' };
    }
  };

  const resetPassword = async (email: string, token: string, newPassword: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: token.trim(), newPassword })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Password reset failed' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server error' };
    }
  };

  const updateProfile = async (updates: { name?: string; company?: string; avatar?: string }) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Profile update failed' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {
        // silent fail on network disconnect
      }
    }
    localStorage.removeItem('saas_auth_token');
    setToken(null);
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        register,
        loginWithOAuth,
        forgotPassword,
        resetPassword,
        updateProfile,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
