import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./index.ts"],
  splitting: false,
  sourcemap: true,
  format: ["esm", "cjs"],
  clean: true,
  dts: true,
  outDir: "dist/tsup",
});
