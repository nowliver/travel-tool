import { useState } from "react";
import { Star, Navigation, Trash2 } from "lucide-react";
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

  const badge =
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
      className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 shadow-sm"
      onContextMenu={handleContextMenu}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <input
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-100 flex-1 min-w-0 truncate focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={node.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                updateNode(node.id, { name: e.target.value || node.name })
              }
            />
          </div>
          <span className="ml-2 inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
            {badge}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>
            {node.time ? `出发时间 ${node.time}` : "点击展开编辑详情"}
          </span>
          <span>{expanded ? "收起 ▲" : "展开 ▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-slate-700 pt-2">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-400">类型</label>
            <select
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={node.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="spot">景点</option>
              <option value="hotel">酒店</option>
              <option value="dining">餐饮</option>
            </select>

            <label className="ml-2 text-[10px] text-slate-400">预算</label>
            <input
              type="number"
              className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={node.cost ?? ""}
              onChange={(e) =>
                updateNode(node.id, {
                  cost: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-400">出行时间</label>
            <input
              type="time"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={node.time ?? ""}
              onChange={(e) =>
                updateNode(node.id, { time: e.target.value || undefined })
              }
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              备注
            </label>
            <textarea
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-100 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={2}
              value={node.notes ?? ""}
              onChange={(e) =>
                updateNode(node.id, { notes: e.target.value || undefined })
              }
              placeholder="例如：已订全季酒店，380 元；预留 2 小时排队等候等"
            />
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
