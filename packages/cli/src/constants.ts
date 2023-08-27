export const CONFIG_FILE = "dep-spy.config.mjs";
export { Config } from "@dep-spy/core";
export const defaultConfig = {
  depth: 3,
  size: false,
  output: {
    graph: "ds.graph.json",
    circularDependency: "ds.circular.json",
    codependency: "ds.co.json",
  },
};
