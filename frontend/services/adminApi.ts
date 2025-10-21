import { apiClient, RequestOptions } from './api';

const normalizeAdminEndpoint = (endpoint: string): string => {
  const trimmed = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `/admin/${trimmed}`;
};

const authOptions = (token?: string | null): RequestOptions => ({
  includeTenant: false,
  includeUserToken: false,
  adminToken: token ?? localStorage.getItem('adminToken'),
});

export const adminApiClient = {
  get: async <T = unknown>(endpoint: string, token?: string | null): Promise<T> =>
    apiClient.get<T>(normalizeAdminEndpoint(endpoint), authOptions(token)),

  post: async <T = unknown>(endpoint: string, data: any, token?: string | null): Promise<T> =>
    apiClient.post<T>(normalizeAdminEndpoint(endpoint), data, authOptions(token)),

  put: async <T = unknown>(endpoint: string, data: any, token?: string | null): Promise<T> =>
    apiClient.put<T>(normalizeAdminEndpoint(endpoint), data, authOptions(token)),

  delete: async (endpoint: string, token?: string | null): Promise<void> =>
    apiClient.delete(normalizeAdminEndpoint(endpoint), authOptions(token)),
};
