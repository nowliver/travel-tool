/**
 * Auth Service - User authentication and session management
 */

import { apiClient, setAuthToken, removeAuthToken, isAuthenticated } from './apiClient';

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

// Store current user in memory
let currentUser: User | null = null;

/**
 * Get stored user from localStorage
 */
function getStoredUser(): User | null {
  const stored = localStorage.getItem('auth_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Store user in localStorage
 */
function storeUser(user: User): void {
  localStorage.setItem('auth_user', JSON.stringify(user));
  currentUser = user;
}

/**
 * Clear stored user
 */
function clearStoredUser(): void {
  localStorage.removeItem('auth_user');
  currentUser = null;
}

export const authService = {
  /**
   * Register a new user account
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await apiClient.post<AuthResponse>(
      '/api/auth/register',
      credentials,
      false
    );
    
    setAuthToken(response.access_token);
    storeUser(response.user);
    
    return response.user;
  },

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post<AuthResponse>(
      '/api/auth/login',
      credentials,
      false
    );
    
    setAuthToken(response.access_token);
    storeUser(response.user);
    
    return response.user;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore logout API errors
    } finally {
      removeAuthToken();
      clearStoredUser();
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isAuthenticated()) {
      return null;
    }

    // Return cached user if available
    if (currentUser) {
      return currentUser;
    }

    // Try to get from localStorage
    const storedUser = getStoredUser();
    if (storedUser) {
      currentUser = storedUser;
      return storedUser;
    }

    // Fetch from API
    try {
      const user = await apiClient.get<User>('/api/auth/me');
      storeUser(user);
      return user;
    } catch {
      // Token might be expired
      removeAuthToken();
      clearStoredUser();
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return isAuthenticated();
  },

  /**
   * Get current user synchronously (from cache)
   */
  getUser(): User | null {
    return currentUser || getStoredUser();
  },
};
