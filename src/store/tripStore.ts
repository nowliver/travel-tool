import { create } from "zustand";
import type {
  DayPlan,
  FavoriteItem,
  PlanNode,
  TripMeta,
  TripStore,
  TripStoreState,
} from "../types";
import { demoTrip } from "../utils/demoData";

const initialState: TripStoreState = {
  meta: demoTrip.meta,
  days: demoTrip.days,
  sidebarWidth: 360,
  isResizingSidebar: false,
  confirmedCity: demoTrip.meta.city || null,
  highlightedLocation: null,
  favorites: [],
};

export const useTripStore = create<TripStore>((set, get) => ({
  ...initialState,

  addNode: (dayIndex, node) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.day_index === dayIndex
          ? { ...day, nodes: [...day.nodes, node] }
          : day
      ),
    })),

  reorderNodes: (dayIndex, oldIndex, newIndex) =>
    set((state) => {
      const days = state.days.map((day) => {
        if (day.day_index !== dayIndex) return day;
        const nodes = [...day.nodes];
        const [moved] = nodes.splice(oldIndex, 1);
        nodes.splice(newIndex, 0, moved);
        return { ...day, nodes };
      });
      return { days };
    }),

  moveNodeAcrossDays: (fromDayIndex, toDayIndex, nodeId, toIndex) =>
    set((state) => {
      let movingNode: PlanNode | undefined;

      const daysWithoutNode: DayPlan[] = state.days.map((day) => {
        if (day.day_index !== fromDayIndex) return day;
        const remaining = day.nodes.filter((node) => {
          if (node.id === nodeId) {
            movingNode = node;
            return false;
          }
          return true;
        });
        return { ...day, nodes: remaining };
      });

      if (!movingNode) return state;

      const updatedDays = daysWithoutNode.map((day) => {
        if (day.day_index !== toDayIndex) return day;
        const nodes = [...day.nodes];
        const insertIndex =
          typeof toIndex === "number" && toIndex >= 0 && toIndex <= nodes.length
            ? toIndex
            : nodes.length;
        nodes.splice(insertIndex, 0, movingNode as PlanNode);
        return { ...day, nodes };
      });

      return { days: updatedDays };
    }),

  updateNode: (nodeId, data) =>
    set((state) => ({
      days: state.days.map((day) => ({
        ...day,
        nodes: day.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...data } : node
        ),
      })),
    })),

  setMeta: (meta: Partial<TripMeta>) =>
    set((state) => ({
      meta: { ...state.meta, ...meta },
    })),

  addDay: () =>
    set((state) => {
      const lastDay = state.days[state.days.length - 1];
      const nextIndex = (lastDay?.day_index ?? 0) + 1;
      let date: string | undefined;
      if (lastDay?.date) {
        const d = new Date(lastDay.date);
        d.setDate(d.getDate() + 1);
        date = d.toISOString().slice(0, 10);
      }
      const newDay: DayPlan = {
        day_index: nextIndex,
        date,
        nodes: [],
      };
      return { days: [...state.days, newDay] };
    }),

  setDayDate: (dayIndex, date) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.day_index === dayIndex ? { ...day, date } : day
      ),
    })),

  removeDay: (dayIndex) =>
    set((state) => {
      if (state.days.length <= 1) return state;
      return {
        days: state.days
          .filter((d) => d.day_index !== dayIndex)
          .map((d, idx) => ({ ...d, day_index: idx + 1 })),
      };
    }),

  removeNode: (dayIndex, nodeId) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.day_index === dayIndex
          ? {
              ...day,
              nodes: day.nodes.filter((n) => n.id !== nodeId),
            }
          : day
      ),
    })),

  setTrip: (next) =>
    set(() => ({
      meta: next.meta,
      days: next.days,
      sidebarWidth: next.sidebarWidth ?? 360,
      isResizingSidebar: false,
      confirmedCity: next.meta?.city || null,
      highlightedLocation: null,
    })),

  setSidebarWidth: (width) =>
    set(() => {
      const clamped = Math.min(520, Math.max(280, width));
      return { sidebarWidth: clamped };
    }),

  setIsResizingSidebar: (isResizing) =>
    set(() => ({
      isResizingSidebar: isResizing,
    })),

  setConfirmedCity: (city) =>
    set(() => ({
      confirmedCity: city,
    })),

  setHighlightedLocation: (location) =>
    set(() => ({
      highlightedLocation: location,
    })),

  // 收藏操作
  addFavorite: (item) =>
    set((state) => {
      // 生成唯一 ID
      const id = `fav-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newFavorite: FavoriteItem = {
        ...item,
        id,
        addedAt: Date.now(),
      };
      return { favorites: [...state.favorites, newFavorite] };
    }),

  removeFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.filter((f) => f.id !== id),
    })),
}));


