import { apiClient } from "./apiClient";
import type { NodeType, GeoLocation } from "../../types";

export interface FavoriteItem {
  id: string;
  user_id: string;
  type: NodeType;
  name: string;
  address?: string;
  location: GeoLocation;
  created_at: string;
}

export interface FavoriteListResponse {
  spot: FavoriteItem[];
  hotel: FavoriteItem[];
  dining: FavoriteItem[];
}

export interface CreateFavoriteData {
  type: NodeType;
  name: string;
  address?: string;
  location: GeoLocation;
}

const favoriteService = {
  /**
   * Get all favorites, optionally filtered by type
   */
  async getFavorites(type?: NodeType): Promise<FavoriteItem[]> {
    const url = type ? `/api/favorites?type=${type}` : "/api/favorites";
    return apiClient.get<FavoriteItem[]>(url);
  },

  /**
   * Get favorites grouped by type
   */
  async getFavoritesGrouped(): Promise<FavoriteListResponse> {
    return apiClient.get<FavoriteListResponse>("/api/favorites/grouped");
  },

  /**
   * Add a new favorite
   */
  async addFavorite(data: CreateFavoriteData): Promise<FavoriteItem> {
    return apiClient.post<FavoriteItem>("/api/favorites", data);
  },

  /**
   * Delete a favorite by ID
   */
  async deleteFavorite(id: string): Promise<void> {
    return apiClient.delete(`/api/favorites/${id}`);
  },
};

export default favoriteService;
