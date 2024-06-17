import { defaultConfig } from "../constant";
import { Config } from "../type";
import { Graph } from "./graph";
import { MODULE_CONFIG, MODULE_INFO_TYPE, Pool } from "@dep-spy/utils";
import os from "os";
const pool = new Pool<[string, MODULE_CONFIG], MODULE_INFO_TYPE>(
  os.cpus ? os.cpus().length : 0,
  "./workers/moduleInfoWorker.js",
);
export let graph: Graph | null = null;

export function generateGraph(
  info: string,
  config: Config = defaultConfig,
): Graph {
  // 本地模式，info 为 ""
  if (!info) {
    graph = new Graph("", config, pool);
  } else {
    // 线上模式：1. info = "react" 2. info = package.json 的内容
    graph = new Graph(info, config, pool);
  }
  return graph;
}
