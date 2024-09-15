import { defaultConfig } from "../constant";
import { Config } from "../type";
import { StaticGraph } from "./staticGraph";

export function generateStaticGraph(
  entry: string,
  config: Config = defaultConfig,
): StaticGraph {
  return new StaticGraph(entry, config);
}
