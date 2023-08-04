export const CONFIG_FILE = "dep-spy.config.mjs";
export { Config } from "@dep-spy/core";
const inBrowser = typeof window !== "undefined";
export const defaultConfig = {
  depth: 3,
  size: false,
  output: {
    graph: "ds.graph.json",
    circularDependency: "ds.circular.json",
    codependency: "ds.co.json",
  },
  online: inBrowser ? true : false,
};
