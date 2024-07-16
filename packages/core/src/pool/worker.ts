import threads from "worker_threads";
import { getModuleInfo } from "@dep-spy/utils";
const parentPort = threads.parentPort;

parentPort.on(
  "message",
  async ({ type, params }: { type: string; params: unknown[] }) => {
    const result = await EventBus[type](...params);
    parentPort.postMessage(result);
  },
);

const EventBus = {
  moduleInfo: async (...params: [string, string]) => {
    return await getModuleInfo(...params);
  },
};
