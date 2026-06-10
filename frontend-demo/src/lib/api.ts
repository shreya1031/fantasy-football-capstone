import axios, { AxiosError } from 'axios';
import type { ApiError } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = localStorage.getItem('accessToken');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ accessToken: string }>('/auth/refresh')
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/register') &&
      !original._retry
    ) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  return fallback;
}
