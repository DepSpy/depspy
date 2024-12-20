import threads from "worker_threads";
import { EventBus } from "./eventBus";
const parentPort = threads.parentPort;

parentPort.on("message", async ({ type, params }) => {
  const result = await EventBus[type](params);
  parentPort.postMessage(result);
});
