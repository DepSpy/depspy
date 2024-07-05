import { generateStaticGraph } from "@dep-spy/core";
import { parentPort, workerData } from "worker_threads";

const { config } = workerData;

if (config.entry) {
  //eslint-disable-next-line
  async function getData() {
    const staticGraph = generateStaticGraph(config.entry, config);
    await staticGraph.outputToFile();
    return JSON.stringify(staticGraph.getGraph());
  }
  getData().then((data) => {
    parentPort.postMessage(data);
  });
}
