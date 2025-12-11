import type { GeoLocation } from "../../types";
import type { SearchBounds, CitySearchResult } from "../mapService";

export interface MapSearchResult {
  id: string;
  name: string;
  location: GeoLocation;
  address?: string;
}

export interface RouteResult {
  path: GeoLocation[];
  distance_text: string;
  duration_text: string;
}

const changshaCenter: GeoLocation = {
  lat: 28.228209,
  lng: 112.938814,
};

function jitter(base: GeoLocation, dx: number, dy: number): GeoLocation {
  return {
    lat: base.lat + dy,
    lng: base.lng + dx,
  };
}

export const mockMapService = {
  async search(
    keyword: string,
    city?: string,
    bounds?: SearchBounds
  ): Promise<MapSearchResult[]> {
    const key = keyword.trim() || city || "长沙";
    // 如果提供了bounds，使用bounds的中心点；否则使用默认的长沙中心
    const base = bounds?.center || changshaCenter;

    return [
      {
        id: "mock-1",
        name: `${key}·岳麓山风景区`,
        location: jitter(base, -0.01, -0.03),
        address: "岳麓区登高路58号",
      },
      {
        id: "mock-2",
        name: `${key}·橘子洲头`,
        location: jitter(base, 0.0, -0.02),
        address: "岳麓区橘子洲景区",
      },
      {
        id: "mock-3",
        name: `${key}·太平街历史文化街区`,
        location: jitter(base, 0.01, 0.0),
        address: "天心区太平街",
      },
      {
        id: "mock-4",
        name: `${key}·坡子街美食街`,
        location: jitter(base, 0.02, 0.01),
        address: "天心区坡子街",
      },
      {
        id: "mock-5",
        name: `${key}·IFS 国金中心`,
        location: jitter(base, 0.015, -0.005),
        address: "芙蓉区黄兴中路188号",
      },
    ];
  },

  async getRoute(start: GeoLocation, end: GeoLocation): Promise<RouteResult> {
    // very rough straight-line mock with a slight curve
    const mid: GeoLocation = {
      lat: (start.lat + end.lat) / 2 + 0.005,
      lng: (start.lng + end.lng) / 2,
    };

    const distanceKm =
      Math.sqrt(
        (start.lat - end.lat) ** 2 + (start.lng - end.lng) ** 2
      ) * 100;
    const durationMin = Math.max(5, Math.round(distanceKm * 3));

    return {
      path: [start, mid, end],
      distance_text: `${distanceKm.toFixed(1)} km`,
      duration_text: `${durationMin} min`,
    };
  },

  async searchCity(keyword: string): Promise<CitySearchResult[]> {
    const key = keyword.trim().toLowerCase();
    const mockCities: CitySearchResult[] = [
      {
        id: "430100",
        name: "长沙市",
        level: "city",
        adcode: "430100",
        location: { lat: 28.228209, lng: 112.938814 },
        fullName: "湖南省长沙市",
      },
      {
        id: "110000",
        name: "北京市",
        level: "city",
        adcode: "110000",
        location: { lat: 39.9042, lng: 116.4074 },
        fullName: "北京市",
      },
      {
        id: "310000",
        name: "上海市",
        level: "city",
        adcode: "310000",
        location: { lat: 31.2304, lng: 121.4737 },
        fullName: "上海市",
      },
      {
        id: "440100",
        name: "广州市",
        level: "city",
        adcode: "440100",
        location: { lat: 23.1291, lng: 113.2644 },
        fullName: "广东省广州市",
      },
      {
        id: "440300",
        name: "深圳市",
        level: "city",
        adcode: "440300",
        location: { lat: 22.5431, lng: 114.0579 },
        fullName: "广东省深圳市",
      },
      {
        id: "330100",
        name: "杭州市",
        level: "city",
        adcode: "330100",
        location: { lat: 30.2741, lng: 120.1551 },
        fullName: "浙江省杭州市",
      },
      {
        id: "320100",
        name: "南京市",
        level: "city",
        adcode: "320100",
        location: { lat: 32.0603, lng: 118.7969 },
        fullName: "江苏省南京市",
      },
      {
        id: "510100",
        name: "成都市",
        level: "city",
        adcode: "510100",
        location: { lat: 30.6624, lng: 104.0633 },
        fullName: "四川省成都市",
      },
    ];

    // 简单的关键词匹配
    if (!key) return mockCities.slice(0, 5);

    return mockCities.filter(
      (city) =>
        city.name.includes(keyword) ||
        city.fullName?.includes(keyword) ||
        city.name.toLowerCase().includes(key)
    );
  },

  async fetchAddressByLocation(lng: number, lat: number): Promise<{ name: string; address?: string }> {
    // Mock 数据：模拟 POI 名称和地址
    // 根据坐标范围返回不同的 Mock POI
    const mockPOIs = [
      { name: "万达广场", address: "岳麓区银盆南路" },
      { name: "IFS 国金中心", address: "芙蓉区黄兴中路188号" },
      { name: "岳麓山风景区", address: "岳麓区登高路58号" },
      { name: "橘子洲头", address: "岳麓区橘子洲景区" },
      { name: "坡子街美食街", address: "天心区坡子街" },
    ];

    // 基于坐标哈希选择一个 Mock POI（保持一致性）
    const index = Math.abs(Math.round(lng * lat * 1000)) % mockPOIs.length;
    const mockPOI = mockPOIs[index];

    return {
      name: mockPOI.name,
      address: mockPOI.address,
    };
  },
};


