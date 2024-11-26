import EventEmitter from "events";
import threads from "worker_threads";

type Resolve<T> = (res: { data: T; worker: Worker; error: Error }) => void;
type Task<T> = {
  task: T;
  resolve: ([data, error]: [unknown, Error]) => void;
  failWorkerKeySet: Set<string>; //存储已经尝试失败的worker 的key， 防止重复触发
};

abstract class Pool {
  private freeWorkers: Worker[] = [];
  private taskQueue: Task<unknown>[] = []; //任务队列
  public maxPoolSize: number;
  private allWorkers: Worker[];

  protected constructor(
    maxPoolSize: number,
    createWorker: (index: number) => Worker,
  ) {
    this.maxPoolSize = maxPoolSize;
    EventEmitter.defaultMaxListeners = 300;
    for (let i = 0; i < maxPoolSize; i++) {
      this.freeWorkers.push(createWorker(i));
      this.allWorkers.push(createWorker(i));
    }
  }

  addTask(task: unknown): Promise<[unknown, Error]> {
    return new Promise((resolve) => {
      //尝试加入空闲线程中执行
      if (this.freeWorkers.length > 0) {
        const worker = this.freeWorkers.shift();
        worker
          .run({
            task,
          })
          .then(({ data, worker, error }) => {
            // worker 执行失败时，触发重执行逻辑
            if (error) {
              this.retryTask({
                task,
                resolve,
                failWorkerKeySet: new Set([worker.key]),
              });
              return;
            }
            // 无错误时
            resolve([data, error]);
            this.runNext(worker);
          });
        return;
      }
      //无空闲线程,推入到任务队列
      this.taskQueue.push({ task, resolve, failWorkerKeySet: new Set() });
    });
  }

  async runNext(worker: Worker) {
    // 优先执行被分配的任务
    const task = worker.getNextTask();

    if (task) {
      await this.runTask(worker, task);
    }

    //直接领取下一个任务
    if (this.taskQueue.length > 0) {
      // 找到合适任务执行， 若曾经失败， 则不在该worker执行此任务
      const index = this.taskQueue.findIndex(
        (v) => !v.failWorkerKeySet.has(worker.key),
      );

      if (index === -1) {
        // 若此线程未找到任务
        //置为空闲线程
        this.freeWorkers.push(worker);
        return;
      }

      // 将任务取出
      const { task, resolve, failWorkerKeySet } = this.taskQueue[index];
      this.taskQueue.splice(index, 1);

      const { data, error } = await worker.run({ task });
      if (error) {
        // 存在错误， 触发重执行
        this.retryTask({
          task,
          resolve,
          failWorkerKeySet: failWorkerKeySet.add(worker.key),
        });
        this.runNext(worker);
        return;
      }
      // 无错误产生
      resolve([data, error]);
      this.runNext(worker);
      return;
    }
    //置为空闲线程
    this.freeWorkers.push(worker);
  }

  async retryTask(errorTask: Task<unknown>) {
    const { task, resolve, failWorkerKeySet } = errorTask;

    const workerIndex = this.allWorkers.findIndex(
      (v) => !failWorkerKeySet.has(v.key),
    );
    // 所有线程均无法解决该task，则报错
    if (workerIndex === -1) {
      resolve([null, new Error("错误的参数输入")]);
      return;
    }

    // 若存在线程未尝试
    const worker = this.allWorkers[workerIndex];

    const workerIndexFree = this.freeWorkers.findIndex((v) => v === worker);

    if (workerIndexFree !== -1) {
      // 当线程不是一个空闲线程
      worker.addNextTask(errorTask);
      return;
    }
    // 取出
    this.freeWorkers.splice(workerIndexFree, 1);
    const { data, error } = await worker.run({ task });

    if (error) {
      this.freeWorkers.push(worker);
      this.retryTask({
        ...errorTask,
        failWorkerKeySet: failWorkerKeySet.add(worker.key),
      });
      return;
    }
    resolve([data, error]);
    this.freeWorkers.push(worker);
  }

  async runTask(worker: Worker, taskInfo: Task<unknown>) {
    const { task, resolve, failWorkerKeySet } = taskInfo;
    const { data, error } = await worker.run({ task });

    if (error) {
      // 执行失败
      this.retryTask({
        ...taskInfo,
        failWorkerKeySet: failWorkerKeySet.add(worker.key),
      });
      this.freeWorkers.push(worker);
      return;
    }
    resolve([data, error]);
    this.freeWorkers.push(worker);
  }

  getWorker() {
    return this.freeWorkers.shift();
  }
}

abstract class Worker {
  public readonly key: string; // 失败重试时转交任务避免转交给相同类型worker
  private resolve: Resolve<unknown>; //提交任务结果， 结束promise
  private queue: Task<unknown>[]; //待办任务，优先执行

  run({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    task,
  }: {
    task: unknown;
  }): Promise<Parameters<Resolve<unknown>>[0]> {
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
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
  addNextTask(task: Task<unknown>) {
    this.queue.push(task);
  }
  getNextTask() {
    return this.queue.shift();
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
  async runNext(worker: ThreadsWorker) {
    super.runNext(worker);
  }
}

export class ThreadsWorker extends Worker {
  worker: threads.Worker;
  constructor({ fileUrl, key }: { fileUrl: string; key?: string }) {
    super();
    this.key = key;
    this.worker = new threads.Worker(fileUrl);
    this.worker.on("message", (data) => {
      super.message(data);
    });
    this.worker.on("error", (error) => {
      super.error(error);
    });
  }

  public run({ task }: { task: unknown }) {
    this.worker.postMessage(task);
    return super.run({ task });
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

  async runNext(worker: FunctionWorker<T>) {
    super.runNext(worker);
  }
}

export class FunctionWorker<
  T extends (task: unknown) => Promise<unknown>,
> extends Worker {
  private fn: T;
  constructor({ fn, key }: { fn: T; key: string }) {
    super();
    this.fn = fn;
    this.key = key;
  }
  public run({ task }: { task: unknown; resolve: Resolve<unknown> }) {
    this.fn(task)
      .then((data) => {
        this.message(data);
      })
      .catch((error) => {
        this.error(error);
      });
    return super.run({ task });
  }
}
