'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'MASTER_RESELLER' | 'SUB_RESELLER' | 'CUSTOMER';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED';
  companyName?: string;
  wallet?: {
    balance: number;
    currency: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  activeUser: UserProfile | null;
  impersonatedUser: UserProfile | null;
  isImpersonating: boolean;
  token: string | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  impersonate: (token: string, user: UserProfile) => void;
  exitImpersonation: () => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeUser: null,
  impersonatedUser: null,
  isImpersonating: false,
  token: null,
  loading: true,
  login: () => {},
  impersonate: () => {},
  exitImpersonation: () => {},
  logout: () => {},
  refreshUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadState = () => {
    try {
      const storedToken = localStorage.getItem('voicepro_token');
      const storedUser = localStorage.getItem('voicepro_user');
      const impToken = localStorage.getItem('impersonated_token');
      const impUser = localStorage.getItem('impersonated_user');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } else {
        // Fallback default admin if first visit
        const defaultAdmin: UserProfile = {
          id: 'd166a452-4830-4dc0-b178-3ffb095af9b1',
          name: 'Admin',
          email: 'admin@mail.com',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          wallet: { balance: 850.13, currency: 'BDT' },
        };
        setUser(defaultAdmin);
        localStorage.setItem('voicepro_user', JSON.stringify(defaultAdmin));
        localStorage.setItem('voicepro_token', 'default_token');
        setToken('default_token');
      }

      if (impToken && impUser) {
        setImpersonatedUser(JSON.parse(impUser));
      } else {
        setImpersonatedUser(null);
      }
    } catch (e) {
      console.error('Error loading auth state:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();

    // Listen for storage changes across tabs or window events
    const handleStorage = () => loadState();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('voicepro_token', newToken);
    localStorage.setItem('voicepro_user', JSON.stringify(newUser));
    localStorage.removeItem('impersonated_token');
    localStorage.removeItem('impersonated_user');
    setUser(newUser);
    setToken(newToken);
    setImpersonatedUser(null);
  };

  const impersonate = (impToken: string, impCustomer: UserProfile) => {
    localStorage.setItem('impersonated_token', impToken);
    localStorage.setItem('impersonated_user', JSON.stringify(impCustomer));
    setImpersonatedUser(impCustomer);
  };

  const exitImpersonation = () => {
    localStorage.removeItem('impersonated_token');
    localStorage.removeItem('impersonated_user');
    setImpersonatedUser(null);
    window.location.href = '/customers';
  };

  const logout = () => {
    localStorage.removeItem('voicepro_token');
    localStorage.removeItem('voicepro_user');
    localStorage.removeItem('impersonated_token');
    localStorage.removeItem('impersonated_user');
    setUser(null);
    setImpersonatedUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  const activeUser = impersonatedUser || user;
  const isImpersonating = !!impersonatedUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        activeUser,
        impersonatedUser,
        isImpersonating,
        token: impersonatedUser ? (typeof window !== 'undefined' ? localStorage.getItem('impersonated_token') : null) : token,
        loading,
        login,
        impersonate,
        exitImpersonation,
        logout,
        refreshUser: loadState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
