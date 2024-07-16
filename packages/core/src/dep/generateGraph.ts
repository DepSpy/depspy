import { defaultConfig } from "../constant";
import { Config } from "../type";
import { Graph } from "./graph";

export function generateGraph(
  info: string,
  config: Config = defaultConfig,
): Graph {
  let graph: Graph;
  // 本地模式，info 为 ""
  if (!info) {
    graph = new Graph("", config);
  } else {
    // 线上模式：1. info = "react" 2. info = package.json 的内容
    graph = new Graph(info, config);
  }
  return graph;
}
