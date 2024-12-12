import { ThreadsPool, ThreadsWorker } from "@dep-spy/utils";
import os from "os";
import path from "path";
import { EventBus, TASK_TYPE } from "./eventBus";

// 本地线程池
export default new ThreadsPool<typeof EventBus>(
  os?.cpus ? os.cpus().length : 0,
  (index: number) => {
    return new ThreadsWorker({
      fileUrl: path.join(__dirname, "./threadsPool/worker.js"),
      key: String(index),
    });
  },
);

export { EventBus, TASK_TYPE };
