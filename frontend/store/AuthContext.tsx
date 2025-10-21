import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApiError, apiClient } from '../services/api';
import { Tenant, User } from '../types/types';

type ProfileUpdates = Partial<Omit<User, 'id' | 'tenant' | 'tenantId'>>;

interface AuthContextValue {
  user: User | null;
  tenant: Tenant | null;
  tenantSlug: string | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  setTenantSlug: (slug: string | null) => void;
  login: (email: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const mapTenantFromApi = (raw: any): Tenant | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const id = Number(raw.id);
  if (Number.isNaN(id)) {
    return null;
  }

  return {
    id,
    name: normalizeString(raw.name) || 'Tenant',
    slug: normalizeString(raw.slug) || `tenant-${id}`,
    status: normalizeString(raw.status) || 'active',
    createdAt: normalizeString(raw.created_at),
    updatedAt: normalizeString(raw.updated_at),
    usersCount: typeof raw.users_count === 'number' ? raw.users_count : undefined,
  };
};

const mapUserFromApi = (raw: any): User => {
  const id = Number(raw?.id) || 0;
  const name = normalizeString(raw?.name) || 'Usuário';
  const email = normalizeString(raw?.email);
  const avatar = normalizeString(raw?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

  return {
    id,
    name,
    email,
    avatar,
    tenantId: typeof raw?.tenant_id === 'number' ? raw.tenant_id : undefined,
    tenant: mapTenantFromApi(raw?.tenant),
    isTenantAdmin: Boolean(raw?.is_tenant_admin),
    jobTitle: normalizeString(raw?.job_title) || undefined,
    personalEmail: normalizeString(raw?.personal_email) || undefined,
    phone: normalizeString(raw?.phone) || undefined,
    secondaryPhone: normalizeString(raw?.secondary_phone) || undefined,
    whatsapp: normalizeString(raw?.whatsapp) || undefined,
    address: normalizeString(raw?.address) || undefined,
    city: normalizeString(raw?.city) || undefined,
    state: normalizeString(raw?.state) || undefined,
    postalCode: normalizeString(raw?.postal_code) || undefined,
    birthdate: normalizeString(raw?.birthdate) || undefined,
    linkedinUrl: normalizeString(raw?.linkedin_url) || undefined,
    instagramUrl: normalizeString(raw?.instagram_url) || undefined,
    bio: normalizeString(raw?.bio) || undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [tenantSlug, setTenantSlugState] = useState<string | null>(() => localStorage.getItem('tenantSlug'));
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const setTenantSlug = useCallback((slug: string | null) => {
    if (slug) {
      localStorage.setItem('tenantSlug', slug);
    } else {
      localStorage.removeItem('tenantSlug');
    }
    setTenantSlugState(slug);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setTenant(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profile = await apiClient.get('/auth/user');
        const mappedUser = mapUserFromApi(profile);
        const mappedTenant = mappedUser.tenant ?? mapTenantFromApi((profile as any)?.tenant);

        setUser(mappedUser);
        setTenant(mappedTenant);
        if (mappedTenant?.slug) {
          setTenantSlug(mappedTenant.slug);
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 419)) {
          localStorage.removeItem('token');
        }
        setUser(null);
        setTenant(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token, setTenantSlug]);

  const login = useCallback(
    async (email: string, password: string, slug: string) => {
      setLoading(true);
      try {
        const response = await apiClient.post('/auth/login', {
          email,
          password,
          tenant_slug: slug,
        });

        const authToken = (response as any)?.token;
        const rawUser = (response as any)?.user;
        const rawTenant = (response as any)?.tenant ?? rawUser?.tenant;

        if (!authToken) {
          throw new Error('Token de autenticação ausente na resposta do servidor.');
        }

        localStorage.setItem('token', authToken);

        setToken(authToken);
        setTenantSlug(slug);

        const mappedUser = mapUserFromApi(rawUser);
        const mappedTenant = mapTenantFromApi(rawTenant) ?? mappedUser.tenant ?? null;

        setUser(mappedUser);
        setTenant(mappedTenant);
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new Error('Não foi possível realizar o login. Tente novamente.');
      } finally {
        setLoading(false);
      }
    },
    [setTenantSlug]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setTenant(null);
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
      setTenant(mappedUser.tenant ?? tenant);
      return mappedUser;
    },
    [tenant, user]
  );

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      tenant,
      tenantSlug,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      setTenantSlug,
      login,
      logout,
      updateProfile,
    };
  }, [loading, login, logout, tenant, tenantSlug, token, updateProfile, setTenantSlug, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
