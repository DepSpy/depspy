import threads from "worker_threads";
import EventEmitter from "events";

type Task = {
  type: string;
  params: unknown[];
};

type Resolve = (result: {
  data: unknown;
  worker: Worker<Task, unknown>;
  error: Error;
}) => unknown;

export default class Pool {
  private taskQueue: { task: Task; resolve: Resolve }[] = []; //任务队列
  private freeWorkers: Worker<Task, unknown>[] = [];
  constructor(
    maxPoolSize: number,
    createWorker: (index: number) => Worker<Task, unknown>,
  ) {
    EventEmitter.defaultMaxListeners = 300;
    for (let i = 0; i < maxPoolSize; i++) {
      this.freeWorkers.push(createWorker(i));
    }
  }
  addTask<POOL_TASK extends Task, RESULT_TYPE>(
    task: POOL_TASK,
  ): Promise<[RESULT_TYPE, Error]> {
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
        error,
      }: {
        data: RESULT_TYPE;
        worker: Worker<Task, unknown>;
        error: Error;
      }) => {
        // 执行结束
        this.runNext(worker);
        return [data, error];
      },
    );
  }
  runNext(worker: Worker<Task, unknown>) {
    //直接领取下一个任务
    if (this.taskQueue.length > 0) {
      worker.run({ ...this.taskQueue.shift() });
    } else {
      //置为空闲线程
      this.freeWorkers.push(worker);
    }
  }
  //TODO 对线程阻塞逻辑做优化处理
}
export class Worker<POOL_TASK extends Task, RESULT_TYPE> {
  private resolve: Resolve;
  run({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    task,
    resolve,
  }: {
    task: POOL_TASK;
    resolve: Resolve;
  }) {
    this.resolve = resolve;
  }
  message(data: RESULT_TYPE) {
    //任务已完成
    this.resolve({ data, worker: this, error: null });
    //清空当前任务
    this.resolve = null;
  }
  error(error: Error) {
    this.resolve && this.resolve({ data: null, worker: this, error: error });
    this.resolve = null;
  }
}

export class OffLineWorker<POOL_TASK extends Task, RESULT_TYPE> extends Worker<
  POOL_TASK,
  RESULT_TYPE
> {
  worker: threads.Worker;
  constructor(path: string) {
    super();
    this.worker = new threads.Worker(path);
    this.worker.on("message", (data) => {
      super.message(data);
    });
    this.worker.on("error", (error) => {
      super.error(error);
    });
  }
  public run({ task, resolve }: { task: POOL_TASK; resolve: Resolve }) {
    this.worker.postMessage(task);
    super.run({ task, resolve });
  }
}

export class OnlineWorker<POOL_TASK extends Task, RESULT_TYPE> extends Worker<
  POOL_TASK,
  RESULT_TYPE
> {
  constructor(
    private readonly fn: (
      ...params: POOL_TASK["params"]
    ) => Promise<RESULT_TYPE>,
  ) {
    super();
  }
  public run({ task, resolve }: { task: POOL_TASK; resolve: Resolve }) {
    this.fn(...task.params)
      .then((data) => {
        this.message(data);
      })
      .catch((error) => {
        this.error(error);
      });
    super.run({ task, resolve });
  }
}
