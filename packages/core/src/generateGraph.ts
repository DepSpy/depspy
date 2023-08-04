import { Node, Config } from "./constant";
import { Graph } from "./graph";
export async function generateGraph(): Promise<Node>;
export async function generateGraph(info: string): Promise<Node>;
export async function generateGraph(config: Config): Promise<Node>;
export async function generateGraph(
  info: string,
  config: Config,
): Promise<Node>;
export async function generateGraph(
  info?: string | Config,
  config: Config = {},
): Promise<Node> {
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
  const Root = await graph.getGraph();
  await graph.outputToFile();
  return Root;
}
