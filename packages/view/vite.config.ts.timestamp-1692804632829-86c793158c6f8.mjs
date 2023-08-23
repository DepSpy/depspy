// vite.config.ts
import { defineConfig, loadEnv } from "file:///D:/battlefield/depspy/node_modules/.pnpm/vite@4.4.9_@types+node@20.4.5_sass@1.65.1/node_modules/vite/dist/node/index.js";
import reactPlugin from "file:///D:/battlefield/depspy/node_modules/.pnpm/@vitejs+plugin-react@4.0.4_vite@4.4.9/node_modules/@vitejs/plugin-react/dist/index.mjs";
import UnoCSS from "file:///D:/battlefield/depspy/node_modules/.pnpm/unocss@0.55.2_postcss@8.4.28_vite@4.4.9/node_modules/unocss/dist/vite.mjs";
import path from "path";
var __vite_injected_original_dirname = "D:\\battlefield\\depspy\\packages\\view";
var vite_config_default = defineConfig(({ mode }) => {
  const { VITE_BUILD_MODE } = loadEnv(mode, path.join(process.cwd(), "env"));
  return {
    build: {
      outDir: VITE_BUILD_MODE == "online" ? "dist/online" : "dist/vite"
    },
    envDir: "./env",
    plugins: [reactPlugin(), UnoCSS()],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src"),
        "~": path.resolve(__vite_injected_original_dirname, "types")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxiYXR0bGVmaWVsZFxcXFxkZXBzcHlcXFxccGFja2FnZXNcXFxcdmlld1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcYmF0dGxlZmllbGRcXFxcZGVwc3B5XFxcXHBhY2thZ2VzXFxcXHZpZXdcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2JhdHRsZWZpZWxkL2RlcHNweS9wYWNrYWdlcy92aWV3L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0UGx1Z2luIGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgVW5vQ1NTIGZyb20gXCJ1bm9jc3Mvdml0ZVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IHsgVklURV9CVUlMRF9NT0RFIH0gPSBsb2FkRW52KG1vZGUsIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBcImVudlwiKSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG91dERpcjogVklURV9CVUlMRF9NT0RFID09IFwib25saW5lXCIgPyBcImRpc3Qvb25saW5lXCIgOiBcImRpc3Qvdml0ZVwiLFxyXG4gICAgfSxcclxuICAgIGVudkRpcjogXCIuL2VudlwiLFxyXG4gICAgcGx1Z2luczogW3JlYWN0UGx1Z2luKCksIFVub0NTUygpXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIiksXHJcbiAgICAgICAgXCJ+XCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwidHlwZXNcIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFTLFNBQVMsY0FBYyxlQUFlO0FBQzNVLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sWUFBWTtBQUNuQixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxFQUFFLGdCQUFnQixJQUFJLFFBQVEsTUFBTSxLQUFLLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQ3pFLFNBQU87QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNMLFFBQVEsbUJBQW1CLFdBQVcsZ0JBQWdCO0FBQUEsSUFDeEQ7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLFNBQVMsQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBQUEsSUFDakMsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLFFBQ2xDLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
