import path from "path";
import threads from "worker_threads";
import EventEmitter from "events";
const inBrowser = typeof window !== "undefined";
const Worker = threads.Worker;

export default class Pool<POOL_TASK extends unknown[], RESULT_TYPE> {
  private taskQueue: {
    task: POOL_TASK;
    resolve: (result: RESULT_TYPE) => void;
  }[] = []; //任务队列
  private freeWorkers: TaskWorker<POOL_TASK, RESULT_TYPE>[] = [];
  constructor(
    maxPoolSize: number,
    private readonly path: string,
  ) {
    if (inBrowser) {
      return; //浏览器环境不创建
    }
    EventEmitter.defaultMaxListeners = 300;
    for (let i = 0; i < maxPoolSize; i++) {
      this.createWorker();
    }
  }
  createWorker() {
    const worker = new TaskWorker<POOL_TASK, RESULT_TYPE>(
      path.resolve(__dirname, this.path),
      this.freeWorkers,
      this.taskQueue,
    );
    this.freeWorkers.push(worker);
  }
  addTask(task: POOL_TASK): Promise<RESULT_TYPE> {
    return new Promise((resolve) => {
      //尝试加入空闲线程中执行
      if (this.freeWorkers.length > 0) {
        const worker = this.freeWorkers.shift();
        worker.run({ task, resolve });
      } else {
        //无空闲线程,推入到任务队列
        this.taskQueue.push({ task, resolve });
      }
    });
  }
}

class TaskWorker<POOL_TASK, RESULT_TYPE> {
  worker: threads.Worker;
  resolve: (result: RESULT_TYPE) => void = null;
  constructor(
    path: string,
    private freeWorkers: TaskWorker<POOL_TASK, RESULT_TYPE>[],
    private taskQueue: {
      task: POOL_TASK;
      resolve: (result: RESULT_TYPE) => void;
    }[],
  ) {
    this.worker = new Worker(path);
    this.worker.on("message", this.message.bind(this));
    this.worker.on("error", this.error.bind(this));
  }
  private message(data: RESULT_TYPE) {
    //任务已完成
    this.resolve(data);
    //清空当前任务
    this.resolve = null;
    if (this.taskQueue.length > 0) {
      //尝试直接领取下一个任务
      this.run(this.taskQueue.shift());
    } else {
      //任务队列没有多余的任务，将自己推到空闲状态组
      this.freeWorkers.push(this);
    }
  }
  private error() {
    //发生了错误
    this.resolve(null);
  }
  public run({
    task,
    resolve,
  }: {
    task: POOL_TASK;
    resolve: (result: RESULT_TYPE) => void;
  }) {
    this.worker.postMessage(task);
    this.resolve = resolve;
  }
}
