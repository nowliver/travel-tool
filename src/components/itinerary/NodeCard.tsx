import { useState } from "react";
import { Star, Navigation, Trash2, Clock, Wallet, FileText, MoreHorizontal } from "lucide-react";
import type { PlanNode, NodeType } from "../../types";
import { useTripStore } from "../../store/tripStore";
import { ContextMenu, useContextMenu, type ContextMenuItem } from "../ui/ContextMenu";

interface NodeCardProps {
  node: PlanNode;
  dayIndex: number;
}

export function NodeCard({ node, dayIndex }: NodeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const updateNode = useTripStore((s) => s.updateNode);
  const removeNode = useTripStore((s) => s.removeNode);
  const addFavorite = useTripStore((s) => s.addFavorite);
  const setHighlightedLocation = useTripStore((s) => s.setHighlightedLocation);

  // 右键菜单
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();

  const badgeColor =
    node.type === "spot"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : node.type === "hotel"
      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
      : "bg-orange-500/10 text-orange-400 border-orange-500/20";

  const badgeLabel =
    node.type === "spot"
      ? "景点"
      : node.type === "hotel"
      ? "酒店"
      : "餐饮";

  const handleTypeChange = (value: string) => {
    const t = value as NodeType;
    updateNode(node.id, { type: t });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e);
  };

  const handleAddToFavorites = () => {
    addFavorite({
      name: node.name,
      location: node.location,
      type: node.type,
    });
  };

  const handleLocateOnMap = () => {
    setHighlightedLocation({
      location: node.location,
      name: node.name,
    });
  };

  const handleDelete = () => {
    removeNode(dayIndex, node.id);
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      id: "add-to-favorites",
      label: "加入收藏",
      icon: <Star className="w-4 h-4" />,
      onClick: handleAddToFavorites,
    },
    {
      id: "locate-on-map",
      label: "在地图上定位",
      icon: <Navigation className="w-4 h-4" />,
      onClick: handleLocateOnMap,
    },
    {
      id: "delete",
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <div
      className="group relative bg-zinc-900/50 border border-white/[0.04] hover:bg-zinc-900/70 hover:border-white/[0.08] rounded-xl transition-all duration-300 backdrop-blur-sm shadow-card hover:shadow-card-hover"
      onContextMenu={handleContextMenu}
    >
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent border-none p-0 text-[13px] font-medium text-zinc-200 placeholder-zinc-600 focus:ring-0 focus:outline-none"
              value={node.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                updateNode(node.id, { name: e.target.value || node.name })
              }
            />
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md border ${badgeColor} font-semibold tracking-wide`}>
                {badgeLabel}
              </span>
              {(node.time || node.cost !== undefined && node.cost !== null) && (
                <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono">
                  {node.time && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {node.time}
                    </span>
                  )}
                  {(node.cost !== undefined && node.cost !== null) && (
                    <span className="flex items-center gap-0.5">
                      <Wallet className="w-2.5 h-2.5" />
                      ¥{node.cost}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <button 
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-300"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e);
            }}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 animate-fade-in">
          <div className="pt-2.5 border-t border-white/[0.04] space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-zinc-500 mb-1 block font-medium tracking-wide">类型</label>
                <select
                  className="w-full bg-zinc-950/60 border border-white/[0.04] rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500/30 appearance-none transition-colors"
                  value={node.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="spot">景点</option>
                  <option value="hotel">酒店</option>
                  <option value="dining">餐饮</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 mb-1 block font-medium tracking-wide">出行时间</label>
                <input
                  type="time"
                  className="w-full bg-zinc-950/60 border border-white/[0.04] rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500/30 font-mono transition-colors"
                  value={node.time ?? ""}
                  onChange={(e) =>
                    updateNode(node.id, { time: e.target.value || undefined })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 mb-1 block font-medium tracking-wide">预算 (元)</label>
              <input
                type="number"
                min={0}
                className="w-full bg-zinc-950/60 border border-white/[0.04] rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500/30 font-mono transition-colors"
                placeholder="0.0"
                value={node.cost ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = val === '' ? undefined : Math.max(0, Number(val));
                  updateNode(node.id, { cost: num });
                }}
              />
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 mb-1 flex items-center gap-1 font-medium tracking-wide">
                <FileText className="w-2.5 h-2.5" />
                备注
              </label>
              <textarea
                className="w-full bg-zinc-950/60 border border-white/[0.04] rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 resize-none focus:outline-none focus:border-emerald-500/30 min-h-[50px] transition-colors"
                rows={2}
                value={node.notes ?? ""}
                onChange={(e) =>
                  updateNode(node.id, { notes: e.target.value || undefined })
                }
                placeholder="添加备注信息..."
              />
            </div>
            
            <div className="flex justify-end pt-0.5">
              <button
                onClick={handleDelete}
                className="text-[9px] text-red-400/80 hover:text-red-400 px-2 py-1 hover:bg-red-500/10 rounded-md transition-all duration-200 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-2.5 h-2.5" />
                删除节点
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
