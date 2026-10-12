import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const REFRESH_KEY = 'hms_refresh_token';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function clearAuthTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** For refresh calls outside apiClient (must match baseURL). */
export function getApiBaseUrl() {
  return baseURL;
}

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return null;
  }
  const refreshUrl = baseURL.startsWith('http')
    ? `${baseURL}/auth/refresh/`
    : `${baseURL.replace(/\/$/, '')}/auth/refresh/`;
  const { data } = await axios.post<{ access: string }>(refreshUrl, {
    refresh,
  });
  setAccessToken(data.access);
  return data.access;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      refreshPromise ??= refreshAccessToken();
      const token = await refreshPromise;
      refreshPromise = null;
      if (!token) {
        clearAuthTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      original.headers.Authorization = `Bearer ${token}`;
      return apiClient(original);
    } catch {
      refreshPromise = null;
      clearAuthTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }
  },
);
