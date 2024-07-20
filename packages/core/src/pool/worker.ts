import threads from "worker_threads";
import { getModuleInfo } from "@dep-spy/utils";
import { Worker } from "./pool";
const parentPort = threads.parentPort;

//type
export type Event = {
  [K in keyof typeof EventBus]: {
    Task: {
      type: K;
      params: Parameters<(typeof EventBus)[K]>[0];
    };
    Result: Awaited<ReturnType<(typeof EventBus)[K]>>;
  };
};

export type TASK<TASK_TYPE extends keyof Event> = Event[TASK_TYPE]["Task"];
export type RESULT_TYPE<TASK_TYPE extends keyof Event> =
  Event[TASK_TYPE]["Result"];
export type COMMON_TASK = Event[keyof Event]["Task"];
export type COMMON_RESULT_TYPE = Event[keyof Event]["Result"];

export type Resolve = (result: {
  data: COMMON_RESULT_TYPE;
  worker: Worker;
  error: Error;
}) => unknown;

parentPort.on("message", async ({ type, params }) => {
  const result = await EventBus[type](params);
  parentPort.postMessage(result);
});
export const enum TASK_TYPE {
  MODULE_INFO = "module_info",
  MESSAGE = "message",
}
// 处理函数参数必须为配置对象
export const EventBus = {
  [TASK_TYPE.MODULE_INFO]: async (options: {
    info: string;
    baseDir: string;
  }) => {
    return await getModuleInfo(options);
  },
  [TASK_TYPE.MESSAGE]: async (options: { name: number }) => {
    console.log(options.name);
  },
};
