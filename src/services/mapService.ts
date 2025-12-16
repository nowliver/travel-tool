import type { GeoLocation } from "../types";
import {
  mockMapService,
  type MapSearchResult,
  type RouteResult,
} from "./mock/mockMapService";
import { formatPOI } from "./utils/formatPOI";
import type { AmapRegeoResponse } from "../types/amap";

const useMock =
  !import.meta.env.VITE_AMAP_KEY ||
  import.meta.env.VITE_USE_MOCK === "true";

const AMAP_WEB_KEY = import.meta.env.VITE_AMAP_KEY as string | undefined;

export interface SearchBounds {
  center: GeoLocation;
  radius: number; // in meters
}

export interface CitySearchResult {
  id: string;
  name: string;
  level: string; // 行政区级别：country, province, city, district, street
  adcode: string; // 行政区代码
  location: GeoLocation; // 中心点坐标
  fullName?: string; // 完整名称（包含上级行政区）
}

export interface AddressResult {
  name: string; // POI 名称或降级后的名称
  address?: string; // 短地址（已去除省市）或完整地址
}

// 导出类型以便 formatPOI 使用
export type { AmapRegeocode } from "../types/amap";

export interface MapServiceApi {
  search: (
    keyword: string,
    city?: string,
    bounds?: SearchBounds
  ) => Promise<MapSearchResult[]>;
  searchCity: (keyword: string) => Promise<CitySearchResult[]>;
  fetchAddressByLocation: (lng: number, lat: number) => Promise<AddressResult>;
  getRoute: (start: GeoLocation, end: GeoLocation) => Promise<RouteResult>;
}

