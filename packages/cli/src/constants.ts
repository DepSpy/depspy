export const CONFIG_FILE = "dep-spy.config.mjs";
export { Config } from "@dep-spy/core";
const inBrowser = typeof window !== "undefined";
export const defaultConfig = {
  depth: Infinity,
  outDir: "dep-spy.json",
  online: inBrowser ? true : false,
};
