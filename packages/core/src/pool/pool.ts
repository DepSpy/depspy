import threads from "worker_threads";
import EventEmitter from "events";
import { getModuleInfo } from "@dep-spy/utils";

export type EventBus = typeof EventBus;
export type EventBusKey = keyof typeof EventBus;
export type Params<K extends EventBusKey> = Parameters<EventBus[K]>[0]; // 取元组的第一个
export type Return<K extends EventBusKey> = Awaited<ReturnType<EventBus[K]>>;

//type
export type COMMON_TASK = {
  type: EventBusKey;
  params: Params<EventBusKey>;
};
export type COMMON_RESULT_TYPE = Return<EventBusKey>;

export type Resolve = (result: {
  data: COMMON_RESULT_TYPE;
  worker: Worker;
  error: Error;
}) => unknown;

export const enum TASK_TYPE {
  MODULE_INFO = "module_info",
  MESSAGE = "message",
}

// 处理函数参数必须为配置对象
export const EventBus = {
  [TASK_TYPE.MODULE_INFO]: async (options: {
    info: string;
    baseDir: string;
  }) => {
    return await getModuleInfo(options);
  },

  //测试示例
  [TASK_TYPE.MESSAGE]: async (options: { name: number }) => {
    console.log(options.name);
  },
};

export default class Pool {
  private taskQueue: {
    task: COMMON_TASK;
    resolve: Resolve;
  }[] = []; //任务队列
  private freeWorkers: Worker[] = [];
  constructor(maxPoolSize: number, createWorker: (index: number) => Worker) {
    EventEmitter.defaultMaxListeners = 300;
    for (let i = 0; i < maxPoolSize; i++) {
      this.freeWorkers.push(createWorker(i));
    }
  }
  addTask<T extends EventBusKey>(task: {
    type: T;
    params: Params<T>;
  }): Promise<[Return<T>, Error]> {
    return new Promise((resolve) => {
      const typeTask = task as COMMON_TASK;
      //尝试加入空闲线程中执行
      if (this.freeWorkers.length > 0) {
        const worker = this.freeWorkers.shift();
        worker.run({ task: typeTask, resolve });
      } else {
        //无空闲线程,推入到任务队列
        this.taskQueue.push({ task: typeTask, resolve });
      }
    }).then(
      ({
        data,
        worker,
        error,
      }: {
        data: Return<T>;
        worker: Worker;
        error: Error;
      }) => {
        // 执行结束
        this.runNext(worker);
        return [data, error];
      },
    );
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
  //TODO 对线程阻塞逻辑做优化处理
}
export class Worker {
  private resolve: Resolve;
  run({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    task,
    resolve,
  }: {
    task: COMMON_TASK;
    resolve: Resolve;
  }) {
    this.resolve = resolve;
  }
  message(data: COMMON_RESULT_TYPE) {
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

export class OffLineWorker extends Worker {
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
  public run({ task, resolve }: { task: COMMON_TASK; resolve: Resolve }) {
    this.worker.postMessage(task);
    super.run({ task, resolve });
  }
}

export class OnlineWorker extends Worker {
  constructor(
    private readonly fn: (
      params: COMMON_TASK["params"],
    ) => Promise<COMMON_RESULT_TYPE>,
  ) {
    super();
  }
  public run({ task, resolve }: { task: COMMON_TASK; resolve: Resolve }) {
    this.fn(task.params)
      .then((data) => {
        this.message(data);
      })
      .catch((error) => {
        this.error(error);
      });
    super.run({ task, resolve });
  }
}