const realMapService: MapServiceApi = {
  async search(
    keyword: string,
    city?: string,
    bounds?: SearchBounds
  ): Promise<MapSearchResult[]> {
    if (!AMAP_WEB_KEY) return mockMapService.search(keyword, city, bounds);

    const url = new URL("https://restapi.amap.com/v3/place/text");
    url.searchParams.set("key", AMAP_WEB_KEY);
    url.searchParams.set("keywords", keyword || "景点");
    // 如果提供了城市，限制搜索范围
    if (city) {
      url.searchParams.set("city", city);
    } else {
      url.searchParams.set("city", "");
    }
    // 如果提供了bounds，使用经纬度范围限制
    if (bounds) {
      // 计算边界框（简单实现：以center为中心，radius为半径的正方形）
      const latOffset = bounds.radius / 111000; // 大约1度=111km
      const lngOffset =
        bounds.radius / (111000 * Math.cos((bounds.center.lat * Math.PI) / 180));
      url.searchParams.set(
        "location",
        `${bounds.center.lng},${bounds.center.lat}`
      );
      url.searchParams.set("radius", String(bounds.radius));
    }
    url.searchParams.set("offset", "5");
    url.searchParams.set("page", "1");
    url.searchParams.set("output", "json");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("AMap place search failed", await res.text());
      return mockMapService.search(keyword, city, bounds);
    }

    const data = await res.json();
    if (!data.pois || !Array.isArray(data.pois)) {
      return mockMapService.search(keyword, city, bounds);
    }

    // 如果提供了bounds，进一步过滤结果（确保在范围内）
    let results = data.pois.map((poi: any, idx: number) => ({
      id: poi.id ?? `amap-${idx}`,
      name: poi.name,
      location: {
        lng: Number((poi.location || "").split(",")[0]) || 0,
        lat: Number((poi.location || "").split(",")[1]) || 0,
      },
      address: poi.address,
    }));

    // 如果提供了bounds，过滤掉超出范围的结果
    if (bounds) {
      results = results.filter((item: { location: { lng: number; lat: number } }) => {
        const distance = Math.sqrt(
          Math.pow(item.location.lng - bounds.center.lng, 2) +
            Math.pow(item.location.lat - bounds.center.lat, 2)
        );
        // 简单距离计算（实际应该用Haversine公式，但这里简化处理）
        const distanceMeters = distance * 111000;
        return distanceMeters <= bounds.radius;
      });
    }

    return results;
  },

  async searchCity(keyword: string): Promise<CitySearchResult[]> {
    if (!AMAP_WEB_KEY) {
      return mockMapService.searchCity(keyword);
    }

    const url = new URL("https://restapi.amap.com/v3/config/district");
    url.searchParams.set("key", AMAP_WEB_KEY);
    url.searchParams.set("keywords", keyword.trim());
    url.searchParams.set("subdistrict", "0"); // 不返回下级行政区
    url.searchParams.set("extensions", "base");
    url.searchParams.set("output", "json");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("AMap district search failed", await res.text());
      return mockMapService.searchCity(keyword);
    }

    const data = await res.json();
    if (!data.districts || !Array.isArray(data.districts)) {
      return mockMapService.searchCity(keyword);
    }

    // 过滤出县级及以上区域（level: country, province, city, district）
    // 排除街道级别（street）
    const validLevels = ["country", "province", "city", "district"];
    const results: CitySearchResult[] = [];

    const processDistrict = (district: any) => {
      if (validLevels.includes(district.level)) {
        const locationStr = district.center || district.location || "";
        const [lng, lat] = locationStr.split(",").map(Number);
        
        if (lng && lat) {
          results.push({
            id: district.adcode || district.id || `city-${results.length}`,
            name: district.name,
            level: district.level,
            adcode: district.adcode || "",
            location: { lng, lat },
            fullName: district.fullname || district.name,
          });
        }
      }

      // 递归处理子行政区
      if (district.districts && Array.isArray(district.districts)) {
        district.districts.forEach(processDistrict);
      }
    };

    data.districts.forEach(processDistrict);

    // 按级别排序：country > province > city > district
    const levelOrder: Record<string, number> = {
      country: 0,
      province: 1,
      city: 2,
      district: 3,
    };

    return results.sort((a, b) => {
      const orderA = levelOrder[a.level] ?? 999;
      const orderB = levelOrder[b.level] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, "zh-CN");
    });
  },

  async fetchAddressByLocation(lng: number, lat: number): Promise<AddressResult> {
    const key = AMAP_WEB_KEY;
    if (!key) {
      return mockMapService.fetchAddressByLocation(lng, lat);
    }

    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL("/amap/v3/geocode/regeo", base);
    url.searchParams.set("key", key);
    url.searchParams.set("location", `${lng},${lat}`);
    url.searchParams.set("extensions", "all"); // 使用 all 获取 POI 和 AOI 信息
    url.searchParams.set("radius", "1000"); // 搜索半径 1000 米
    url.searchParams.set("batch", "false");
    url.searchParams.set("roadlevel", "0");

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error("AMap regeo failed", await res.text());
        return mockMapService.fetchAddressByLocation(lng, lat);
      }

      const data: AmapRegeoResponse = await res.json();

      // 检查 API 响应状态
      if (data.status !== "1" || !data.regeocode) {
        console.warn("AMap regeo returned invalid status", data.info);
        return mockMapService.fetchAddressByLocation(lng, lat);
      }

      // 使用清洗函数格式化数据
      return formatPOI(data.regeocode, lng, lat);
    } catch (err) {
      console.error("Failed to fetch address", err);
      return mockMapService.fetchAddressByLocation(lng, lat);
    }
  },

  async getRoute(start: GeoLocation, end: GeoLocation): Promise<RouteResult> {
    if (!AMAP_WEB_KEY) return mockMapService.getRoute(start, end);

    const url = new URL("https://restapi.amap.com/v3/direction/driving");
    url.searchParams.set("key", AMAP_WEB_KEY);
    url.searchParams.set("origin", `${start.lng},${start.lat}`);
    url.searchParams.set("destination", `${end.lng},${end.lat}`);
    url.searchParams.set("extensions", "base");
    url.searchParams.set("strategy", "0");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("AMap route failed", await res.text());
      return mockMapService.getRoute(start, end);
    }

    const data = await res.json();
    const path =
      data.route?.paths?.[0]?.steps
        ?.flatMap((step: any) =>
          String(step.polyline || "")
            .split(";")
            .map((p: string) => p.split(","))
        )
        .filter((pair: string[]) => pair.length === 2)
        .map((pair: string[]) => ({
          lng: Number(pair[0]),
          lat: Number(pair[1]),
        })) ?? [];

    const distanceM = Number(data.route?.paths?.[0]?.distance ?? 0);
    const durationS = Number(data.route?.paths?.[0]?.duration ?? 0);

    const distanceKm = distanceM / 1000;
    const durationMin = Math.round(durationS / 60);

    return {
      path: path.length ? path : [start, end],
      distance_text: `${distanceKm.toFixed(1)} km`,
      duration_text: `${Math.max(durationMin, 1)} min`,
    };
  },
};

const mapService: MapServiceApi = useMock ? mockMapService : realMapService;

export { mapService };


