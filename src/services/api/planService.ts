/**
 * Plan Service - Itinerary plan CRUD operations
 */

import { apiClient } from './apiClient';
import type { TripMeta, DayPlan } from '../../types';

export interface TripContent {
  meta: TripMeta;
  days: DayPlan[];
}

export interface ItineraryPlan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: TripContent;
  created_at: string;
  updated_at: string;
}

export interface ItineraryListItem {
  id: string;
  title: string;
  description: string | null;
  city: string;
  dates: [string, string];
  days_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanRequest {
  title: string;
  description?: string;
  content: TripContent;
}

export interface UpdatePlanRequest {
  title?: string;
  description?: string;
  content?: TripContent;
}

export const planService = {
  /**
   * Get all plans for current user (list view)
   */
  async listPlans(): Promise<ItineraryListItem[]> {
    return apiClient.get<ItineraryListItem[]>('/api/plans');
  },

  /**
   * Get a specific plan by ID
   */
  async getPlan(planId: string): Promise<ItineraryPlan> {
    return apiClient.get<ItineraryPlan>(`/api/plans/${planId}`);
  },

  /**
   * Create a new plan
   */
  async createPlan(data: CreatePlanRequest): Promise<ItineraryPlan> {
    return apiClient.post<ItineraryPlan>('/api/plans', data);
  },

  /**
   * Update an existing plan
   */
  async updatePlan(planId: string, data: UpdatePlanRequest): Promise<ItineraryPlan> {
    return apiClient.put<ItineraryPlan>(`/api/plans/${planId}`, data);
  },

  /**
   * Delete a plan
   */
  async deletePlan(planId: string): Promise<void> {
    return apiClient.delete(`/api/plans/${planId}`);
  },

  /**
   * Save current trip state to a plan (create or update)
   */
  async savePlan(
    planId: string | null,
    title: string,
    meta: TripMeta,
    days: DayPlan[],
    description?: string
  ): Promise<ItineraryPlan> {
    const content: TripContent = { meta, days };
    
    if (planId) {
      return this.updatePlan(planId, { title, description, content });
    } else {
      return this.createPlan({ title, description, content });
    }
  },
};
