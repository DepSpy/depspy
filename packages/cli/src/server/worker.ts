import { generateStaticGraph, generateGraph } from "@dep-spy/core";
import { parentPort, workerData } from "worker_threads";
import { combineRes } from "./eventBus";

const { entry, config } = workerData;

if (entry) {
  parentPort.postMessage(JSON.stringify(generateStaticGraph(entry).getGraph()));
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
