import threads from "worker_threads";
import { getModuleInfo } from "../index";
const parentPort = threads.parentPort;

parentPort.on("message", async (task: [string, string]) => {
  const moduleInfo = await getModuleInfo(...task);
  parentPort.postMessage(moduleInfo);
});
