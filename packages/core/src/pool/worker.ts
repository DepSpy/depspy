import threads from "worker_threads";
import { getModuleInfo } from "@dep-spy/utils";
const parentPort = threads.parentPort;

parentPort.on("message", async ({ type, params }) => {
  const result = await EventBus[type](params);
  parentPort.postMessage(result);
});
// 处理函数参数必须为配置对象
export const EventBus = {
  moduleInfo: async (options: { info: string; baseDir: string }) => {
    return await getModuleInfo(options);
  },
  message: async (options: { name: number }) => {
    console.log(options.name);
  },
};
