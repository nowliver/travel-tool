import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, LogIn, Cloud, Loader2, MapPin, Calendar, Plus, ChevronRight, Search, Save } from "lucide-react";
import { useTripStore } from "../../store/tripStore";
import { useAuthStore } from "../../store/authStore";
import { DayTabs } from "./DayTabs";
import { NodeCard } from "./NodeCard";
import { CommuteInfo } from "./CommuteInfo";
import { mapService, type CitySearchResult } from "../../services/mapService";
import { planService } from "../../services/api";
import type { MapSearchResult } from "../../services/mock/mockMapService";
import type { PlanNode } from "../../types";
import { ConfirmModal } from "../ui/ConfirmModal";

interface ItineraryPanelProps {
  onOpenAuth: () => void;
  onOpenPlans: () => void;
}

export function ItineraryPanel({ onOpenAuth, onOpenPlans }: ItineraryPanelProps) {
  const meta = useTripStore((s) => s.meta);
  const days = useTripStore((s) => s.days);
  const setMeta = useTripStore((s) => s.setMeta);
  const addDay = useTripStore((s) => s.addDay);
  const removeDay = useTripStore((s) => s.removeDay);
  const setTrip = useTripStore((s) => s.setTrip);
  const reorderNodes = useTripStore((s) => s.reorderNodes);
  const moveNodeAcrossDays = useTripStore((s) => s.moveNodeAcrossDays);
  const addNode = useTripStore((s) => s.addNode);
  const confirmedCity = useTripStore((s) => s.confirmedCity);
  const setConfirmedCity = useTripStore((s) => s.setConfirmedCity);
  const setHighlightedLocation = useTripStore((s) => s.setHighlightedLocation);
  const highlightedLocation = useTripStore((s) => s.highlightedLocation);
  const user = useAuthStore((s) => s.user);

  const [activeDayIndex, setActiveDayIndex] = useState(
    days[0]?.day_index ?? 1
  );
  const [savedCities, setSavedCities] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<MapSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingCityChange, setPendingCityChange] = useState<{
    city: string;
    center: { lat: number; lng: number };
  } | null>(null);
  const [selectedPlanCity, setSelectedPlanCity] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [citySearchKeyword, setCitySearchKeyword] = useState<string>("");
  const [citySearchResults, setCitySearchResults] = useState<CitySearchResult[]>([]);
  const [citySearching, setCitySearching] = useState<boolean>(false);
  const [showCitySearch, setShowCitySearch] = useState<boolean>(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [cloudSaveMessage, setCloudSaveMessage] = useState<string>("");
  const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState(false);

  const PLAN_PREFIX = "litetravel:plan:";
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const activeDay = days.find((d) => d.day_index === activeDayIndex);

  const handleConfirmDeleteDay = useCallback(() => {
    setShowDeleteDayConfirm(false);
    removeDay(activeDayIndex);
    setActiveDayIndex(days[0]?.day_index ?? 1);
  }, [activeDayIndex, days, removeDay]);

  useEffect(() => {
    if (days.length === 0) return;
    const validDay = days.find((d) => d.day_index === activeDayIndex);
    if (!validDay) {
      setActiveDayIndex(days[0].day_index);
    }
  }, [days, activeDayIndex]);

  useEffect(() => {
    refreshSavedCities();
  }, []);

  const refreshSavedCities = () => {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(window.localStorage).filter((k) =>
        k.startsWith(PLAN_PREFIX)
      );
      setSavedCities(keys.map((k) => k.slice(PLAN_PREFIX.length)));
    } catch {
      // ignore
    }
  };

  const handleCitySearch = async (keyword: string) => {
    setCitySearchKeyword(keyword);
    if (!keyword.trim()) {
      setCitySearchResults([]);
      return;
    }

    setCitySearching(true);
    try {
      const results = await mapService.searchCity(keyword);
      setCitySearchResults(results);
    } catch (e) {
      console.error("City search failed:", e);
    } finally {
      setCitySearching(false);
    }
  };

  const handleSelectCity = (cityResult: CitySearchResult) => {
    setPendingCityChange({
      city: cityResult.name,
      center: cityResult.location,
    });
    
    if (!confirmedCity) {
      setMeta({ 
        city: cityResult.name, 
        center: cityResult.location 
      });
      setConfirmedCity(cityResult.name);
      setPendingCityChange(null);
      setShowCitySearch(false);
      setCitySearchKeyword("");
    }
  };

  const handleConfirmCityChange = () => {
    if (!pendingCityChange) return;
    setMeta({ 
      city: pendingCityChange.city, 
      center: pendingCityChange.center 
    });
    setConfirmedCity(pendingCityChange.city);
    setPendingCityChange(null);
    setShowCitySearch(false);
    setCitySearchKeyword("");
  };

  const handleCancelCityChange = () => {
    setPendingCityChange(null);
    setShowCitySearch(false);
    setCitySearchKeyword("");
  };

  const handleSavePlan = () => {
    const planId = `${PLAN_PREFIX}${meta.city}`;
    const data = { meta, days };
    localStorage.setItem(planId, JSON.stringify(data));
    setSaveMessage("已保存");
    setTimeout(() => setSaveMessage(""), 2000);
    refreshSavedCities();
  };

  const handleLoadPlan = (city: string) => {
    const dataStr = localStorage.getItem(`${PLAN_PREFIX}${city}`);
    if (dataStr) {
      try {
        const { meta: m, days: d } = JSON.parse(dataStr);
        setTrip({ meta: m, days: d });
        setConfirmedCity(m.city);
        setSelectedPlanCity("");
      } catch (e) {
        console.error("Failed to load plan", e);
      }
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    
    setSearching(true);
    setTimeout(() => {
        const mockResult: MapSearchResult = {
            id: `search-${Date.now()}`,
            name: searchKeyword,
            location: meta.center || { lat: 39.9, lng: 116.4 },
            address: `在${confirmedCity}附近的搜索结果`
        };
        setSearchResults([mockResult]);
        setSearching(false);
    }, 500);
  };

  const handleHighlightLocation = (item: MapSearchResult) => {
    setHighlightedLocation({
        location: item.location,
        name: item.name
    });
  };

  const handleAddFromSearch = (item: MapSearchResult) => {
    const newNode: PlanNode = {
        id: `node-${Date.now()}`,
        name: item.name,
        location: item.location,
        type: 'spot',
    };
    addNode(activeDayIndex, newNode);
    setSearchKeyword("");
    setSearchResults([]);
  };

  const handleSaveToCloud = async () => {
    if (!user) return;
    
    setIsSavingToCloud(true);
    setCloudSaveMessage("");
    
    try {
      const planData = {
        title: `${meta.city}行程计划`,
        description: `包含 ${days.length} 天的行程`,
        content: {
          meta,
          days,
          confirmedCity,
          highlightedLocation,
          sidebarWidth: 320 
        }
      };
      
      await planService.createPlan(planData);
      setCloudSaveMessage("已同步");
      setTimeout(() => setCloudSaveMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save to cloud:", error);
      setCloudSaveMessage("同步失败");
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // 处理从收藏夹拖拽到行程
    if (active.data.current?.type === 'favorite') {
      const favorite = active.data.current.favorite;
      
      // 确定目标 day
      let targetDayIndex = activeDayIndex;
      if (over.data.current?.type === 'day') {
        targetDayIndex = over.data.current.dayIndex;
      } else {
        // 如果拖拽到节点上，找到该节点所在的 day
        const targetDay = days.find(day => 
          day.nodes.some(node => node.id === over.id)
        );
        if (targetDay) {
          targetDayIndex = targetDay.day_index;
        }
      }

      // 创建新节点
      const newNode: PlanNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: favorite.name,
        location: favorite.location,
        type: favorite.type,
      };

      addNode(targetDayIndex, newNode);
      setActiveDayIndex(targetDayIndex);
      return;
    }

    // 处理行程内拖拽排序
    if (active.id !== over.id) {
      const activeNodeDay = days.find(day => 
        day.nodes.some(node => node.id === active.id)
      );
      
      if (over.data.current?.type === 'day') {
        const targetDayIndex = over.data.current.dayIndex;
        if (activeNodeDay && activeNodeDay.day_index !== targetDayIndex) {
          moveNodeAcrossDays(
            activeNodeDay.day_index,
            targetDayIndex,
            active.id as string,
            0 
          );
          setActiveDayIndex(targetDayIndex);
        }
        return;
      }

      if (activeNodeDay) {
        const oldIndex = activeNodeDay.nodes.findIndex(node => node.id === active.id);
        const newIndex = activeNodeDay.nodes.findIndex(node => node.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderNodes(activeNodeDay.day_index, oldIndex, newIndex);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-sans selection:bg-emerald-500/30">
      {/* Header Area */}
      <div className="px-5 pt-5 pb-4 space-y-4 bg-gradient-to-b from-zinc-900/40 to-transparent">
        {/* User & Cloud Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user ? (
              <button 
                onClick={onOpenPlans}
                className="flex items-center gap-2.5 group px-2 py-1.5 -ml-2 rounded-xl hover:bg-white/[0.04] transition-all duration-200"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/15 transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors">{user.email.split('@')[0]}</p>
                  <p className="text-[9px] text-zinc-500 tracking-wide">查看我的行程</p>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 group px-3 py-2 rounded-lg bg-zinc-800/60 border border-white/[0.04] hover:bg-zinc-800 hover:border-white/[0.08] transition-all duration-200"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 font-medium">登录同步数据</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePlan}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors relative group"
              title="保存到本地"
            >
              <Save className="w-4 h-4" />
              {saveMessage && (
                <span className="absolute right-0 -bottom-6 text-[10px] text-emerald-500 whitespace-nowrap animate-fade-in bg-zinc-900 px-2 py-0.5 rounded border border-emerald-500/20">
                  {saveMessage}
                </span>
              )}
            </button>
            {user && (
              <button
                onClick={handleSaveToCloud}
                disabled={isSavingToCloud}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors relative group"
                title="同步到云端"
              >
                {isSavingToCloud ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className={`w-4 h-4 ${cloudSaveMessage ? "text-emerald-500" : ""}`} />
                )}
                {cloudSaveMessage && (
                  <span className="absolute right-0 -bottom-6 text-[10px] text-emerald-500 whitespace-nowrap animate-fade-in bg-zinc-900 px-2 py-0.5 rounded border border-emerald-500/20">
                    {cloudSaveMessage}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* City Selector */}
        <div className="relative z-20">
          <div 
            className="group cursor-pointer inline-flex flex-col"
            onClick={() => setShowCitySearch(!showCitySearch)}
          >
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight flex items-center gap-1.5 group-hover:text-white transition-colors">
              {confirmedCity || "选择目的地"}
              <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform duration-300 ${showCitySearch ? "rotate-90" : ""} group-hover:text-zinc-400`} />
            </h1>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium tracking-wide">
              {days.length} 天行程 · {meta.dates[0] || "未定日期"}
            </p>
          </div>

          {/* City Search Dropdown */}
          {showCitySearch && (
            <div className="absolute top-full left-0 w-full mt-3 glass-panel rounded-2xl overflow-hidden animate-fade-in origin-top z-50 border border-white/10 shadow-2xl">
              <div className="p-3 border-b border-white/5 bg-zinc-900/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    autoFocus
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl pl-10 pr-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:bg-zinc-950 focus:border-emerald-500/30 transition-all"
                    placeholder="输入城市名称..."
                    value={citySearchKeyword}
                    onChange={(e) => handleCitySearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scroll p-1.5 bg-zinc-900/90">
                {citySearching ? (
                  <div className="p-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    搜索中...
                  </div>
                ) : citySearchResults.length > 0 ? (
                  citySearchResults.map((city) => (
                    <button
                      key={city.adcode}
                      onClick={() => handleSelectCity(city)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 transition-all flex items-center justify-between group"
                    >
                      <span className="font-medium">{city.name}</span>
                      <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500 bg-black/20 px-2 py-0.5 rounded-full">{city.fullName || city.level}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-600">
                    {citySearchKeyword ? "未找到城市" : "输入关键词开始搜索"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Pending City Confirmation */}
        {pendingCityChange && (
          <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4 animate-fade-in">
            <p className="text-xs text-amber-200/90">
              切换到 <strong>{pendingCityChange.city}</strong>？现有行程将被清空。
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleConfirmCityChange}
                className="px-3 py-1.5 bg-amber-500 text-amber-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                确认
              </button>
              <button
                onClick={handleCancelCityChange}
                className="px-3 py-1.5 bg-amber-950/30 text-amber-200/70 text-xs font-medium rounded-lg hover:bg-amber-950/50 hover:text-amber-100 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Days Navigation */}
      <div className="relative z-10 border-b border-white/[0.04] bg-zinc-950/60 backdrop-blur-md">
        <DayTabs
          days={days}
          activeDayIndex={activeDayIndex}
          onChange={setActiveDayIndex}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-scroll no-scrollbar relative bg-zinc-950">
        {/* Timeline Line */}
        <div className="absolute inset-y-0 left-8 w-px border-l border-dashed border-zinc-800/40 z-0 ml-4" />
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="p-5 space-y-5 relative z-10 pl-10">
            {activeDay && (
              <SortableContext
                items={activeDay.nodes.map((n) => n.id)}
                strategy={verticalListSortingStrategy}
              >
                {/* Empty State */}
                {activeDay.nodes.length === 0 && (
                  <div className="text-center py-14 border border-dashed border-zinc-800/40 rounded-2xl bg-zinc-900/30 ml-[-1rem]">
                    <div className="w-12 h-12 bg-zinc-900/80 rounded-xl flex items-center justify-center mx-auto mb-3 border border-zinc-800/50">
                      <MapPin className="w-5 h-5 text-zinc-600" />
                    </div>
                    <p className="text-[13px] font-medium text-zinc-400">本日暂无行程</p>
                    <p className="text-[11px] text-zinc-600 mt-1">搜索地点或点击下方按钮添加</p>
                  </div>
                )}

                {/* Nodes List */}
                {activeDay.nodes.map((node, index) => (
                  <div key={node.id} className="relative group">
                    {/* Commute Info (if not first node) */}
                    {index > 0 && (
                      <div className="-ml-6 mb-4">
                        <CommuteInfo
                          from={activeDay.nodes[index - 1]}
                          to={node}
                        />
                      </div>
                    )}
                    
                    {/* Time Marker */}
                    <div className="absolute -left-[42px] top-5 text-[10px] font-mono text-zinc-500 w-8 text-right hidden sm:block">
                      {node.time || "09:00"}
                    </div>
                    
                    {/* Timeline Dot */}
                    <div className="absolute -left-[21px] top-5 w-2 h-2 rounded-full bg-zinc-700 border-2 border-zinc-950 group-hover:bg-emerald-500 group-hover:scale-150 transition-all duration-300 z-20 shadow-[0_0_0_3px_rgba(0,0,0,0.6)]" />

                    <SortableNodeCard
                      node={node}
                      dayIndex={activeDayIndex}
                    />
                  </div>
                ))}
              </SortableContext>
            )}

            {/* Quick Add Search */}
            <div className="-ml-2 mt-6">
              <form onSubmit={handleSearchSubmit} className="relative group mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-9 pr-3 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:bg-zinc-900 focus:border-emerald-500/30 transition-all shadow-sm"
                  placeholder="快速添加地点 (回车搜索)..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </form>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="mb-4 bg-zinc-900/80 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md shadow-xl animate-fade-in">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group/item"
                    >
                      <div className="flex-1 min-w-0 mr-3 cursor-pointer" onClick={() => handleHighlightLocation(item)}>
                        <p className="text-xs font-medium text-zinc-200 truncate">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{item.address}</p>
                      </div>
                      <button
                        onClick={() => handleAddFromSearch(item)}
                        className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500 hover:text-emerald-950 transition-colors"
                      >
                        添加
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  const newId = `node-${Date.now()}`;
                  addNode(activeDayIndex, {
                    id: newId,
                    name: "新地点",
                    location: meta.center || { lat: 39.9042, lng: 116.4074 },
                    type: "spot",
                  });
                }}
                className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs font-medium hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                添加空白节点
              </button>
            </div>
          </div>
        </DndContext>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-white/[0.04] bg-zinc-900/60 backdrop-blur-md flex justify-between gap-2 z-20">
        <button
          onClick={() => addDay()}
          className="flex-1 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-[11px] font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.98] border border-white/[0.04] hover:border-white/[0.08]"
        >
          <Calendar className="w-3.5 h-3.5" />
          添加日期
        </button>
        {days.length > 1 && (
          <button
            onClick={() => {
              setShowDeleteDayConfirm(true);
            }}
            className="px-3 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-400/70 text-[11px] font-medium rounded-lg transition-colors hover:text-red-400 border border-red-500/10 hover:border-red-500/20"
          >
            删除
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteDayConfirm}
        title="删除日期"
        message="确定要删除当前天吗？该操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        danger
        onCancel={() => setShowDeleteDayConfirm(false)}
        onConfirm={handleConfirmDeleteDay}
      />
    </div>
  );
}

interface SortableNodeCardProps {
  node: PlanNode;
  dayIndex: number;
}

function SortableNodeCard({ node, dayIndex }: SortableNodeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: node.id,
    data: { type: "node", dayIndex },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NodeCard node={node} dayIndex={dayIndex} />
    </div>
  );
}
