import { useState, useEffect } from "react";
import { Star, Trash2, MapPin, BedDouble, Utensils } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { useTripStore } from "../../store/tripStore";
import { useAuthStore } from "../../store/authStore";
import favoriteService from "../../services/api/favoriteService";
import type { FavoriteItem as ApiFavoriteItem } from "../../services/api/favoriteService";
import type { NodeType, FavoriteItem } from "../../types";

type FavoriteTab = "spot" | "hotel" | "dining";

const TAB_LABELS: Record<FavoriteTab, string> = {
  spot: "景点",
  hotel: "住宿",
  dining: "美食",
};

const TYPE_CONFIG: Record<NodeType, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; label: string }> = {
  spot: {
    icon: MapPin,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    label: "景点",
  },
  hotel: {
    icon: BedDouble,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "住宿",
  },
  dining: {
    icon: Utensils,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    label: "美食",
  },
};

interface DraggableFavoriteCardProps {
  favorite: ApiFavoriteItem;
  onDelete: (id: string) => void;
  onLocate: (favorite: ApiFavoriteItem) => void;
}

function DraggableFavoriteCard({ favorite, onDelete, onLocate }: DraggableFavoriteCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `favorite-${favorite.id}`,
    data: {
      type: "favorite",
      favorite: {
        id: favorite.id,
        name: favorite.name,
        location: favorite.location,
        type: favorite.type,
        address: favorite.address,
      },
    },
  });

  const typeConfig = TYPE_CONFIG[favorite.type];
  const TypeIcon = typeConfig.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group relative bg-zinc-900/50 border border-white/[0.04] hover:bg-zinc-900/70 hover:border-white/[0.08] rounded-xl transition-all duration-300 backdrop-blur-sm shadow-card hover:shadow-card-hover p-3 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[13px] font-medium text-zinc-200 truncate">
              {favorite.name}
            </h4>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${typeConfig.bgColor} ${typeConfig.color} whitespace-nowrap`}>
              <TypeIcon className="w-2.5 h-2.5" />
              {typeConfig.label}
            </span>
          </div>
          {favorite.address && (
            <p className="text-[11px] text-zinc-500 truncate">{favorite.address}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLocate(favorite);
            }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-white/[0.08] text-zinc-500 hover:text-emerald-400"
            title="在地图上定位"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(favorite.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-white/[0.08] text-zinc-500 hover:text-red-400"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function FavoritesView() {
  const [activeTab, setActiveTab] = useState<FavoriteTab>("spot");
  const [favorites, setFavorites] = useState<Record<FavoriteTab, ApiFavoriteItem[]>>({
    spot: [],
    hotel: [],
    dining: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { setHighlightedLocation } = useTripStore();
  const isAuthenticated = !!user;

  const loadFavorites = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await favoriteService.getFavoritesGrouped();
      setFavorites(data);
    } catch (err) {
      console.error("Failed to load favorites:", err);
      setError("加载收藏失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [isAuthenticated]);

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return;

    try {
      await favoriteService.deleteFavorite(id);
      // 刷新列表
      await loadFavorites();
    } catch (err) {
      console.error("Failed to delete favorite:", err);
      alert("删除收藏失败");
    }
  };

  const handleLocate = (favorite: ApiFavoriteItem) => {
    setHighlightedLocation({
      location: favorite.location,
      name: favorite.name,
    });
  };

  const currentFavorites = favorites[activeTab] || [];

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Star className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">请先登录查看收藏</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.04]">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
          <Star className="w-5 h-5 text-emerald-500" />
          我的收藏
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-3 border-b border-white/[0.04]">
        {(Object.keys(TAB_LABELS) as FavoriteTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-[11px] font-semibold rounded-lg transition-all duration-300 ${
              activeTab === tab
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.04] hover:border-white/[0.08]"
            }`}
          >
            {TAB_LABELS[tab]} ({favorites[tab]?.length || 0})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-zinc-500">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : currentFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Star className="w-10 h-10 text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-500">暂无{TAB_LABELS[activeTab]}收藏</p>
            <p className="text-xs text-zinc-600 mt-1">
              在行程中右键点击节点可添加到收藏
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentFavorites.map((fav) => (
              <DraggableFavoriteCard
                key={fav.id}
                favorite={fav}
                onDelete={handleDelete}
                onLocate={handleLocate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Tip */}
      <div className="p-3 border-t border-white/[0.04] bg-zinc-900/30">
        <p className="text-[10px] text-zinc-600 text-center">
          💡 拖动收藏项到行程面板可快速添加到行程
        </p>
      </div>
    </div>
  );
}
