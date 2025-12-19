import { useState } from "react";
import { MapPin, BedDouble, Utensils, Bus, Star, X } from "lucide-react";
import { AttractionsView } from "../views/AttractionsView";
import { AccommodationView } from "../views/AccommodationView";
import { DiningView } from "../views/DiningView";
import { CommuteView } from "../views/CommuteView";
import { FavoritesView } from "../views/FavoritesView";
import { useTripStore } from "../../store/tripStore";
import { RESIZE_HANDLE_WIDTH } from "./ResizeHandle";

type TabType = "attractions" | "hotel" | "dining" | "commute" | "favorites";

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
  { id: "favorites", label: "收藏", icon: Star, component: FavoritesView },
];

export function FloatingNavLayer() {
  const [activeTab, setActiveTab] = useState<TabType>("attractions");
  const [isOpen, setIsOpen] = useState(false);
  const sidebarWidth = useTripStore((s) => s.sidebarWidth);

  const handleTabClick = (tabId: TabType) => {
    if (!isOpen) {
      setActiveTab(tabId);
      setIsOpen(true);
    } else if (activeTab === tabId) {
      setIsOpen(false);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || AttractionsView;
  const offsetLeft = sidebarWidth + RESIZE_HANDLE_WIDTH;

  return (
    <div
      className="absolute inset-y-0 pointer-events-none z-40 flex py-4"
      style={{ left: offsetLeft }}
    >
      {/* 垂直功能栏 (Dock) */}
      <div className="w-14 h-fit min-h-[45vh] ml-3 bg-zinc-900/80 backdrop-blur-2xl rounded-2xl pointer-events-auto flex flex-col items-center py-5 gap-3 shadow-card border border-white/[0.06]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && isOpen;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ease-out-expo ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 shadow-glow"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]"
              } active:scale-90`}
              title={tab.label}
            >
              <Icon className={`w-[18px] h-[18px] transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`} />
              
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute -left-[3px] w-[3px] h-3.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900/95 backdrop-blur-sm text-[11px] font-medium text-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap border border-white/[0.06] shadow-lg translate-x-1 group-hover:translate-x-0">
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* 详情抽屉 (Content Panel) */}
      <div
        className={`pointer-events-auto transition-all duration-500 ease-out-expo ${
          isOpen ? "w-[380px] opacity-100 translate-x-3" : "w-0 opacity-0 -translate-x-2 pointer-events-none"
        }`}
      >
        <div className="h-full bg-zinc-900/85 backdrop-blur-2xl rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col shadow-elevation-3 mr-3">
          {/* 抽屉头部 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                {(() => {
                  const Icon = tabs.find(t => t.id === activeTab)?.icon;
                  return Icon ? <Icon className="w-4 h-4" /> : null;
                })()}
              </span>
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-all duration-200 active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 抽屉内容 */}
          <div className="flex-1 overflow-y-auto custom-scroll bg-zinc-950/30">
            <div className="h-full">
              <ActiveComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

