import { MODULE_INFO_TYPE, POOL_TASK } from "./type";

export default class Pool {
  private readonly pool: Set<POOL_TASK> = new Set<POOL_TASK>();
  private resultArray: MODULE_INFO_TYPE[] = [];
  private taskQueue: POOL_TASK[] = [];
  private closePool: (value: MODULE_INFO_TYPE[]) => void;
  constructor(private readonly maxPoolSize: number) {}
  addToPool(poolTask: POOL_TASK) {
    this.pool.add(poolTask); //加入池子
    poolTask().then((moduleInfo) => {
      this.resultArray.push(moduleInfo);
      this.pool.delete(poolTask); //任务执行完毕
      if (this.taskQueue.length !== 0) {
        this.addToPool(this.taskQueue.shift()); //加入新的任务
      } else {
        this.close(); //尝试关闭
      }
    });
  }
  ifOver() {
    return this.pool.size >= this.maxPoolSize;
  }
  run(): Promise<MODULE_INFO_TYPE[]> {
    this.resultArray = [];
    return new Promise((resolve) => {
      this.closePool = resolve;
      while (!this.ifOver() && this.taskQueue.length !== 0) {
        this.addToPool(this.taskQueue.shift()); //先将池子装满
      }
      this.close(); //若任务队列无任务，直接关闭
    });
  }
  addToTaskQueue(PoolTask: POOL_TASK) {
    this.taskQueue.push(PoolTask);
  }
  close() {
    if (this.pool.size === 0 && this.taskQueue.length === 0) {
      this.closePool(this.resultArray);
    }
  }
}
