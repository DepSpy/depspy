import { generateStaticGraph, generateGraph } from "@dep-spy/core";
import { parentPort, workerData } from "worker_threads";
import { combineRes } from "./eventBus";

const { config } = workerData;

if (config.entry) {
  const staticGraph = generateStaticGraph(config.entry, config);
  staticGraph.outputToFile();
  parentPort.postMessage(JSON.stringify(staticGraph.getGraph()));
}

if (config) {
  //eslint-disable-next-line
  async function getData() {
    const graph = generateGraph("", JSON.parse(config));
    return await combineRes(graph);
  }
  //包一层async，以免顶层用
  getData().then((data) => {
    parentPort.postMessage(JSON.stringify(data));
  });
}
