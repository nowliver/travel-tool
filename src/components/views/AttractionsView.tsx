import { MapPin, Trash2, Navigation } from "lucide-react";
import { useTripStore } from "../../store/tripStore";

export function AttractionsView() {
  const favorites = useTripStore((s) => s.favorites);
  const removeFavorite = useTripStore((s) => s.removeFavorite);
  const setHighlightedLocation = useTripStore((s) => s.setHighlightedLocation);

  const handleLocate = (item: typeof favorites[0]) => {
    setHighlightedLocation({
      location: item.location,
      name: item.name,
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">收藏景点</h2>
        <span className="text-xs text-slate-500">{favorites.length} 个</span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">暂无收藏景点</p>
          <p className="text-xs text-slate-500">
            在地图上右键点击任意位置，<br />
            或右键点击行程中的景点，<br />
            选择"加入收藏"即可添加。
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-slate-200 truncate">
                    {item.name}
                  </h3>
                  {item.address && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.address}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-600 mt-1">
                    {new Date(item.addedAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleLocate(item)}
                    className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 transition-colors"
                    title="在地图上定位"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavorite(item.id)}
                    className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="删除收藏"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

