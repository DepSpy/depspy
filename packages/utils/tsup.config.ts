import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  format: ["esm", "cjs"],
  minify: true,
  sourcemap: true,
  clean: true,
  dts: true,
});
