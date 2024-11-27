import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/threadsPool/worker.ts"],
  splitting: false,
  sourcemap: true,
  format: ["esm", "cjs"],
  clean: true,
  dts: true,
});
