import { jsx } from "react/jsx-runtime";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { ApiError, apiClient } from "../services/api";
const AuthContext = createContext(void 0);
const normalizeString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};
const mapTenantFromApi = (raw) => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const id = Number(raw.id);
  if (Number.isNaN(id)) {
    return null;
  }
  return {
    id,
    name: normalizeString(raw.name) || "Tenant",
    slug: normalizeString(raw.slug) || `tenant-${id}`,
    status: normalizeString(raw.status) || "active",
    createdAt: normalizeString(raw.created_at),
    updatedAt: normalizeString(raw.updated_at),
    usersCount: typeof raw.users_count === "number" ? raw.users_count : void 0
  };
};
const mapUserFromApi = (raw) => {
  const id = Number(raw?.id) || 0;
  const name = normalizeString(raw?.name) || "Usu\xE1rio";
  const email = normalizeString(raw?.email);
  const avatar = normalizeString(raw?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  return {
    id,
    name,
    email,
    avatar,
    tenantId: typeof raw?.tenant_id === "number" ? raw.tenant_id : void 0,
    tenant: mapTenantFromApi(raw?.tenant),
    isTenantAdmin: Boolean(raw?.is_tenant_admin),
    jobTitle: normalizeString(raw?.job_title) || void 0,
    personalEmail: normalizeString(raw?.personal_email) || void 0,
    phone: normalizeString(raw?.phone) || void 0,
    secondaryPhone: normalizeString(raw?.secondary_phone) || void 0,
    whatsapp: normalizeString(raw?.whatsapp) || void 0,
    address: normalizeString(raw?.address) || void 0,
    city: normalizeString(raw?.city) || void 0,
    state: normalizeString(raw?.state) || void 0,
    postalCode: normalizeString(raw?.postal_code) || void 0,
    birthdate: normalizeString(raw?.birthdate) || void 0,
    linkedinUrl: normalizeString(raw?.linkedin_url) || void 0,
    instagramUrl: normalizeString(raw?.instagram_url) || void 0,
    bio: normalizeString(raw?.bio) || void 0
  };
};
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [tenantSlug, setTenantSlugState] = useState(() => localStorage.getItem("tenantSlug"));
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const setTenantSlug = useCallback((slug) => {
    if (slug) {
      localStorage.setItem("tenantSlug", slug);
    } else {
      localStorage.removeItem("tenantSlug");
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
        const profile = await apiClient.get("/auth/user");
        const mappedUser = mapUserFromApi(profile);
        const mappedTenant = mappedUser.tenant ?? mapTenantFromApi(profile?.tenant);
        setUser(mappedUser);
        setTenant(mappedTenant);
        if (mappedTenant?.slug) {
          setTenantSlug(mappedTenant.slug);
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 419)) {
          localStorage.removeItem("token");
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
    async (email, password, slug) => {
      setLoading(true);
      try {
        const response = await apiClient.post("/auth/login", {
          email,
          password,
          tenant_slug: slug
        });
        const authToken = response?.token;
        const rawUser = response?.user;
        const rawTenant = response?.tenant ?? rawUser?.tenant;
        if (!authToken) {
          throw new Error("Token de autentica\xE7\xE3o ausente na resposta do servidor.");
        }
        localStorage.setItem("token", authToken);
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
        throw new Error("N\xE3o foi poss\xEDvel realizar o login. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [setTenantSlug]
  );
  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setTenant(null);
    }
  }, []);
  const updateProfile = useCallback(
    async (updates) => {
      if (!user) {
        throw new Error("Usu\xE1rio n\xE3o autenticado.");
      }
      const payload = {};
      if ("name" in updates) payload.name = updates.name;
      if ("email" in updates) payload.email = updates.email;
      if ("avatar" in updates) payload.avatar = updates.avatar;
      if ("jobTitle" in updates) payload.job_title = updates.jobTitle ?? null;
      if ("personalEmail" in updates) payload.personal_email = updates.personalEmail ?? null;
      if ("phone" in updates) payload.phone = updates.phone ?? null;
      if ("secondaryPhone" in updates) payload.secondary_phone = updates.secondaryPhone ?? null;
      if ("whatsapp" in updates) payload.whatsapp = updates.whatsapp ?? null;
      if ("address" in updates) payload.address = updates.address ?? null;
      if ("city" in updates) payload.city = updates.city ?? null;
      if ("state" in updates) payload.state = updates.state ?? null;
      if ("postalCode" in updates) payload.postal_code = updates.postalCode ?? null;
      if ("birthdate" in updates) payload.birthdate = updates.birthdate ?? null;
      if ("linkedinUrl" in updates) payload.linkedin_url = updates.linkedinUrl ?? null;
      if ("instagramUrl" in updates) payload.instagram_url = updates.instagramUrl ?? null;
      if ("bio" in updates) payload.bio = updates.bio ?? null;
      const response = await apiClient.put(`/users/${user.id}`, payload);
      const mappedUser = mapUserFromApi(response);
      setUser(mappedUser);
      setTenant(mappedUser.tenant ?? tenant);
      return mappedUser;
    },
    [tenant, user]
  );
  const value = useMemo(() => {
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
      updateProfile
    };
  }, [loading, login, logout, tenant, tenantSlug, token, updateProfile, setTenantSlug, user]);
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
};
export {
  AuthProvider,
  useAuth
};
