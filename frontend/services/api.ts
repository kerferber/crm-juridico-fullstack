// AUTO-WIRED by backend packager
const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = API_BASE_RAW.replace(/\/$/, '');

export const API_BASE_URL = API_BASE;

import {
  USERS,
  CONTACTS,
  LAWSUITS,
  TASKS,
  KANBAN_CARDS,
  CALENDAR_EVENTS,
  TRANSACTIONS,
  GOAL_PROGRAMS,
  GOALS,
  GOAL_CHECKPOINTS,
  GOAL_ASSIGNMENTS,
  GOAL_NOTIFICATIONS,
} from '../data/seed';

// Este cliente chama o backend Laravel quando `VITE_API_BASE_URL` está definido.
// Caso contrário, mantém o comportamento mock utilizando os dados locais.

const FAKE_API_DELAY = 400; // ms
const isMockMode = !API_BASE;

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

const mockApi = {
  '/users': USERS,
  '/contacts': CONTACTS,
  '/lawsuits': LAWSUITS,
  '/tasks': TASKS,
  '/kanban-cards': KANBAN_CARDS,
  '/calendar-events': CALENDAR_EVENTS,
  '/transactions': TRANSACTIONS,
  '/goal-programs': GOAL_PROGRAMS,
  '/goals': GOALS,
  '/goal-checkpoints': GOAL_CHECKPOINTS,
  '/goal-assignments': GOAL_ASSIGNMENTS,
  '/goal-notifications': GOAL_NOTIFICATIONS,
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  includeTenant?: boolean;
  includeUserToken?: boolean;
  adminToken?: string | null;
}

async function request<T = unknown>(
  endpoint: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  if (isMockMode) {
    console.log(`[API MOCK] ${init.method ?? 'GET'}: ${endpoint}`);
    await delay(FAKE_API_DELAY);

    if (init.method && init.method !== 'GET' && init.body) {
      return clone({
        ...(typeof init.body === 'string' ? JSON.parse(init.body) : init.body),
        id: Date.now(),
      }) as T;
    }

    const data = mockApi[normalizeEndpoint(endpoint) as keyof typeof mockApi];
    return clone((data ?? [])) as T;
  }

  const { includeTenant = true, includeUserToken = true, adminToken = null } = options;

  const headers = new Headers(init.headers ?? {});
  headers.set('Accept', 'application/json');

  const hasBody = init.body !== undefined && init.body !== null;
  const bodyIsJson = hasBody && !(init.body instanceof FormData);
  if (bodyIsJson) {
    headers.set('Content-Type', 'application/json');
  }

  if (includeUserToken) {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (adminToken) {
    headers.set('Authorization', `Bearer ${adminToken}`);
  }

  if (includeTenant) {
    const tenantSlug = localStorage.getItem('tenantSlug');
    if (tenantSlug) {
      headers.set('X-Tenant', tenantSlug);
    }
  }


  if (typeof window !== 'undefined') {
    const socketId = (window as any)?.Echo?.socketId?.();
    if (socketId) {
      headers.set('X-Socket-Id', socketId);
    }
  }
  const response = await fetch(`${API_BASE}${normalizeEndpoint(endpoint)}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const parseBody = async () => {
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }

    try {
      return await response.text();
    } catch {
      return null;
    }
  };

  if (!response.ok) {
    const errorPayload = await parseBody();
    const message =
      (typeof errorPayload === 'string' && errorPayload) ||
      (typeof errorPayload === 'object' && errorPayload && 'message' in errorPayload
        ? String((errorPayload as any).message)
        : '') ||
      `Request to ${endpoint} failed with status ${response.status}`;
    throw new ApiError(response.status, message, errorPayload);
  }

  if (response.status === 204) {
    return null as T;
  }

  if (contentType.includes('application/json')) {
    return (await parseBody()) as T;
  }

  return (response.text() as unknown) as T;
}

export const apiClient = {
  get: async <T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { method: 'GET' }, options),

  post: async <T = unknown>(endpoint: string, data: any, options?: RequestOptions): Promise<T> =>
    request<T>(
      endpoint,
      {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
      },
      options
    ),

  put: async <T = unknown>(endpoint: string, data: any, options?: RequestOptions): Promise<T> =>
    request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
      },
      options
    ),

  delete: async (endpoint: string, options?: RequestOptions): Promise<void> => {
    await request(endpoint, { method: 'DELETE' }, options);
  },
};

export const isUsingMockApi = isMockMode;

export type { RequestOptions };
