import { defineConfig, loadEnv } from "vite";
import reactPlugin from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import path from "path";
import generate404 from "./plugins/generate404";
import neutralization from "./plugins/neutralization";
import { vitePluginDepSpy } from "@dep-spy/core/vite-plugin-dep-spy";
import { modeOutDirMap } from "./constant";

//@ts-ignore
export default defineConfig(({ mode }) => {
  const { VITE_BUILD_MODE } = loadEnv(mode, path.join(process.cwd(), "env"));

  return {
    build: {
      outDir: modeOutDirMap[VITE_BUILD_MODE],
      rollupOptions: {
        output: {
          manualChunks: {
            g6: ["@antv/g6"],
          },
        },
      },
      sourcemap: true,
    },
    envDir: "./env",
    plugins: [
      vitePluginDepSpy({
        commitHash: "a84090ced964200d4cde7c1407702486e0f3878c",
      }),
      reactPlugin(),
      UnoCSS(),
      generate404(),
      neutralization([
        "@swc/core",
        "tsconfig-paths",
        "@babel/traverse",
        "swc-to-babel",
        "worker_threads",
        "os",
        "events",
        "fs",
        "path",
      ]),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "~": path.resolve(__dirname, "types"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:2023",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
