import { generateGraph, Graph, Config } from "@dep-spy/core";
import { parentPort, workerData } from "worker_threads";

const { config } = workerData;

if (config) {
  //eslint-disable-next-line
  async function getData() {
    const graph = generateGraph("", config);
    return await combineRes(graph);
  }
  //包一层async，以免顶层用
  getData().then((data) => {
    parentPort.postMessage(data);
  });
}
async function combineRes(graph: Graph, option: Config = {}) {
  return JSON.stringify({
    root: await graph.getGraph(),
    codependency: await graph.getCodependency(),
    circularDependency: await graph.getCircularDependency(),
    ...option,
  });
}
