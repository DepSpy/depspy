import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  splitting: false,
  sourcemap: true,
  format: "cjs",
  clean: true,
  dts: true,
});
