import { parentPort } from "worker_threads";
import { getModuleInfo } from "./index";
import { POOL_TASK } from "./type";

parentPort.on("message", async (task: POOL_TASK) => {
  const moduleInfo = await getModuleInfo(...task);
  parentPort.postMessage(moduleInfo);
});
