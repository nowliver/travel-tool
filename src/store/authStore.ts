import { create } from 'zustand';
import { authService, type User } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login({ email, password });
      set({ user, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.register({ email, password });
      set({ user, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({ user: null, isLoading: false });
    }
  },

  initialize: async () => {
    if (!authService.isAuthenticated()) {
      set({ isInitialized: true });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isLoading: false, isInitialized: true });
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  clearError: () => set({ error: null }),
}));
