import { Config, Graph } from "@dep-spy/core";
import path from "path";
import type ws from "ws";
import { Worker } from "worker_threads";

export const EventBus: Record<
  string,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data: any, option: Config, ws: ws) => void
> = {
  size: async (data, option, ws) => {
    const worker = new Worker(path.resolve(__dirname, "./server/worker.js"), {
      workerData: {
        config: JSON.stringify({
          ...option,
          size: true,
          depth: Number(data.newDepth),
        }),
      },
    });
    worker.on("message", (data) => {
      ws.send(formatMes("size", JSON.parse(data)));
    });
  },
  depth: async (data, option, ws) => {
    const worker = new Worker(path.resolve(__dirname, "./server/worker.js"), {
      workerData: {
        config: JSON.stringify({
          ...option,
          depth: Number(data.newDepth),
        }),
      },
    });
    worker.on("message", (data) => {
      ws.send(formatMes("depth", JSON.parse(data)));
    });
  },
};

export async function combineRes(graph: Graph, option: Config = {}) {
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
