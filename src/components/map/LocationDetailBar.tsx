import { X, Star, Calendar } from "lucide-react";
import type { GeoLocation, NodeType } from "../../types";

export interface LocationDetailBarProps {
  poi: {
    name: string;
    location: GeoLocation;
    address?: string;
    type?: NodeType;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToFavorites?: () => void;
  onAddToPlan?: (dayIndex: number) => void;
  days?: Array<{ day_index: number; date?: string }>;
}

export function LocationDetailBar({
  poi,
  isOpen,
  onClose,
  onAddToFavorites,
  onAddToPlan,
  days = [],
}: LocationDetailBarProps) {
  if (!isOpen || !poi) return null;

  return (
    <>
      {/* 遮罩层：点击时关闭详情栏 */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] transition-opacity"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />

      {/* 底部详情栏 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 shadow-2xl z-[101] transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-100 truncate">
                {poi.name}
              </h2>
              {poi.address && (
                <p className="text-sm text-slate-400 truncate mt-0.5">
                  {poi.address}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                经纬度: {poi.location.lng.toFixed(5)}, {poi.location.lat.toFixed(5)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 占位内容区域（预留） */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-3 text-center text-slate-500 text-sm">
            <p>详情内容区域（预留）</p>
            <p className="text-xs mt-1">未来可添加：评分、照片、营业时间等信息</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAddToFavorites}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 rounded-lg border border-slate-700 hover:border-emerald-500 transition-all font-medium"
            >
              <Star className="w-4 h-4" />
              <span>加入收藏</span>
            </button>

            {/* 加入计划按钮 + 下拉菜单 */}
            <div className="flex-1 relative group">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all font-medium"
              >
                <Calendar className="w-4 h-4" />
                <span>加入计划</span>
              </button>

              {/* 悬浮子菜单（选择天数） */}
              {days.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  {days.map((day) => (
                    <button
                      key={day.day_index}
                      type="button"
                      onClick={() => onAddToPlan?.(day.day_index)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 hover:text-slate-50 transition-colors border-b border-slate-800 last:border-b-0"
                    >
                      Day {day.day_index}
                      {day.date && <span className="text-xs text-slate-500 ml-2">({day.date})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


