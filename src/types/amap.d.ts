/**
 * 高德地图 API 类型定义
 * 基于官方文档：https://lbs.amap.com/api/webservice/guide/api/georegeo
 */

export interface AmapRegeoResponse {
  status: string; // "1" 表示成功，"0" 表示失败
  info: string; // 状态信息
  infocode: string; // 状态码
  regeocode?: AmapRegeocode;
}

export interface AmapRegeocode {
  formatted_address: string; // 格式化地址，如"湖南省长沙市岳麓区登高路58号"
  addressComponent: AmapAddressComponent;
  pois?: AmapPOI[]; // 当 extensions=all 时返回 POI 数组
  aois?: AmapAOI[]; // 当 extensions=all 时返回 AOI 数组
}

export interface AmapAddressComponent {
  province: string; // 省份
  city: string; // 城市
  district: string; // 区县
  street?: string; // 街道
  streetNumber?: string; // 街道号
  building?: {
    name?: string; // 建筑物名称
  };
}

export interface AmapPOI {
  id: string;
  name: string; // POI 名称，如"万达广场"
  type: string; // POI 类型，如"购物服务;购物中心"
  address?: string; // POI 地址
  location: string; // 坐标字符串 "lng,lat"
  distance?: string; // 距离（米）
}

export interface AmapAOI {
  id: string;
  name: string; // AOI 名称（兴趣区域名称）
  type: string; // AOI 类型
  location: string; // 坐标字符串 "lng,lat"
  area?: string; // 面积（平方米）
}

