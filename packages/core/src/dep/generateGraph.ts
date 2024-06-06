import { defaultConfig } from "../constant";
import { Config } from "../type";
import { Graph } from "./graph";
import { getModuleInfo, Pool } from "@dep-spy/utils";
const pool = new Pool(9, "./workers/moduleInfoWorker.js", getModuleInfo);

export function generateGraph(
  info: string,
  config: Config = defaultConfig,
): Graph {
  let graph: Graph | null = null;
  // 本地模式，info 为 ""
  if (!info) {
    graph = new Graph("", config, pool);
  } else {
    // 线上模式：1. info = "react" 2. info = package.json 的内容
    graph = new Graph(info, config, pool);
  }
  return graph;
}
