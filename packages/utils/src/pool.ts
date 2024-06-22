import threads from "worker_threads";
import EventEmitter from "events";
import { createWorker, Resolve, Task } from "./type";

export default class Pool<POOL_TASK extends unknown[], RESULT_TYPE> {
  private taskQueue: Task<POOL_TASK, RESULT_TYPE>[] = []; //任务队列
  private freeWorkers: Worker<POOL_TASK, RESULT_TYPE>[] = [];
  constructor(
    maxPoolSize: number,
    createWorker: createWorker<POOL_TASK, RESULT_TYPE>,
  ) {
    EventEmitter.defaultMaxListeners = 300;
    for (let i = 0; i < maxPoolSize; i++) {
      this.freeWorkers.push(createWorker(this.freeWorkers, this.taskQueue, i));
    }
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
export class Worker<POOL_TASK extends unknown[], RESULT_TYPE> {
  private resolve: Resolve<RESULT_TYPE>;
  constructor(
    readonly freeWorkers: Worker<POOL_TASK, RESULT_TYPE>[],
    readonly taskQueue: Task<POOL_TASK, RESULT_TYPE>[],
  ) {}
  run({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    task,
    resolve,
  }: {
    task: POOL_TASK;
    resolve: Resolve<RESULT_TYPE>;
  }) {
    this.resolve = resolve;
  }
  message(data: RESULT_TYPE) {
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
  error(error: string) {
    console.error(error);
    this.resolve && this.resolve(null);
    this.resolve = null;
  }
}

export class OffLineWorker<
  POOL_TASK extends unknown[],
  RESULT_TYPE,
> extends Worker<POOL_TASK, RESULT_TYPE> {
  worker: threads.Worker;
  constructor(
    path: string,
    freeWorkers: OffLineWorker<POOL_TASK, RESULT_TYPE>[],
    taskQueue: {
      task: POOL_TASK;
      resolve: (result: RESULT_TYPE) => void;
    }[],
  ) {
    super(freeWorkers, taskQueue);
    this.worker = new threads.Worker(path);
    this.worker.on("message", (data) => {
      super.message(data);
    });
    this.worker.on("error", (error) => {
      super.error(String(error));
    });
  }
  public run({
    task,
    resolve,
  }: {
    task: POOL_TASK;
    resolve: (result: RESULT_TYPE) => void;
  }) {
    this.worker.postMessage(task);
    super.run({ task, resolve });
  }
}

export class OnlineWorker<
  POOL_TASK extends unknown[],
  RESULT_TYPE,
> extends Worker<POOL_TASK, RESULT_TYPE> {
  constructor(
    private readonly fn: (...params: POOL_TASK) => Promise<RESULT_TYPE>,
    freeWorkers: OnlineWorker<POOL_TASK, RESULT_TYPE>[],
    taskQueue: Task<POOL_TASK, RESULT_TYPE>[],
  ) {
    super(freeWorkers, taskQueue);
  }
  public run({
    task,
    resolve,
  }: {
    task: POOL_TASK;
    resolve: Resolve<RESULT_TYPE>;
  }) {
    this.fn(...task)
      .then((data) => {
        this.message(data);
      })
      .catch((error) => {
        this.error(error);
      });
    super.run({ task, resolve });
  }
}
