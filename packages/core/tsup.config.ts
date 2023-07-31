import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  format: ["esm", "cjs"],
  minify: true,
  clean: true,
  dts: true,
});
