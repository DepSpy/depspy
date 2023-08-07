import { defineConfig } from "../src/index.ts";

export default defineConfig({
  depth: 100,
  size: true,
  output: {
    graph: "graph.json",
    circularDependency: "circular.json",
    codependency: "co.json",
  },
  online: false,
});
