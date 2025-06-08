export const CONFIG_FILE = "dep-spy.config.mjs";
export { Config } from "@dep-spy/core";
export const defaultConfig = {
  depth: 3,
  size: false,
  entry: "",
  command: "",
  output: {
    graph: "ds.graph.json",
    staticGraph: "ds.static.json",
    circularDependency: "ds.circular.json",
    codependency: "ds.co.json",
  },
};

export const enum MODE {
  ONLINE = "online",
  OFFLINE = "vite",
  INJECT = "inject",
}
