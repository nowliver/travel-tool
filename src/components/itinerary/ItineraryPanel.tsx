import { useEffect, useState } from "react";
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
import { User, LogIn, Cloud, CloudOff, Loader2 } from "lucide-react";
import { useTripStore } from "../../store/tripStore";
import { useAuthStore } from "../../store/authStore";
import { DayTabs } from "./DayTabs";
import { NodeCard } from "./NodeCard";
import { CommuteInfo } from "./CommuteInfo";
import { mapService, type CitySearchResult } from "../../services/mapService";
import { planService } from "../../services/api";
import type { MapSearchResult } from "../../services/mock/mockMapService";
import type { PlanNode } from "../../types";

interface ItineraryPanelProps {
  onOpenAuth: () => void;
  onOpenPlans: () => void;
}

export function ItineraryPanel({ onOpenAuth, onOpenPlans }: ItineraryPanelProps) {
  const meta = useTripStore((s) => s.meta);
  const days = useTripStore((s) => s.days);
  const setMeta = useTripStore((s) => s.setMeta);
  const addDay = useTripStore((s) => s.addDay);
  const setDayDate = useTripStore((s) => s.setDayDate);
  const removeDay = useTripStore((s) => s.removeDay);
  const setTrip = useTripStore((s) => s.setTrip);
  const reorderNodes = useTripStore((s) => s.reorderNodes);
  const moveNodeAcrossDays = useTripStore((s) => s.moveNodeAcrossDays);
  const addNode = useTripStore((s) => s.addNode);
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
  const confirmedCity = useTripStore((s) => s.confirmedCity);
  const setConfirmedCity = useTripStore((s) => s.setConfirmedCity);
  const setHighlightedLocation = useTripStore((s) => s.setHighlightedLocation);
  const highlightedLocation = useTripStore((s) => s.highlightedLocation);
  
  // Auth state
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [cloudSaveMessage, setCloudSaveMessage] = useState<string>("");

  const PLAN_PREFIX = "litetravel:plan:";
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // 同步activeDayIndex，确保当days变化时不会指向无效的day
  useEffect(() => {
    if (days.length === 0) return;
    const validDay = days.find((d) => d.day_index === activeDayIndex);
    if (!validDay) {
      setActiveDayIndex(days[0].day_index);
    }
  }, [days, activeDayIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(window.localStorage).filter((k) =>
        k.startsWith(PLAN_PREFIX)
      );
      setSavedCities(keys.map((k) => k.slice(PLAN_PREFIX.length)));
    } catch {
      // ignore
    }
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

  const handleSavePlan = () => {
    if (!meta.city || typeof window === "undefined") return;
    const key = `${PLAN_PREFIX}${meta.city}`;
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({ meta, days }, null, 2)
      );
      refreshSavedCities();
      setSaveMessage("已保存到本地");
      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (e) {
      console.error("Failed to save plan", e);
    }
  };

  const handleSaveToCloud = async () => {
    if (!user || !meta.city) return;
    setIsSavingToCloud(true);
    setCloudSaveMessage("");
    try {
      const title = `${meta.city}旅行计划`;
      await planService.savePlan(null, title, meta, days);
      setCloudSaveMessage("已同步到云端");
      setTimeout(() => setCloudSaveMessage(""), 3000);
    } catch (err) {
      setCloudSaveMessage("同步失败");
      setTimeout(() => setCloudSaveMessage(""), 3000);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleLoadPlan = (cityName: string) => {
    if (!cityName || typeof window === "undefined") return;
    const key = `${PLAN_PREFIX}${cityName}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed.meta || !parsed.days || !Array.isArray(parsed.days)) return;
      // 确保days数组不为空
      if (parsed.days.length === 0) {
        parsed.days = [{ day_index: 1, nodes: [] }];
      }
      // 确保所有day都有有效的day_index
      parsed.days = parsed.days.map((d: any, idx: number) => ({
        ...d,
        day_index: d.day_index ?? idx + 1,
        nodes: Array.isArray(d.nodes) ? d.nodes : [],
      }));
      setTrip(parsed);
      setSelectedPlanCity(cityName);
      // 加载计划后，自动确认城市（这会触发地图跳转）
      // setTrip 已经设置了 meta（包括 center），所以这里只需要确认城市即可
      if (parsed.meta?.city) {
        setConfirmedCity(parsed.meta.city);
      }
      // 清除搜索结果和搜索关键词
      setSearchResults([]);
      setSearchKeyword("");
      setHighlightedLocation(null);
      const firstDay = parsed.days[0];
      if (firstDay?.day_index) {
        setActiveDayIndex(firstDay.day_index);
      }
    } catch (e) {
      console.error("Failed to load plan", e);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citySearchKeyword.trim()) return;
    setCitySearching(true);
    try {
      const results = await mapService.searchCity(citySearchKeyword.trim());
      setCitySearchResults(results);
    } catch (err) {
      console.error("City search failed", err);
      setCitySearchResults([]);
    } finally {
      setCitySearching(false);
    }
  };

  const handleSelectCity = (city: CitySearchResult) => {
    // 设置城市和中心点，然后确认城市（这会触发地图跳转）
    setMeta({ city: city.name, center: city.location });
    setConfirmedCity(city.name);
    setCitySearchResults([]);
    setCitySearchKeyword("");
    setShowCitySearch(false);
  };

  const handleConfirmCity = () => {
    if (!meta.city || !meta.city.trim()) return;
    setConfirmedCity(meta.city.trim());
  };

  const activeDay =
    days.find((d) => d.day_index === activeDayIndex) ?? (days.length > 0 ? days[0] : null);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    if (!confirmedCity) {
      alert("请先确认旅游城市");
      return;
    }
    setSearching(true);
    setPendingCityChange(null);
    setHighlightedLocation(null);
    try {
      // 限定搜索范围在行政区内部
      const bounds = meta.center
        ? { center: meta.center, radius: 50000 } // 50km半径（城市级别）
        : undefined;
      
      const res = await mapService.search(
        searchKeyword.trim(),
        confirmedCity, // 使用已确认的城市
        bounds
      );
      
      if (res.length > 0) {
        // 检查第一个结果是否在当前城市范围内
        const firstResult = res[0];
        if (bounds) {
          // 计算距离（使用Haversine公式）
          const R = 6371000; // 地球半径（米）
          const lat1 = (bounds.center.lat * Math.PI) / 180;
          const lat2 = (firstResult.location.lat * Math.PI) / 180;
          const deltaLat = ((firstResult.location.lat - bounds.center.lat) * Math.PI) / 180;
          const deltaLng = ((firstResult.location.lng - bounds.center.lng) * Math.PI) / 180;
          const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) *
              Math.cos(lat2) *
              Math.sin(deltaLng / 2) *
              Math.sin(deltaLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceMeters = R * c;
          
          // 如果距离超过50km，提示用户可能不在当前城市
          if (distanceMeters > bounds.radius) {
            setPendingCityChange({
              city: searchKeyword.trim(),
              center: firstResult.location,
            });
            setSearchResults(res);
            setSearching(false);
            return;
          }
        }
        setSearchResults(res);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmCityChange = () => {
    if (!pendingCityChange) return;
    setMeta({
      city: pendingCityChange.city,
      center: pendingCityChange.center,
    });
    setPendingCityChange(null);
  };

  const handleCancelCityChange = () => {
    setPendingCityChange(null);
    setSearchResults([]);
  };

  const handleHighlightLocation = (item: MapSearchResult) => {
    // 在地图上定位并标识，但不加入计划
    setHighlightedLocation({
      location: item.location,
      name: item.name,
    });
  };

  const handleAddFromSearch = (item: MapSearchResult) => {
    if (!activeDay || !activeDay.day_index) return;
    const node: PlanNode = {
      id: `${item.id}-${Date.now()}`,
      type: "spot",
      name: item.name,
      location: item.location,
    };
    addNode(activeDay.day_index, node);
    // 添加后清除高亮
    setHighlightedLocation(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as any;
    const overData = over.data.current as any;

    if (activeData?.type !== "node") return;

    const fromDayIndex = activeData.dayIndex as number;
    const fromDay = days.find((d) => d.day_index === fromDayIndex);
    if (!fromDay) return;

    // 拖到另一个节点上：同日内重排或跨日移动
    if (overData?.type === "node") {
      const toDayIndex = overData.dayIndex as number;
      if (fromDayIndex === toDayIndex) {
        const oldIndex = fromDay.nodes.findIndex((n) => n.id === active.id);
        const newIndex = fromDay.nodes.findIndex((n) => n.id === over.id);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
        reorderNodes(fromDayIndex, oldIndex, newIndex);
      } else {
        // 跨日移动：找到目标节点在目标日中的位置
        const toDay = days.find((d) => d.day_index === toDayIndex);
        if (!toDay) return;
        const targetNodeIndex = toDay.nodes.findIndex((n) => n.id === over.id);
        moveNodeAcrossDays(
          fromDayIndex,
          toDayIndex,
          active.id as string,
          targetNodeIndex >= 0 ? targetNodeIndex : undefined
        );
      }
      return;
    }

    // 拖到某个 Day Tab 上：跨日移动（添加到目标日的末尾）
    if (overData?.type === "day") {
      const toDayIndex = overData.dayIndex as number;
      if (fromDayIndex !== toDayIndex) {
        moveNodeAcrossDays(fromDayIndex, toDayIndex, active.id as string);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            LiteTravel · Demo
          </div>
          {/* Auth Section */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={onOpenPlans}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500 hover:text-blue-300 transition"
                >
                  <Cloud size={12} />
                  我的行程
                </button>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <User size={10} className="text-white" />
                  </div>
                  <span className="max-w-[80px] truncate">{user.email.split('@')[0]}</span>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-[10px] text-slate-500 hover:text-red-400 transition ml-1"
                  >
                    退出
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                <LogIn size={12} />
                登录/注册
              </button>
            )}
          </div>
        </div>
        {/* 城市选择与日期：响应式布局，窄宽度时自动堆叠 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 城市选择器 */}
          <div className="flex items-center gap-2 relative min-w-0">
            {!showCitySearch ? (
              <>
                <input
                  className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 w-24 min-w-0 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={confirmedCity || ""}
                  readOnly
                  placeholder="目的地"
                />
                {confirmedCity && (
                  <span className="text-[10px] text-emerald-400 whitespace-nowrap">✓ {confirmedCity}</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowCitySearch(true)}
                  className="text-[11px] px-2 py-1 rounded-md bg-slate-800 text-slate-100 border border-slate-700 hover:border-emerald-500 hover:text-emerald-300 transition whitespace-nowrap"
                >
                  {confirmedCity ? "切换城市" : "选择城市"}
                </button>
              </>
            ) : (
              <div className="relative flex-1 min-w-[200px]">
                <form onSubmit={handleCitySearch} className="flex items-center gap-1 flex-wrap">
                  <input
                    className="flex-1 min-w-[120px] bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={citySearchKeyword}
                    onChange={(e) => setCitySearchKeyword(e.target.value)}
                    placeholder="搜索城市"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded-md bg-slate-800 text-slate-100 border border-slate-700 hover:border-emerald-500 hover:text-emerald-300 transition text-[11px] whitespace-nowrap"
                  >
                    {citySearching ? "..." : "搜索"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCitySearch(false);
                      setCitySearchKeyword("");
                      setCitySearchResults([]);
                    }}
                    className="px-2 py-1 rounded-md bg-slate-800 text-slate-100 border border-slate-700 hover:border-red-500 hover:text-red-300 transition text-[11px] whitespace-nowrap"
                  >
                    取消
                  </button>
                </form>
                {citySearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {citySearchResults.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-300 transition border-b border-slate-800 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{city.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            {city.level === "country" ? "国家" :
                             city.level === "province" ? "省" :
                             city.level === "city" ? "市" :
                             city.level === "district" ? "区县" : city.level}
                          </span>
                        </div>
                        {city.fullName && city.fullName !== city.name && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {city.fullName}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 日期选择器：自动换行，紧凑布局 */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
            <input
              type="date"
              className="bg-slate-900 border border-slate-700 rounded-md px-1 py-0.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-[105px]"
              value={meta.dates[0]}
              onChange={(e) =>
                setMeta({
                  dates: [e.target.value || meta.dates[0], meta.dates[1]],
                })
              }
            />
            <span className="text-slate-500">~</span>
            <input
              type="date"
              className="bg-slate-900 border border-slate-700 rounded-md px-1 py-0.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-[105px]"
              value={meta.dates[1]}
              onChange={(e) =>
                setMeta({
                  dates: [meta.dates[0], e.target.value || meta.dates[1]],
                })
              }
            />
          </div>
        </div>
        {activeDay && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              <span className="mr-1 font-medium text-slate-200">
                Day {activeDay.day_index}
              </span>
              <input
                type="date"
                className="bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={activeDay.date ?? ""}
                onChange={(e) =>
                  setDayDate(activeDay.day_index, e.target.value)
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (days.length === 0) return;
                  const currentDays = [...days];
                  addDay();
                  // 新增一天后，自动切换到新的一天
                  setTimeout(() => {
                    const newDays = useTripStore.getState().days;
                    if (newDays.length > currentDays.length) {
                      const lastDay = newDays[newDays.length - 1];
                      if (lastDay?.day_index) {
                        setActiveDayIndex(lastDay.day_index);
                      }
                    }
                  }, 10);
                }}
                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-100 border border-slate-700 hover:border-emerald-500 hover:text-emerald-300 transition"
              >
                + 新增一天
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!activeDay || days.length <= 1) return;
                  const currentIndex = activeDay.day_index;
                  const remainingDays = days.filter((d) => d.day_index !== currentIndex);
                  removeDay(currentIndex);
                  // 删除后，切换到剩余的第一天
                  if (remainingDays.length > 0 && remainingDays[0]?.day_index) {
                    setActiveDayIndex(remainingDays[0].day_index);
                  }
                }}
                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-red-300 border border-red-500/50 hover:bg-red-500/10 transition"
              >
                删除本日
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSavePlan}
              className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
            >
              保存本地
            </button>
            {user && (
              <button
                type="button"
                onClick={handleSaveToCloud}
                disabled={isSavingToCloud || !meta.city}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500 text-white hover:bg-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingToCloud ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Cloud size={10} />
                )}
                同步云端
              </button>
            )}
            {(saveMessage || cloudSaveMessage) && (
              <span className="text-[11px] text-emerald-400 animate-pulse">
                {saveMessage || cloudSaveMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>已有计划</span>
            <select
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={selectedPlanCity}
              onChange={(e) => {
                const cityName = e.target.value;
                if (cityName) {
                  handleLoadPlan(cityName);
                }
              }}
            >
              {savedCities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <DayTabs
        days={days}
        activeDayIndex={activeDayIndex}
        onChange={setActiveDayIndex}
      />

      <form
        className="px-3 pt-2 flex items-center gap-2 text-[11px]"
        onSubmit={handleSearchSubmit}
      >
        <input
          className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="搜索地点添加到当前日，例如：岳麓山 / 小吃街"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <button
          type="submit"
          className="px-2 py-1 rounded-md bg-slate-800 text-slate-100 border border-slate-700 hover:border-emerald-500 hover:text-emerald-300 transition"
        >
          {searching ? "搜索中..." : "搜索"}
        </button>
      </form>
      {pendingCityChange && (
        <div className="px-3 pt-2 pb-2 bg-amber-500/20 border border-amber-500/50 rounded-md mx-3">
          <p className="text-[11px] text-amber-200 mb-2">
            搜索结果位于其他城市，是否切换地图到 "{pendingCityChange.city}"？
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmCityChange}
              className="text-[11px] px-2 py-1 rounded-md bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
            >
              确认跳转
            </button>
            <button
              type="button"
              onClick={handleCancelCityChange}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-600 transition"
            >
              取消
            </button>
          </div>
        </div>
      )}
      {searchResults.length > 0 && (
        <div className="px-3 pt-1 pb-2 space-y-1 text-[11px] text-slate-200">
          {searchResults.map((item) => {
            const isHighlighted =
              highlightedLocation?.location.lat === item.location.lat &&
              highlightedLocation?.location.lng === item.location.lng;
            return (
              <div
                key={item.id}
                className={`w-full flex items-center justify-between rounded-md px-2 py-1 border transition ${
                  isHighlighted
                    ? "bg-emerald-500/20 border-emerald-500"
                    : "bg-slate-900/80 border-slate-800 hover:border-emerald-500 hover:bg-slate-900"
                }`}
              >
                <div
                  className="flex flex-col text-left flex-1 cursor-pointer"
                  onClick={() => handleHighlightLocation(item)}
                >
                  <span className="truncate">{item.name}</span>
                  {item.address && (
                    <span className="text-[10px] text-slate-400 truncate">
                      {item.address}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddFromSearch(item)}
                  className="text-emerald-400 text-[11px] ml-2 px-2 py-1 rounded-md bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 transition"
                >
                  添加
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scroll">
        {activeDay && activeDay.nodes && activeDay.nodes.length > 0 ? (
          <SortableContext
            items={activeDay.nodes.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {activeDay.nodes.map((node, index) => {
                const next = activeDay.nodes[index + 1];
                return (
                  <div key={node.id}>
                    <SortableNodeCard
                      node={node}
                      dayIndex={activeDay.day_index}
                    />
                    {next && <CommuteInfo from={node} to={next} />}
                  </div>
                );
              })}
            </div>
          </SortableContext>
        ) : (
          <p className="text-xs text-slate-500 px-1 py-4">
            当前日期还没有地点，可以上方搜索添加，或稍后支持更多方式。
          </p>
        )}
      </div>
    </div>
    </DndContext>
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




