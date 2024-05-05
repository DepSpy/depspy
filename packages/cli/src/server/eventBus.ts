import { Config, generateGraph, Graph } from "@dep-spy/core";
import type ws from "ws";

export const EventBus: Record<
  string,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data: any, option: Config, ws: ws) => void
> = {
  size: async (data, option, ws) => {
    const graph = generateGraph("", {
      ...option,
      size: true,
      depth: Number(data.newDepth),
    });
    ws.send(formatMes("size", await combineRes(graph)));
  },
  depth: async (data, option, ws) => {
    const graph = generateGraph("", {
      ...option,
      depth: Number(data.newDepth),
    });
    ws.send(formatMes("depth", await combineRes(graph, option)));
  },
};

async function combineRes(graph: Graph, option: Config = {}) {
  await graph.ensureGraph();
  return JSON.stringify({
    root: await graph.getGraph(),
    codependency: await graph.getCodependency(),
    circularDependency: await graph.getCircularDependency(),
    ...option,
  });
}

function formatMes(type: string, data: unknown) {
  return JSON.stringify({ type, data });
}
