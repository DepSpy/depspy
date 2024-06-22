import threads from "worker_threads";
import EventEmitter from "events";
import { Resolve, Task } from "./type";

export default class Pool<POOL_TASK extends unknown[], RESULT_TYPE> {
  private taskQueue: Task<POOL_TASK, RESULT_TYPE>[] = []; //任务队列
  private freeWorkers: Worker<POOL_TASK, RESULT_TYPE>[] = [];
  constructor(
    maxPoolSize: number,
    createWorker: (index: number) => Worker<POOL_TASK, RESULT_TYPE>,
  ) {
    EventEmitter.defaultMaxListeners = 300;
    for (let i = 0; i < maxPoolSize; i++) {
      this.freeWorkers.push(createWorker(i));
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
    }).then(
      ({
        data,
        worker,
      }: {
        data: RESULT_TYPE;
        worker: Worker<POOL_TASK, RESULT_TYPE>;
      }) => {
        this.runNext(worker);
        return data;
      },
    );
  }
  runNext(worker: Worker<POOL_TASK, RESULT_TYPE>) {
    //直接领取下一个任务
    if (this.taskQueue.length > 0) {
      worker.run({ ...this.taskQueue.shift() });
    } else {
      //置为空闲线程
      this.freeWorkers.push(worker);
    }
  }
}
export class Worker<POOL_TASK extends unknown[], RESULT_TYPE> {
  private resolve: Resolve<POOL_TASK, RESULT_TYPE>;
  run({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    task,
    resolve,
  }: {
    task: POOL_TASK;
    resolve: Resolve<POOL_TASK, RESULT_TYPE>;
  }) {
    this.resolve = resolve;
  }
  message(data: RESULT_TYPE) {
    //任务已完成
    this.resolve({ data, worker: this });
    //清空当前任务
    this.resolve = null;
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
  constructor(path: string) {
    super();
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
    resolve: Resolve<POOL_TASK, RESULT_TYPE>;
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
  ) {
    super();
  }
  public run({
    task,
    resolve,
  }: {
    task: POOL_TASK;
    resolve: Resolve<POOL_TASK, RESULT_TYPE>;
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
