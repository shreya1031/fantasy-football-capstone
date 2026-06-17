import { create } from 'zustand';
import { api, setAccessToken } from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post<{ user: User; accessToken: string }>('/auth/login', {
      email,
      password,
    });
    setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (email, password, displayName) => {
    const { data } = await api.post<{ user: User; accessToken: string }>('/auth/register', {
      email,
      password,
      displayName,
    });
    setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
