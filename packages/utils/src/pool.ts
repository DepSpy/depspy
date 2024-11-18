import EventEmitter from "events";
import threads from "worker_threads";

type Resolve<T> = (res: { data: T; worker: Worker; error: Error }) => void;

abstract class Pool {
  private freeWorkers: Worker[] = [];
  private taskQueue: {
    task: unknown;
    resolve: Resolve<unknown>;
  }[] = []; //任务队列

  protected constructor(
    maxPoolSize: number,
    createWorker: (index: number) => Worker,
  ) {
    EventEmitter.defaultMaxListeners = 300;
    for (let i = 0; i < maxPoolSize; i++) {
      this.freeWorkers.push(createWorker(i));
    }
  }

  addTask(task: unknown): Promise<[unknown, Error]> {
    return new Promise((resolve) => {
      //尝试加入空闲线程中执行
      if (this.freeWorkers.length > 0) {
        const worker = this.freeWorkers.shift();
        worker.run({
          task,
          resolve,
        });
      } else {
        //无空闲线程,推入到任务队列
        this.taskQueue.push({ task, resolve });
      }
    }).then(({ data, worker, error }) => {
      // 执行结束
      this.runNext(worker);
      return [data, error];
    });
  }

  runNext(worker: Worker) {
    //直接领取下一个任务
    if (this.taskQueue.length > 0) {
      worker.run({ ...this.taskQueue.shift() });
    } else {
      //置为空闲线程
      this.freeWorkers.push(worker);
    }
  }
}

abstract class Worker {
  resolve: (res: { data: unknown; worker: Worker; error: Error }) => void;

  run({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    task,
    resolve,
  }: {
    task: unknown;
    resolve: Resolve<unknown>;
  }) {
    this.resolve = resolve;
  }
  message(data: unknown) {
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

export class ThreadsPool<
  EVENT_BUS extends Record<string, (options: Record<string, unknown>) => void>,
> extends Pool {
  constructor(
    maxPoolSize: number,
    createWorker: (index: number) => ThreadsWorker,
  ) {
    EventEmitter.defaultMaxListeners = 300;
    super(maxPoolSize, createWorker);
  }
  addTask<T extends keyof EVENT_BUS>(task: {
    type: T;
    params: Parameters<EVENT_BUS[T]>[0];
  }): Promise<[Awaited<ReturnType<EVENT_BUS[T]>>, Error]> {
    return super.addTask(task) as Promise<
      [Awaited<ReturnType<EVENT_BUS[T]>>, Error]
    >;
  }
  runNext(worker: ThreadsWorker) {
    super.runNext(worker);
  }
}

export class ThreadsWorker extends Worker {
  worker: threads.Worker;
  constructor(fileUrl: string) {
    super();
    this.worker = new threads.Worker(fileUrl);
    this.worker.on("message", (data) => {
      super.message(data);
    });
    this.worker.on("error", (error) => {
      super.error(error);
    });
  }

  public run({ task, resolve }: { task: unknown; resolve: Resolve<unknown> }) {
    this.worker.postMessage(task);
    super.run({ task, resolve });
  }
}

export class FunctionPool<
  T extends (task: unknown) => Promise<unknown>,
> extends Pool {
  constructor(
    maxPoolSize: number,
    createWorker: (index: number) => FunctionWorker<T>,
  ) {
    super(maxPoolSize, createWorker);
  }

  addTask(task: Parameters<T>[0]): Promise<[Awaited<ReturnType<T>>, Error]> {
    return super.addTask(task) as Promise<[Awaited<ReturnType<T>>, Error]>;
  }

  runNext(worker: FunctionWorker<T>) {
    super.runNext(worker);
  }
}

export class FunctionWorker<
  T extends (task: unknown) => Promise<unknown>,
> extends Worker {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(private readonly fn: T) {
    super();
  }
  public run({ task, resolve }: { task: unknown; resolve: Resolve<unknown> }) {
    this.fn(task)
      .then((data) => {
        this.message(data);
      })
      .catch((error) => {
        this.error(error);
      });
    super.run({ task, resolve });
  }
}
