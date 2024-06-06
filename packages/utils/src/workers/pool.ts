import path from "path";
import threads from "worker_threads";
import EventEmitter from "events";
const inBrowser = typeof window !== "undefined";
const Worker = threads.Worker;

export default class Pool<POOL_TASK extends unknown[], RESULT_TYPE> {
  private resultArray: (RESULT_TYPE | null)[] = []; //结果存储
  private taskQueue: POOL_TASK[] = []; //任务队列
  private tasksNumber: number = 0; //应该完成的任务数量
  private workersPool: Map<threads.Worker, POOL_TASK | null> = new Map(); //记录task正在被哪个线程执行
  private taskIndexMap: Map<POOL_TASK, number>; ///记录任务的顺序，方便插入结果的位置
  private closePool: (value: RESULT_TYPE[]) => void; //关闭池子
  constructor(
    private readonly maxPoolSize: number,
    private readonly path: string,
    private readonly completeTask?: (
      ...task: POOL_TASK
    ) => Promise<RESULT_TYPE>,
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
    const worker = new Worker(path.resolve(__dirname, this.path));
    worker.on("message", (data: RESULT_TYPE) => {
      this.addToResult(data, worker);
      this.runNextTask(worker);
    });
    worker.on("error", (err) => {
      console.error(err);
      //报错则没有结果
      this.addToResult(null, worker);
      this.runNextTask(worker);
    });
    this.workersPool.set(worker, null);
  }
  runNextTask(worker: threads.Worker): void {
    if (this.taskQueue.length !== 0) {
      //当一个任务被线程领取
      const task = this.taskQueue.shift();
      this.workersPool.set(worker, task);
      worker.postMessage(task);
      return;
    }
    //任务全部完成
    if (this.tasksNumber === 0) {
      this.closePool(this.resultArray);
    }
  }
  run(): Promise<RESULT_TYPE[]> {
    if (inBrowser) {
      if (!this.completeTask) {
        console.warn("浏览器状态下无处理函数");
        return Promise.reject("浏览器状态下无处理函数");
      }
      const promisesArray = this.taskQueue.map((task) =>
        this.completeTask(...task),
      );
      this.taskQueue = []; //为下一次清空给任务队列
      return Promise.all(promisesArray);
    }
    return new Promise((resolve) => {
      this.closePool = resolve;
      this.tasksNumber = this.taskQueue.length;
      this.resultArray = new Array(this.tasksNumber); // 初始化结果存储
      this.createTaskIndex(); //记录好每个task的位置，因为线程的操作是无序的
      for (const [worker] of this.workersPool) {
        this.runNextTask(worker);
      }
    });
  }
  addToTaskQueue(task: POOL_TASK): void {
    this.taskQueue.push(task);
  }
  createTaskIndex() {
    this.taskIndexMap = new Map(
      this.taskQueue.map((task, index) => [task, index]),
    );
  }
  addToResult(data: RESULT_TYPE | null, worker: threads.Worker) {
    this.tasksNumber--;
    const task = this.workersPool.get(worker);
    const index = this.taskIndexMap.get(task);
    this.resultArray[index] = data;
  }
}
