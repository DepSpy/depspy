import threads from "worker_threads";
import EventEmitter from "events";
import { Resolve, Event } from "../type";

type EventItem = Event[keyof Event];

export default class Pool {
  private taskQueue: {
    task: EventItem["Task"];
    resolve: Resolve<keyof Event>;
  }[] = []; //任务队列
  private freeWorkers: Worker[] = [];
  constructor(maxPoolSize: number, createWorker: (index: number) => Worker) {
    EventEmitter.defaultMaxListeners = 300;
    for (let i = 0; i < maxPoolSize; i++) {
      this.freeWorkers.push(createWorker(i));
    }
  }
  addTask<RESULT_TYPE>(task: EventItem["Task"]): Promise<[RESULT_TYPE, Error]> {
    return new Promise((resolve) => {
      const typeTask = task as EventItem["Task"];
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
        data: RESULT_TYPE;
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
  private resolve: Resolve<keyof Event>;
  run({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    task,
    resolve,
  }: {
    task: EventItem["Task"];
    resolve: Resolve<keyof Event>;
  }) {
    this.resolve = resolve;
  }
  message(data: EventItem["Result"]) {
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
  public run({
    task,
    resolve,
  }: {
    task: EventItem["Task"];
    resolve: Resolve<keyof Event>;
  }) {
    this.worker.postMessage(task);
    super.run({ task, resolve });
  }
}

export class OnlineWorker extends Worker {
  constructor(
    private readonly fn: (
      params: EventItem["Task"]["params"],
    ) => Promise<EventItem["Result"]>,
  ) {
    super();
  }
  public run({
    task,
    resolve,
  }: {
    task: EventItem["Task"];
    resolve: Resolve<keyof Event>;
  }) {
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
