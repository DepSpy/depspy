export const CONFIG_FILE = "dep-spy.config.mjs";
export { Config } from "@dep-spy/core";
export const defaultConfig = {
  depth: 3,
  size: false,
  entry: null,
  output: {
    graph: "ds.graph.json",
    staticGraph: "ds.static.json",
    circularDependency: "ds.circular.json",
    codependency: "ds.co.json",
  },
};
