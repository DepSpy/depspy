import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/threadsPool/worker.ts",
    "src/static/adapter/vitePluginDepSpy.ts",
    "src/static/adapter/webpackPluginDepSpy.ts",
    "src/static/adapter/rspackPluginDepSpy.ts",
    "src/threadsPool/getTreeShakingDetailThread.ts",
  ],
  publicDir: "public",
  external: ["vite", "rollup"],
  splitting: false,
  sourcemap: true,
  format: ["esm", "cjs"],
  clean: true,
  dts: true,
});
