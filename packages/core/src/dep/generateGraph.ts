import { defaultConfig, HOST_MAX_FETCH_NUMBER, NPM_DOMAINS } from "../constant";
import { Config } from "../type";
import { Graph } from "./graph";
import Pool, { OnlineWorker, OffLineWorker } from "../pool";
import os from "os";
import path from "path";
import { getModuleInfo, MODULE_INFO_TYPE } from "@dep-spy/utils";
const inBrowser = typeof window !== "undefined";

const pool = new Pool<[string, string], MODULE_INFO_TYPE>(
  os.cpus ? os.cpus().length : NPM_DOMAINS.length * HOST_MAX_FETCH_NUMBER,
  (index: number) => {
    const url = NPM_DOMAINS[Math.floor(index % NPM_DOMAINS.length)];
    function getModuleInfoByDomains(...args: [string, string]) {
      return getModuleInfo(...args, url);
    }
    if (inBrowser) {
      return new OnlineWorker(getModuleInfoByDomains);
    }
    return new OffLineWorker(path.join(__dirname, "./dep/moduleInfoWorker.js"));
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
