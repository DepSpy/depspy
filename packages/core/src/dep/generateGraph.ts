import { defaultConfig, HOST_MAX_FETCH_NUMBER, NPM_DOMAINS } from "../constant";
import { Config } from "../type";
import { Graph } from "./graph";
import {
  MODULE_INFO_TYPE,
  Pool,
  useGetModuleInfo,
  OnlineWorker,
  OffLineWorker,
} from "@dep-spy/utils";
import os from "os";
import path from "path";
const inBrowser = typeof window !== "undefined";

const pool = new Pool<[string, string], MODULE_INFO_TYPE>(
  os.cpus ? os.cpus().length : NPM_DOMAINS.length * HOST_MAX_FETCH_NUMBER,
  (freeWorkers, taskQueue, index) => {
    if (inBrowser) {
      const getModuleInfo = useGetModuleInfo(
        NPM_DOMAINS[Math.floor(index % NPM_DOMAINS.length)], //均匀排列每个域名worker
      );
      return new OnlineWorker(
        getModuleInfo,
        freeWorkers as OnlineWorker<[string, string], MODULE_INFO_TYPE>[],
        taskQueue,
      );
    }
    return new OffLineWorker(
      path.join(__dirname, "./dep/moduleInfoWorker.js"),
      freeWorkers as OffLineWorker<[string, string], MODULE_INFO_TYPE>[],
      taskQueue,
    );
  },
);
export function generateGraph(
  info: string,
  config: Config = defaultConfig,
): Graph {
  let graph: Graph;
  // 本地模式，info 为 ""
  if (!info) {
    graph = new Graph("", config, pool);
  } else {
    // 线上模式：1. info = "react" 2. info = package.json 的内容
    graph = new Graph(info, config, pool);
  }
  return graph;
}
