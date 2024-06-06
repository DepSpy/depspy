import threads from "worker_threads";
import { getModuleInfo } from "../index";
import { POOL_TASK } from "../type";
const parentPort = threads.parentPort;

parentPort.on("message", async (task: POOL_TASK) => {
  const moduleInfo = await getModuleInfo(...task);
  parentPort.postMessage(moduleInfo);
});
