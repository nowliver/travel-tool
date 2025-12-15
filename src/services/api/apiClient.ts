/**
 * API Client - Base HTTP client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ApiError {
  detail: string;
  status: number;
}

class ApiClientError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Get the stored auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Set the auth token in localStorage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Remove the auth token from localStorage
 */
export function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Build request headers with optional auth token
 */
function buildHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Handle API response and parse JSON
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = 'An error occurred';
    try {
      const errorData = await response.json();
      detail = errorData.detail || detail;
    } catch {
      detail = response.statusText;
    }
    throw new ApiClientError(detail, response.status, detail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * API Client methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: buildHeaders(includeAuth),
    });
    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders(includeAuth),
    });
    return handleResponse<T>(response);
  },
};

export { ApiClientError };
export type { ApiError };
