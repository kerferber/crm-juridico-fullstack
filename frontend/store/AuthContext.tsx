import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ApiError, apiClient } from '../services/api';
import { User } from '../types/types';

type ProfileUpdates = Partial<Omit<User, 'id'>>;

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapUserFromApi = (raw: any): User => {
  const id = Number(raw?.id) || 0;
  const name =
    typeof raw?.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim() : 'Usuário';
  const email =
    typeof raw?.email === 'string' && raw.email.trim().length > 0 ? raw.email.trim() : '';
  const avatar =
    typeof raw?.avatar === 'string' && raw.avatar.trim().length > 0
      ? raw.avatar.trim()
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

  return {
    id,
    name,
    avatar,
    email,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profile = await apiClient.get('/auth/user');
        setUser(mapUserFromApi(profile));
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 419)) {
          localStorage.removeItem('token');
        }
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        const authToken = (response as any)?.token;
        const rawUser = (response as any)?.user;

        if (!authToken) {
          throw new Error('Token de autenticação ausente na resposta do servidor.');
        }

        localStorage.setItem('token', authToken);
        setToken(authToken);
        setUser(mapUserFromApi(rawUser));
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new Error('Não foi possível realizar o login. Tente novamente.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      // Ignora erros de logout para garantir que o estado local seja limpo.
      console.error(error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: ProfileUpdates) => {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      const payload: Record<string, any> = {};

      if ('name' in updates) payload.name = updates.name;
      if ('email' in updates) payload.email = updates.email;
      if ('avatar' in updates) payload.avatar = updates.avatar;
      if ('jobTitle' in updates) payload.job_title = updates.jobTitle ?? null;
      if ('personalEmail' in updates) payload.personal_email = updates.personalEmail ?? null;
      if ('phone' in updates) payload.phone = updates.phone ?? null;
      if ('secondaryPhone' in updates) payload.secondary_phone = updates.secondaryPhone ?? null;
      if ('whatsapp' in updates) payload.whatsapp = updates.whatsapp ?? null;
      if ('address' in updates) payload.address = updates.address ?? null;
      if ('city' in updates) payload.city = updates.city ?? null;
      if ('state' in updates) payload.state = updates.state ?? null;
      if ('postalCode' in updates) payload.postal_code = updates.postalCode ?? null;
      if ('birthdate' in updates) payload.birthdate = updates.birthdate ?? null;
      if ('linkedinUrl' in updates) payload.linkedin_url = updates.linkedinUrl ?? null;
      if ('instagramUrl' in updates) payload.instagram_url = updates.instagramUrl ?? null;
      if ('bio' in updates) payload.bio = updates.bio ?? null;

      const response = await apiClient.put(`/users/${user.id}`, payload);
      const mappedUser = mapUserFromApi(response);
      setUser(mappedUser);
      return mappedUser;
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      updateProfile,
    };
  }, [loading, login, logout, token, updateProfile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
