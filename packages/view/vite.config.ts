import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";
import createGraphDataModule from "./plugins/pass-data";

const isStatic = process.env.VITE_STATIC === "static";

export default defineConfig({
  build: {
    rollupOptions: {
      external: [isStatic ? null : "virtual:graph-data"],
    },
    outDir: isStatic ? "dist/static" : "dist/vite",
  },
  plugins: [reactPlugin(), isStatic ? createGraphDataModule() : null],
});
