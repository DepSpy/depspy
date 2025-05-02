import { workerData, parentPort } from "worker_threads";
import { getTreeShakingDetail } from "../static/getTreeShakingDetail";

try {
  getTreeShakingDetail(workerData).then((treeShakingDetail) => {
    // 序列化后进行传输
    parentPort.postMessage(treeShakingDetail);
  });
} catch (err) {
  parentPort.postMessage({
    treeShakingCode: "",
    sourceToImports: new Map(),
    dynamicallySource: new Set(),
  });
}
