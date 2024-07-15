import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/pool/worker.ts"],
  splitting: false,
  sourcemap: true,
  format: ["esm", "cjs"],
  clean: true,
  dts: true,
});
