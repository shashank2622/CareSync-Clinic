import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.js';
import { authApi } from '../api/index.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  quickLogin: (role: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem('refresh_token', res.data.refreshToken);
      setUser(res.data.user);
    }
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    if (res.success && res.data) {
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem('refresh_token', res.data.refreshToken);
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token') || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Ignore logout api errors on client cleanup
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const quickLogin = async (role: Role) => {
    let email = 'alice@example.com';
    let password = 'Patient@123';

    if (role === 'DOCTOR') {
      email = 'dr.sarah@clinic.com';
      password = 'Doctor@123';
    } else if (role === 'ADMIN') {
      email = 'admin@clinic.com';
      password = 'Admin@123';
    }

    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        quickLogin,
        refreshUser,
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
