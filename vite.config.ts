import { defineConfig } from "vite";

// 使用动态 import 以兼容 Vite 在 CJS 环境下加载 ESM 插件的方式
export default defineConfig(async () => {
  const { default: react } = await import("@vitejs/plugin-react-swc");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      proxy: {
        // Proxy to AMap Web Service to avoid CORS in dev
        "/amap": {
          target: "https://restapi.amap.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/amap/, ""),
        },
      },
    },
  };
});



