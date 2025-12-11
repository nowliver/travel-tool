import { useState } from "react";
import { MapPin, BedDouble, Utensils, Bus, X } from "lucide-react";
import { AttractionsView } from "../views/AttractionsView";
import { AccommodationView } from "../views/AccommodationView";
import { DiningView } from "../views/DiningView";
import { CommuteView } from "../views/CommuteView";
import { useTripStore } from "../../store/tripStore";
import { RESIZE_HANDLE_WIDTH } from "./ResizeHandle";

type TabType = "attractions" | "hotel" | "dining" | "commute";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

const tabs: TabConfig[] = [
  { id: "attractions", label: "景点", icon: MapPin, component: AttractionsView },
  { id: "hotel", label: "住宿", icon: BedDouble, component: AccommodationView },
  { id: "dining", label: "美食", icon: Utensils, component: DiningView },
  { id: "commute", label: "出行", icon: Bus, component: CommuteView },
];

export function FloatingNavLayer() {
  const [activeTab, setActiveTab] = useState<TabType>("attractions");
  const [isOpen, setIsOpen] = useState(false);
  const sidebarWidth = useTripStore((s) => s.sidebarWidth);

  const handleTabClick = (tabId: TabType) => {
    if (!isOpen) {
      // 抽屉关闭时，点击任意 Icon -> 自动展开抽屉并切换到对应 Tab
      setActiveTab(tabId);
      setIsOpen(true);
    } else if (activeTab === tabId) {
      // 抽屉打开时，点击当前已激活的 Icon -> 收起抽屉
      setIsOpen(false);
    } else {
      // 抽屉打开时，点击其他 Icon -> 切换 Tab 内容（保持展开）
      setActiveTab(tabId);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || AttractionsView;
  // 精确计算：sidebar宽度 + resize handle宽度 = 悬浮层left
  const offsetLeft = sidebarWidth + RESIZE_HANDLE_WIDTH;

  return (
    <div
      className="absolute inset-y-0 pointer-events-none z-40 flex"
      style={{ left: offsetLeft }}
    >
      {/* 垂直功能栏 (Icon Bar) */}
      <div className="w-16 bg-slate-900/95 backdrop-blur-sm border-r border-slate-800 shadow-lg pointer-events-auto flex flex-col items-center py-4 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && isOpen;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
              }`}
              title={tab.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* 详情抽屉 (Content Panel) */}
      <div
        className={`bg-slate-900/95 backdrop-blur-sm border-r border-slate-800 shadow-2xl pointer-events-auto transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "w-80" : "w-0"
        }`}
      >
        {isOpen && (
          <div className="h-full flex flex-col">
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="收起"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 抽屉内容 */}
            <div className="flex-1 overflow-y-auto">
              <ActiveComponent />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

