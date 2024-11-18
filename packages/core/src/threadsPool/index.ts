import { getModuleInfo, ThreadsPool, ThreadsWorker } from "@dep-spy/utils";
import os from "os";
import path from "path";

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

  //测试示例
  [TASK_TYPE.MESSAGE]: async (options: { name: number }) => {
    console.log(options.name);
  },
};

// 本地线程池
export default new ThreadsPool<typeof EventBus>(
  os?.cpus ? os.cpus().length : 0,
  () => {
    return new ThreadsWorker(path.join(__dirname, "./threadsPool/worker.js"));
  },
);
