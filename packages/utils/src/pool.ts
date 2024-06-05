import { MODULE_INFO_TYPE, POOL_TASK } from "./type";
import { Worker } from "worker_threads";
import path from "path";
import getModuleInfo from "./getModuleInfo";
const inBrowser = typeof window !== "undefined";

export default class Pool {
  private resultArray: MODULE_INFO_TYPE[] = []; //结果存储
  private taskQueue: POOL_TASK[] = []; //任务队列
  private workersPool: Worker[] = []; //线程池
  private tasksNumber: number = 0; //应该完成的任务数量
  private closePool: (value: Pool["resultArray"]) => void;
  constructor(private readonly maxPoolSize: number) {
    if (inBrowser) {
      return; //浏览器环境不创建
    }
    for (let i = 0; i < maxPoolSize; i++) {
      this.createWorker();
    }
  }
  createWorker() {
    const worker = new Worker(path.resolve(__dirname, "./moduleInfoWorker.js"));
    worker.on("message", (data) => {
      this.resultArray.push(data);
      this.runNextTask(worker);
    });
    worker.on("error", (err) => {
      console.error(err);
      //报错则没有结果,让应该得到的结果数减少1
      this.tasksNumber--;
      this.runNextTask(worker);
    });
    this.workersPool.push(worker);
  }
  runNextTask(worker: Worker) {
    if (this.taskQueue.length !== 0) {
      worker.postMessage(this.taskQueue.shift());
      return;
    }
    //如果没有下一个任务 且 任务数量和结果数量相同
    if (this.resultArray.length === this.tasksNumber) {
      this.closePool(this.resultArray);
    }
  }
  run(): Promise<MODULE_INFO_TYPE[]> {
    if (inBrowser) {
      return Promise.all(this.taskQueue.map((task) => getModuleInfo(...task)));
    }
    return new Promise((resolve) => {
      this.closePool = resolve;
      this.resultArray = []; // 清空上一次剩下的结果
      this.tasksNumber = this.taskQueue.length;
      for (let i = 0; i < this.workersPool.length; i++) {
        const worker = this.workersPool[i];
        this.runNextTask(worker);
      }
    });
  }
  addToTaskQueue(task: POOL_TASK): void {
    this.taskQueue.push(task);
  }
}
