import { PluginOption } from "vite";
import { generateGraphRes } from "../types/types";

export default function createGraphDataModule(
  data: generateGraphRes = {},
): PluginOption {
  const virtualModuleId = "virtual:graph-data";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  const graphData = JSON.stringify(data);

  return {
    name: "virtual:graph-data",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const graph = ${graphData}`;
      }
    },
  };
}
