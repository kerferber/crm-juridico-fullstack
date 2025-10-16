// AUTO-WIRED by backend packager
const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = API_BASE_RAW.replace(/\/$/, '');

import { USERS, CONTACTS, LAWSUITS, TASKS, KANBAN_CARDS, CALENDAR_EVENTS, TRANSACTIONS } from '../data/seed';

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
};

async function request<T = unknown>(endpoint: string, init: RequestInit = {}): Promise<T> {
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

  const headers = new Headers(init.headers ?? {});
  headers.set('Accept', 'application/json');

  const hasBody = init.body !== undefined && init.body !== null;
  const bodyIsJson = hasBody && !(init.body instanceof FormData);
  if (bodyIsJson) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${normalizeEndpoint(endpoint)}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request to ${endpoint} failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return (response.text() as unknown) as T;
}

export const apiClient = {
  get: async <T = unknown>(endpoint: string): Promise<T> =>
    request<T>(endpoint, { method: 'GET' }),

  post: async <T = unknown>(endpoint: string, data: any): Promise<T> =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),

  put: async <T = unknown>(endpoint: string, data: any): Promise<T> =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),

  delete: async (endpoint: string): Promise<void> => {
    await request(endpoint, { method: 'DELETE' });
  },
};

export const isUsingMockApi = isMockMode;
