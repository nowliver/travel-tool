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
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[100] transition-opacity"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />

      {/* 底部详情栏 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-white/[0.06] shadow-2xl z-[101] transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 py-4">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-zinc-100 truncate tracking-tight">
                {poi.name}
              </h2>
              {poi.address && (
                <p className="text-[13px] text-zinc-400 truncate mt-0.5">
                  {poi.address}
                </p>
              )}
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                经纬度: {poi.location.lng.toFixed(5)}, {poi.location.lat.toFixed(5)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-3 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors shrink-0"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 占位内容区域（预留） */}
          <div className="bg-zinc-800/40 rounded-xl p-3 mb-3 text-center text-zinc-500 text-[12px] border border-white/[0.04]">
            <p>详情内容区域（预留）</p>
            <p className="text-[11px] mt-0.5 text-zinc-600">未来可添加：评分、照片、营业时间等信息</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onAddToFavorites}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800/60 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-200 rounded-xl border border-white/[0.06] hover:border-emerald-500 transition-all duration-200 text-[13px] font-medium"
            >
              <Star className="w-3.5 h-3.5" />
              <span>加入收藏</span>
            </button>

            {/* 加入计划按钮 + 下拉菜单 */}
            <div className="flex-1 relative group">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all duration-200 text-[13px] font-medium shadow-lg shadow-emerald-900/20"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>加入计划</span>
              </button>

              {/* 悬浮子菜单（选择天数） */}
              {days.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  {days.map((day) => (
                    <button
                      key={day.day_index}
                      type="button"
                      onClick={() => onAddToPlan?.(day.day_index)}
                      className="w-full text-left px-3 py-2 text-[12px] text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors border-b border-white/[0.04] last:border-b-0"
                    >
                      Day {day.day_index}
                      {day.date && <span className="text-[11px] text-zinc-500 ml-1.5">({day.date})</span>}
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


