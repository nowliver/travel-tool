import { useEffect, useRef, useState } from "react";
import { Star, Calendar } from "lucide-react";
import { useTripStore } from "../../store/tripStore";
import { mapService } from "../../services/mapService";
import { ContextMenu, useContextMenu, type ContextMenuItem } from "../ui/ContextMenu";
import { LocationDetailBar } from "./LocationDetailBar";
import type { GeoLocation, PlanNode } from "../../types";

declare global {
  interface Window {
    // 这里直接使用 any，避免强依赖额外的类型包；如果后续需要更严格类型再单独引入
    AMap: any;
  }
}

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const highlightMarkerRef = useRef<any>(null);

  // Get days from store; avoid creating new arrays in selector to prevent
  // React / useSyncExternalStore infinite update warnings.
  const days = useTripStore((state) => state.days);
  const confirmedCity = useTripStore((state) => state.confirmedCity);
  const center = useTripStore((state) => state.meta.center);
  const setMeta = useTripStore((state) => state.setMeta);
  const highlightedLocation = useTripStore((state) => state.highlightedLocation);
  const isResizingSidebar = useTripStore((state) => state.isResizingSidebar);
  const addFavorite = useTripStore((state) => state.addFavorite);
  const addNode = useTripStore((state) => state.addNode);
  const setHighlightedLocation = useTripStore((state) => state.setHighlightedLocation);

  // 右键菜单状态
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const [clickedLocation, setClickedLocation] = useState<{
    location: GeoLocation;
    name: string;
    address?: string;
  } | null>(null);

  // POI 详情栏状态
  const [selectedPOI, setSelectedPOI] = useState<{
    name: string;
    location: GeoLocation;
    address?: string;
    type?: "spot" | "hotel" | "dining";
  } | null>(null);
  const [isDetailBarOpen, setIsDetailBarOpen] = useState(false);

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_KEY;
    if (!key) {
      setError("未配置高德地图 Key，目前使用 Demo 占位地图。");
      return;
    }

    let map: any;
    const loadMap = async () => {
      try {
        const AMapLoader = await import("@amap/amap-jsapi-loader");
        await AMapLoader.load({
          key,
          version: "2.0",
        });

        if (containerRef.current && window.AMap) {
          const defaultCenter: [number, number] = [112.938814, 28.228209];
          const initialCenter: [number, number] = center
            ? [center.lng, center.lat]
            : defaultCenter;

          map = new window.AMap.Map(containerRef.current, {
            zoom: 12,
            center: initialCenter,
          });

          // Prepare geocoder for city-to-center lookup
          window.AMap.plugin("AMap.Geocoder", () => {
            geocoderRef.current = new window.AMap.Geocoder();
          });

          // 添加右键点击事件
          map.on("rightclick", async (e: any) => {
            const lnglat = e.lnglat;
            if (!lnglat) return;

            const location: GeoLocation = { lng: lnglat.lng, lat: lnglat.lat };

            // 获取地址信息
            let name = `位置 (${lnglat.lng.toFixed(5)}, ${lnglat.lat.toFixed(5)})`;
            let address: string | undefined;

            try {
              const result = await mapService.fetchAddressByLocation(lnglat.lng, lnglat.lat);
              if (result.name) {
                name = result.name;
              }
              address = result.address;
            } catch (err) {
              console.warn("Failed to fetch address", err);
            }

            setClickedLocation({ location, name, address });

            // 修复坐标偏移：e.pixel 是相对于地图容器的坐标，需要转换为视口坐标
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              const clientX = containerRect.left + e.pixel.x;
              const clientY = containerRect.top + e.pixel.y;
              
              // 打开右键菜单（使用正确的视口坐标）
              openContextMenu(
                { clientX, clientY, preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent,
                { location, name, address }
              );
            }
          });

          // 添加地图点击事件：用于清除高亮标记和关闭右键菜单
          map.on("click", async (e: any) => {
            // 检查点击的是否是 Marker（通过事件目标判断）
            const target = e.originalEvent?.target;
            const isMarkerClick = target && (
              target.classList?.contains('amap-marker') || 
              target.closest('.amap-marker') ||
              // 检查是否是 Marker 的内容区域
              target.closest('[class*="amap-marker"]')
            );

            // 如果点击了 Marker：触发 POI 详情栏
            if (isMarkerClick) {
              const lnglat = e.lnglat;
              if (lnglat) {
                const location: GeoLocation = { lng: lnglat.lng, lat: lnglat.lat };
                
                // 异步获取 POI 信息
                let name = `位置 (${lnglat.lng.toFixed(5)}, ${lnglat.lat.toFixed(5)})`;
                let address: string | undefined;

                try {
                  const result = await mapService.fetchAddressByLocation(lnglat.lng, lnglat.lat);
                  if (result.name) {
                    name = result.name;
                  }
                  address = result.address;
                } catch (err) {
                  console.warn("Failed to fetch POI address", err);
                }

                setSelectedPOI({
                  name,
                  location,
                  address,
                  type: "spot", // 默认类型，后续可以从 Marker 数据中获取
                });
                setIsDetailBarOpen(true);
              }
              return;
            }

            // 点击地图空白区域：清除高亮标记、右键菜单和详情栏
            setHighlightedLocation(null);
            closeContextMenu();
            setClickedLocation(null);
            setSelectedPOI(null);
            setIsDetailBarOpen(false);
          });

          mapRef.current = map;
          setLoaded(true);
        }
      } catch (e) {
        console.error(e);
        setError("加载高德地图失败，将保持占位模式。");
      }
    };

    loadMap();

    return () => {
      if (map && map.destroy) {
        map.destroy();
      }
    };
  }, []);

  // Recenter map when confirmed city changes (only confirmed city triggers map jump)
  useEffect(() => {
    if (!mapRef.current || !window.AMap || !confirmedCity || !loaded) return;

    const map = mapRef.current;

    // 如果已经有center，直接使用；否则通过geocoder获取
    if (center && center.lat && center.lng) {
      const lnglat: [number, number] = [center.lng, center.lat];
      map.setCenter(lnglat);
      map.setZoom(12);
      return;
    }

    // 如果没有center，通过geocoder获取城市坐标
    const ensureGeocoder = () =>
      new Promise<any>((resolve) => {
        if (geocoderRef.current) {
          resolve(geocoderRef.current);
          return;
        }
        window.AMap.plugin("AMap.Geocoder", () => {
          geocoderRef.current = new window.AMap.Geocoder();
          resolve(geocoderRef.current);
        });
      });

    ensureGeocoder().then((geocoder) => {
      geocoder.getLocation(confirmedCity, (status: string, result: any) => {
        if (status === "complete" && result.geocodes?.length) {
          const loc = result.geocodes[0].location;
          if (loc) {
            const lnglat: [number, number] = [loc.lng, loc.lat];
            map.setCenter(lnglat);
            map.setZoom(12);
            setMeta({ center: { lng: loc.lng, lat: loc.lat } });
          }
        } else {
          console.warn(`Failed to geocode city: ${confirmedCity}`, status);
        }
      });
    });
  }, [confirmedCity, center, setMeta, loaded]);

  // Update markers and polyline when nodes change
  useEffect(() => {
    if (!mapRef.current || !window.AMap) return;

    const allNodes = days.flatMap((day) => day.nodes);
    if (allNodes.length === 0) return;

    const map = mapRef.current;
    const { Marker, Polyline } = window.AMap;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const dayColors = ["#22c55e", "#f97316", "#3b82f6", "#e11d48"];

    // Add new markers, with different colors per day
    days.forEach((day) => {
      const color =
        dayColors[(day.day_index - 1) % dayColors.length] ?? "#22c55e";
      day.nodes.forEach((node) => {
        const marker = new Marker({
          position: [node.location.lng, node.location.lat],
          title: node.name,
          map,
          content: `<div style="transform: translate(-50%, -100%);">
              <div style="width:14px;height:14px;border-radius:999px;background:${color};
                box-shadow:0 0 0 2px rgba(15,23,42,0.9);border:2px solid white;">
              </div>
            </div>`,
        });
        markersRef.current[node.id] = marker;
      });
    });

    // Update polyline (按当前所有节点顺序连线)
    if (polylineRef.current) {
      polylineRef.current.remove();
    }

    if (allNodes.length > 1) {
      const path = allNodes.map((node) => [
        node.location.lng,
        node.location.lat,
      ]);
      polylineRef.current = new Polyline({
        path,
        strokeColor: "#36CFC9",
        strokeWeight: 4,
        strokeStyle: "solid",
        map,
      });

      // Adjust map view to show all markers
      map.setFitView();
    }
  }, [days]);

  // Update highlight marker when highlightedLocation changes
  useEffect(() => {
    if (!mapRef.current || !window.AMap) return;

    const map = mapRef.current;
    const { Marker } = window.AMap;

    // Clear existing highlight marker
    if (highlightMarkerRef.current) {
      highlightMarkerRef.current.remove();
      highlightMarkerRef.current = null;
    }

    // Add new highlight marker if location is provided
    if (highlightedLocation) {
      const marker = new Marker({
        position: [
          highlightedLocation.location.lng,
          highlightedLocation.location.lat,
        ],
        title: highlightedLocation.name,
        map,
        content: `<div style="transform: translate(-50%, -100%);">
            <div style="width:20px;height:20px;border-radius:999px;background:#fbbf24;
              box-shadow:0 0 0 3px rgba(15,23,42,0.9), 0 0 0 6px rgba(251,191,36,0.5);border:3px solid white;
              animation: pulse 2s infinite;">
            </div>
            <div style="margin-top:4px;padding:4px 8px;background:rgba(15,23,42,0.95);border-radius:4px;
              white-space:nowrap;font-size:12px;color:white;border:1px solid #fbbf24;">
              ${highlightedLocation.name}
            </div>
          </div>`,
        zIndex: 1000, // Higher z-index to show above other markers
      });
      highlightMarkerRef.current = marker;

      // Center map on highlighted location
      map.setCenter([
        highlightedLocation.location.lng,
        highlightedLocation.location.lat,
      ]);
      map.setZoom(15);
    }
  }, [highlightedLocation]);

  // 构建右键菜单项
  const buildContextMenuItems = (): ContextMenuItem[] => {
    if (!clickedLocation) return [];

    const handleAddToFavorites = () => {
      addFavorite({
        name: clickedLocation.name,
        location: clickedLocation.location,
        type: "spot",
        address: clickedLocation.address,
      });
    };

    const handleAddToPlan = (dayIndex: number) => {
      // 生成唯一 ID（UUID 风格）
      const nodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newNode: PlanNode = {
        id: nodeId,
        name: clickedLocation.name,
        location: clickedLocation.location,
        type: "spot",
      };
      addNode(dayIndex, newNode);
    };

    // 动态生成子菜单（选择添加到哪一天）
    const daySubMenuItems: ContextMenuItem[] = days.map((day) => ({
      id: `add-to-day-${day.day_index}`,
      label: `Day ${day.day_index}${day.date ? ` (${day.date})` : ""}`,
      onClick: () => handleAddToPlan(day.day_index),
    }));

    return [
      {
        id: "add-to-favorites",
        label: "加入收藏",
        icon: <Star className="w-4 h-4" />,
        onClick: handleAddToFavorites,
      },
      {
        id: "add-to-plan",
        label: "加入计划",
        icon: <Calendar className="w-4 h-4" />,
        children: daySubMenuItems.length > 0 ? daySubMenuItems : [
          {
            id: "no-days",
            label: "暂无行程日",
            disabled: true,
          },
        ],
      },
    ];
  };

  // POI 详情栏操作
  const handleAddToFavorites = () => {
    if (!selectedPOI) return;
    addFavorite({
      name: selectedPOI.name,
      location: selectedPOI.location,
      type: selectedPOI.type || "spot",
      address: selectedPOI.address,
    });
    setIsDetailBarOpen(false);
    setSelectedPOI(null);
  };

  const handleAddToPlan = (dayIndex: number) => {
    if (!selectedPOI) return;
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newNode: PlanNode = {
      id: nodeId,
      name: selectedPOI.name,
      location: selectedPOI.location,
      type: selectedPOI.type || "spot",
    };
    addNode(dayIndex, newNode);
    setIsDetailBarOpen(false);
    setSelectedPOI(null);
  };

  return (
    <div
      className={`h-full w-full relative ${
        isResizingSidebar ? "pointer-events-none select-none" : ""
      }`}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pointer-events-none">
          {error ?? "正在加载地图..."}
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />

      {/* 地图右键菜单 */}
      {contextMenu && clickedLocation && (
        <ContextMenu
          items={buildContextMenuItems()}
          position={contextMenu.position}
          onClose={() => {
            closeContextMenu();
            setClickedLocation(null);
          }}
        />
      )}

      {/* POI 详情栏 */}
      <LocationDetailBar
        poi={selectedPOI}
        isOpen={isDetailBarOpen}
        onClose={() => {
          setIsDetailBarOpen(false);
          setSelectedPOI(null);
        }}
        onAddToFavorites={handleAddToFavorites}
        onAddToPlan={handleAddToPlan}
        days={days}
      />
    </div>
  );
}