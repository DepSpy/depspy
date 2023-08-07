import { Config } from "./constant";
import { Graph } from "./graph";
export async function generateGraph(): Promise<Graph>;
export async function generateGraph(info: string): Promise<Graph>;
export async function generateGraph(config: Config): Promise<Graph>;
export async function generateGraph(
  info: string,
  config: Config,
): Promise<Graph>;
export async function generateGraph(
  info?: string | Config,
  config: Config = {},
): Promise<Graph> {
  let graph: Graph | null = null;
  //实现各种重载
  if (!info) {
    graph = new Graph("", config);
  } else if (typeof info == "object") {
    graph = new Graph("", info);
  } else if (typeof info == "string") {
    graph = new Graph(info, config);
  } else {
    throw new Error(`Invalid parameters ${info}-${config}`);
  }
  return graph;
}
