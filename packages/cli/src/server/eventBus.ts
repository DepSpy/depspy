import { Config, getGraph } from "@dep-spy/core";
import type ws from "ws";

export const EventBus: Record<
  string,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data: any, option: Config, ws: ws) => void
> = {
  size: async (data, option, ws) => {
    const graph = getGraph();
    await graph.update(data.newDepth);
    const root = await graph.getGraph();
    ws.send(
      formatMes("size", {
        root: root,
        codependency: await graph.getCodependency(),
        circularDependency: await graph.getCircularDependency(),
        ...option,
      }),
    );
  },
  depth: async (data, option, ws) => {
    const graph = getGraph();
    await graph.update(data.newDepth);
    const root = await graph.getGraph();
    ws.send(
      formatMes("depth", {
        root: root,
        codependency: await graph.getCodependency(),
        circularDependency: await graph.getCircularDependency(),
        ...option,
      }),
    );
  },
};

function formatMes(type: string, data: unknown) {
  return JSON.stringify({ type, data });
}
