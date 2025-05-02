import { Worker } from "worker_threads";
import {
  GetTreeShakingDetailOptions,
  GetTreeShakingDetailResult,
} from "./getTreeShakingDetail";
import path from "path";

export function getTreeShakingDetailMain(config: GetTreeShakingDetailOptions) {
  return new Promise<GetTreeShakingDetailResult>((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, "../threadsPool/getTreeShakingDetailThread.js"),
      {
        workerData: config,
      },
    );
    // 监听消息响应
    worker.on("message", (res) => {
      try {
        resolve(res);
        worker.terminate()
      } catch {
        resolve({
          treeShakingCode: "",
          sourceToImports: new Map(),
          dynamicallySource: new Set(),
        });
        worker.terminate()
      }
    });
  });
}
