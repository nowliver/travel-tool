/**
 * API Services - Export all API-related services
 */

export { apiClient, setAuthToken, removeAuthToken, isAuthenticated, ApiClientError } from './apiClient';
export { authService } from './authService';
export type { User, AuthResponse, LoginCredentials, RegisterCredentials } from './authService';
export { planService } from './planService';
export type { 
  ItineraryPlan, 
  ItineraryListItem, 
  CreatePlanRequest, 
  UpdatePlanRequest,
  TripContent 
} from './planService';
