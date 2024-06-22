import threads from "worker_threads";
import { useGetModuleInfo } from "@dep-spy/utils";
const parentPort = threads.parentPort;

const getModuleInfo = useGetModuleInfo();

parentPort.on("message", async (task: [string, string]) => {
  const moduleInfo = await getModuleInfo(...task);
  parentPort.postMessage(moduleInfo);
});
