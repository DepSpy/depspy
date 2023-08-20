import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import createGraphDataModule from "./plugins/pass-data";
import path from "path";

const isStatic = process.env.VITE_STATIC === "static";

export default defineConfig({
  build: {
    rollupOptions: {
      external: [isStatic ? null : "virtual:graph-data"],
    },
    outDir: isStatic ? "dist/static" : "dist/vite",
  },
  plugins: [reactPlugin(), isStatic ? createGraphDataModule() : null, UnoCSS()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "~": path.resolve(__dirname, "types"),
    },
  },
});
