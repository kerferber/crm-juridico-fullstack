import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, apiClient } from '../services/api';
import { adminApiClient } from '../services/adminApi';

interface AdminProfile {
  id: number;
  name: string;
  email: string;
}

interface AdminAuthContextValue {
  admin: AdminProfile | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_PROFILE_KEY = 'adminProfile';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [admin, setAdmin] = useState<AdminProfile | null>(() => {
    const stored = localStorage.getItem(ADMIN_PROFILE_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as AdminProfile;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ token: string; admin: AdminProfile }>(
        '/admin/login',
        { email, password },
        { includeTenant: false, includeUserToken: false }
      );

      const adminToken = response.token;
      const profile = response.admin;

      localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));

      setToken(adminToken);
      setAdmin(profile);
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new Error('Não foi possível autenticar no painel administrativo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await adminApiClient.post('logout', {}, token);
      } catch (error) {
        console.error('[AdminAuth] Falha ao encerrar sessão', error);
      }
    }

    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_PROFILE_KEY);
    setToken(null);
    setAdmin(null);
  }, [token]);

  const value = useMemo<AdminAuthContextValue>(() => {
    return {
      admin,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
    };
  }, [admin, loading, login, logout, token]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = (): AdminAuthContextValue => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth deve ser utilizado dentro de um AdminAuthProvider');
  }
  return context;
};
