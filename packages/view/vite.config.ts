import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist/vite",
  },
  plugins: [reactPlugin(), UnoCSS()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "~": path.resolve(__dirname, "types"),
    },
  },
});
