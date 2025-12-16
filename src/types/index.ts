// Core domain types for LiteTravel

export type NodeType = "spot" | "hotel" | "dining";

export interface GeoLocation {
  lat: number;
  lng: number;
}

// Commute info is always "from this node to the next node"
export type CommuteMode = "taxi" | "transit";

export interface CommuteInfo {
  distance_text: string; // e.g. "5.2km"
  duration_text: string; // e.g. "20min"
  mode: CommuteMode;
}

export interface PlanNode {
  id: string;
  type: NodeType;
  name: string;
  location: GeoLocation;

  // User filled fields
  cost?: number;
  notes?: string;
  // Planned visit time within the day, e.g. "09:30"
  time?: string;

  // Optional cached commute data to next node
  to_next_commute?: CommuteInfo;
}

export interface DayPlan {
  day_index: number; // 1-based index in UI
  date?: string; // ISO date for that day, optional convenience
  nodes: PlanNode[];
}

export interface TripMeta {
  city: string;
  // [startISO, endISO]
  dates: [string, string];
  // Optional center of the city on map
  center?: GeoLocation;
}

// 收藏项（复用 PlanNode 的核心字段，便于与行程互转）
export interface FavoriteItem {
  id: string;
  name: string;
  location: GeoLocation;
  type: NodeType;
  address?: string;
  addedAt: number; // timestamp
}

export interface TripStoreState {
  meta: TripMeta;
  days: DayPlan[];
  // Layout state
  sidebarWidth: number; // px
  isResizingSidebar: boolean;
  // Confirmed city (only confirmed city triggers map jump and search)
  confirmedCity: string | null;
  // Highlighted location from search results (not yet added to plan)
  highlightedLocation?: {
    location: GeoLocation;
    name: string;
  } | null;
  // 收藏列表
  favorites: FavoriteItem[];
}

export interface TripStoreActions {
  addNode: (dayIndex: number, node: PlanNode) => void;
  reorderNodes: (dayIndex: number, oldIndex: number, newIndex: number) => void;
  moveNodeAcrossDays: (
    fromDayIndex: number,
    toDayIndex: number,
    nodeId: string,
    toIndex?: number
  ) => void;
  updateNode: (nodeId: string, data: Partial<PlanNode>) => void;
  setMeta: (meta: Partial<TripMeta>) => void;
  addDay: () => void;
  setDayDate: (dayIndex: number, date: string) => void;
  removeDay: (dayIndex: number) => void;
  removeNode: (dayIndex: number, nodeId: string) => void;
  setTrip: (state: Partial<TripStoreState>) => void;
  setSidebarWidth: (width: number) => void;
  setIsResizingSidebar: (isResizing: boolean) => void;
  setConfirmedCity: (city: string | null) => void;
  setHighlightedLocation: (location: { location: GeoLocation; name: string } | null) => void;
  // 收藏操作
  addFavorite: (item: Omit<FavoriteItem, "id" | "addedAt">) => void;
  removeFavorite: (id: string) => void;
}

export type TripStore = TripStoreState & TripStoreActions;


