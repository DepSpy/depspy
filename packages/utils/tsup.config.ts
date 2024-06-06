import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/workers/moduleInfoWorker.ts"],
  splitting: false,
  format: ["esm", "cjs"],
  sourcemap: true,
  clean: true,
  dts: true,
});
