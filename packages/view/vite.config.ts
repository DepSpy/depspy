import { defineConfig, loadEnv } from "vite";
import reactPlugin from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import path from "path";
import generate404 from "./plugins/generate404";
export default defineConfig(({ mode }) => {
  const { VITE_BUILD_MODE } = loadEnv(mode, path.join(process.cwd(), "env"));
  return {
    build: {
      outDir: VITE_BUILD_MODE == "online" ? "dist/online" : "dist/vite",
    },
    envDir: "./env",
    plugins: [reactPlugin(), UnoCSS(), generate404()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "~": path.resolve(__dirname, "types"),
      },
    },
  };
});
