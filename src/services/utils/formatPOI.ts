/**
 * POI 数据清洗与格式化工具
 * 实现降级策略：POI → AOI → Building → formatted_address
 */

import type { AddressResult } from "../mapService";
import type { AmapRegeocode } from "../../types/amap";

/**
 * 从 formatted_address 中移除省和市名称
 * @param address 完整地址字符串
 * @param province 省份名称
 * @param city 城市名称
 * @returns 处理后的地址
 */
function removeProvinceAndCity(
  address: string,
  province?: string,
  city?: string
): string {
  let result = address;

  // 移除省份
  if (province && result.startsWith(province)) {
    result = result.slice(province.length).trim();
  }

  // 移除城市（可能紧跟在省份后，或独立存在）
  if (city) {
    if (result.startsWith(city)) {
      result = result.slice(city.length).trim();
    } else if (result.includes(`${city}市`)) {
      result = result.replace(`${city}市`, "").trim();
    }
  }

  return result;
}

/**
 * 清洗并格式化逆地理编码数据
 * @param regeocode API 返回的 regeocode 对象
 * @param lng 经度（用于 fallback）
 * @param lat 纬度（用于 fallback）
 * @returns 格式化后的 POI 名称和地址
 */
export function formatPOI(
  regeocode: AmapRegeocode,
  lng: number,
  lat: number
): AddressResult {
  const { pois, aois, addressComponent, formatted_address } = regeocode;
  const province = addressComponent?.province;
  const city = addressComponent?.city;

  // Step 1: 尝试从 POI 获取名称
  if (pois && pois.length > 0 && pois[0].name) {
    const poi = pois[0];
    // POI 地址优先使用 POI 的 address，否则使用 formatted_address（去除省市）
    const address = poi.address
      ? poi.address
      : formatted_address
      ? removeProvinceAndCity(formatted_address, province, city)
      : undefined;

    return {
      name: poi.name,
      address,
    };
  }

  // Step 2: 尝试从 AOI 获取名称
  if (aois && aois.length > 0 && aois[0].name) {
    const aoi = aois[0];
    const address = formatted_address
      ? removeProvinceAndCity(formatted_address, province, city)
      : undefined;

    return {
      name: aoi.name,
      address,
    };
  }

  // Step 3: 尝试从建筑物名称获取
  if (addressComponent?.building?.name) {
    const buildingName = addressComponent.building.name;
    const address = formatted_address
      ? removeProvinceAndCity(formatted_address, province, city)
      : undefined;

    return {
      name: buildingName,
      address,
    };
  }

  // Step 4: Fallback - 使用格式化地址（去除省市）或坐标
  if (formatted_address) {
    const shortAddress = removeProvinceAndCity(
      formatted_address,
      province,
      city
    );
    return {
      name: shortAddress || `位置 (${lng.toFixed(5)}, ${lat.toFixed(5)})`,
      address: formatted_address, // 保留完整地址作为 address
    };
  }

  // 最终降级：使用坐标
  return {
    name: `位置 (${lng.toFixed(5)}, ${lat.toFixed(5)})`,
  };
}

