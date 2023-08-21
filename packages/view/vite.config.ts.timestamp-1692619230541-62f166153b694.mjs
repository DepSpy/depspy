// vite.config.ts
import { defineConfig } from "file:///D:/battlefield/depspy/node_modules/.pnpm/vite@4.4.9_@types+node@20.4.5_sass@1.65.1/node_modules/vite/dist/node/index.js";
import reactPlugin from "file:///D:/battlefield/depspy/node_modules/.pnpm/@vitejs+plugin-react@4.0.4_vite@4.4.9/node_modules/@vitejs/plugin-react/dist/index.mjs";
import UnoCSS from "file:///D:/battlefield/depspy/node_modules/.pnpm/unocss@0.55.2_postcss@8.4.28_vite@4.4.9/node_modules/unocss/dist/vite.mjs";

// plugins/pass-data.ts
function createGraphDataModule(data = {}) {
  const virtualModuleId = "virtual:graph-data";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  const graphData = JSON.stringify(data);
  return {
    name: "virtual:graph-data",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const graph = ${graphData}`;
      }
    }
  };
}

// vite.config.ts
import path from "path";
var __vite_injected_original_dirname = "D:\\battlefield\\depspy\\packages\\view";
var isStatic = process.env.VITE_STATIC === "static";
var vite_config_default = defineConfig({
  build: {
    rollupOptions: {
      external: [isStatic ? null : "virtual:graph-data"]
    },
    outDir: isStatic ? "dist/static" : "dist/vite"
  },
  plugins: [reactPlugin(), isStatic ? createGraphDataModule() : null, UnoCSS()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "~": path.resolve(__vite_injected_original_dirname, "types")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGx1Z2lucy9wYXNzLWRhdGEudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxiYXR0bGVmaWVsZFxcXFxkZXBzcHlcXFxccGFja2FnZXNcXFxcdmlld1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcYmF0dGxlZmllbGRcXFxcZGVwc3B5XFxcXHBhY2thZ2VzXFxcXHZpZXdcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2JhdHRsZWZpZWxkL2RlcHNweS9wYWNrYWdlcy92aWV3L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0UGx1Z2luIGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgVW5vQ1NTIGZyb20gXCJ1bm9jc3Mvdml0ZVwiO1xyXG5pbXBvcnQgY3JlYXRlR3JhcGhEYXRhTW9kdWxlIGZyb20gXCIuL3BsdWdpbnMvcGFzcy1kYXRhXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcblxyXG5jb25zdCBpc1N0YXRpYyA9IHByb2Nlc3MuZW52LlZJVEVfU1RBVElDID09PSBcInN0YXRpY1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBleHRlcm5hbDogW2lzU3RhdGljID8gbnVsbCA6IFwidmlydHVhbDpncmFwaC1kYXRhXCJdLFxyXG4gICAgfSxcclxuICAgIG91dERpcjogaXNTdGF0aWMgPyBcImRpc3Qvc3RhdGljXCIgOiBcImRpc3Qvdml0ZVwiLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW3JlYWN0UGx1Z2luKCksIGlzU3RhdGljID8gY3JlYXRlR3JhcGhEYXRhTW9kdWxlKCkgOiBudWxsLCBVbm9DU1MoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpLFxyXG4gICAgICBcIn5cIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJ0eXBlc1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSk7XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcYmF0dGxlZmllbGRcXFxcZGVwc3B5XFxcXHBhY2thZ2VzXFxcXHZpZXdcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcYmF0dGxlZmllbGRcXFxcZGVwc3B5XFxcXHBhY2thZ2VzXFxcXHZpZXdcXFxccGx1Z2luc1xcXFxwYXNzLWRhdGEudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2JhdHRsZWZpZWxkL2RlcHNweS9wYWNrYWdlcy92aWV3L3BsdWdpbnMvcGFzcy1kYXRhLnRzXCI7aW1wb3J0IHsgUGx1Z2luT3B0aW9uIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHsgZ2VuZXJhdGVHcmFwaFJlcyB9IGZyb20gXCIuLi90eXBlcy90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlR3JhcGhEYXRhTW9kdWxlKFxyXG4gIGRhdGE6IGdlbmVyYXRlR3JhcGhSZXMgPSB7fSxcclxuKTogUGx1Z2luT3B0aW9uIHtcclxuICBjb25zdCB2aXJ0dWFsTW9kdWxlSWQgPSBcInZpcnR1YWw6Z3JhcGgtZGF0YVwiO1xyXG4gIGNvbnN0IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkID0gXCJcXDBcIiArIHZpcnR1YWxNb2R1bGVJZDtcclxuICBjb25zdCBncmFwaERhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6IFwidmlydHVhbDpncmFwaC1kYXRhXCIsXHJcbiAgICByZXNvbHZlSWQoaWQpIHtcclxuICAgICAgaWYgKGlkID09PSB2aXJ0dWFsTW9kdWxlSWQpIHtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQ7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsb2FkKGlkKSB7XHJcbiAgICAgIGlmIChpZCA9PT0gcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQpIHtcclxuICAgICAgICByZXR1cm4gYGV4cG9ydCBjb25zdCBncmFwaCA9ICR7Z3JhcGhEYXRhfWA7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFTLFNBQVMsb0JBQW9CO0FBQ2xVLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sWUFBWTs7O0FDQ0osU0FBUixzQkFDTCxPQUF5QixDQUFDLEdBQ1o7QUFDZCxRQUFNLGtCQUFrQjtBQUN4QixRQUFNLDBCQUEwQixPQUFPO0FBQ3ZDLFFBQU0sWUFBWSxLQUFLLFVBQVUsSUFBSTtBQUVyQyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixVQUFVLElBQUk7QUFDWixVQUFJLE9BQU8saUJBQWlCO0FBQzFCLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUFBLElBQ0EsS0FBSyxJQUFJO0FBQ1AsVUFBSSxPQUFPLHlCQUF5QjtBQUNsQyxlQUFPLHdCQUF3QixTQUFTO0FBQUEsTUFDMUM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOzs7QURuQkEsT0FBTyxVQUFVO0FBSmpCLElBQU0sbUNBQW1DO0FBTXpDLElBQU0sV0FBVyxRQUFRLElBQUksZ0JBQWdCO0FBRTdDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxXQUFXLE9BQU8sb0JBQW9CO0FBQUEsSUFDbkQ7QUFBQSxJQUNBLFFBQVEsV0FBVyxnQkFBZ0I7QUFBQSxFQUNyQztBQUFBLEVBQ0EsU0FBUyxDQUFDLFlBQVksR0FBRyxXQUFXLHNCQUFzQixJQUFJLE1BQU0sT0FBTyxDQUFDO0FBQUEsRUFDNUUsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQ2xDLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
