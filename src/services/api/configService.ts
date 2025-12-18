/**
 * Configuration Service
 * 从后端 API 获取公开配置，统一管理环境变量
 */

import { apiClient } from "./apiClient";

export interface PublicConfig {
  amap_key_web_js: string | null;
  app_name: string;
  app_version: string;
}

// 缓存配置，避免重复请求
let cachedConfig: PublicConfig | null = null;
let configPromise: Promise<PublicConfig> | null = null;

/**
 * 从后端获取公开配置
 * 使用单例模式缓存配置，避免重复请求
 */
export async function fetchConfig(): Promise<PublicConfig> {
  // 如果已有缓存，直接返回
  if (cachedConfig) {
    return cachedConfig;
  }

  // 如果正在请求中，等待现有请求
  if (configPromise) {
    return configPromise;
  }

  // 发起新请求
  configPromise = apiClient
    .get<PublicConfig>("/api/config")
    .then((config) => {
      cachedConfig = config;
      return config;
    })
    .catch((error) => {
      console.warn("Failed to fetch config from backend:", error);
      // 返回默认配置
      return {
        amap_key_web_js: null,
        app_name: "LiteTravel",
        app_version: "2.1.0",
      };
    })
    .finally(() => {
      configPromise = null;
    });

  return configPromise;
}

/**
 * 获取高德地图 JS API Key
 * 优先从后端配置获取，fallback 到环境变量（兼容旧配置）
 */
export async function getAmapKeyWebJs(): Promise<string | null> {
  // 优先使用后端配置
  try {
    const config = await fetchConfig();
    if (config.amap_key_web_js) {
      return config.amap_key_web_js;
    }
  } catch {
    // 忽略错误，使用 fallback
  }

  // Fallback: 本地环境变量（兼容旧配置）
  return (import.meta.env.VITE_AMAP_KEY_WEB_JS as string) || null;
}

/**
 * 同步获取配置（需要先调用 fetchConfig）
 */
export function getCachedConfig(): PublicConfig | null {
  return cachedConfig;
}

/**
 * 清除配置缓存（用于测试或重新加载）
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  configPromise = null;
}

export const configService = {
  fetchConfig,
  getAmapKeyWebJs,
  getCachedConfig,
  clearConfigCache,
};
