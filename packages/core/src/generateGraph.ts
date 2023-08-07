import { Node, Config } from "./constant";
import { Graph } from "./graph";
interface generateGraphRes {
  root: Node;
  codependency: Node[];
  circularDependency: Node[];
}
export async function generateGraph(): Promise<generateGraphRes>;
export async function generateGraph(info: string): Promise<generateGraphRes>;
export async function generateGraph(config: Config): Promise<generateGraphRes>;
export async function generateGraph(
  info: string,
  config: Config,
): Promise<generateGraphRes>;
export async function generateGraph(
  info?: string | Config,
  config: Config = {},
): Promise<generateGraphRes> {
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
  const root = await graph.getGraph();
  const codependency = await graph.getCodependency();
  const circularDependency = await graph.getCircularDependency();
  await graph.outputToFile();
  return { root, codependency, circularDependency };
}
