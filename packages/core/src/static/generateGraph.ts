import { defaultConfig } from "../constant";
import { Config } from "../type";
import { Graph } from "./graph";

export function generateGraph(
  entry: string,
  config: Config = defaultConfig,
): Graph {
  return new Graph(entry, config);
}
