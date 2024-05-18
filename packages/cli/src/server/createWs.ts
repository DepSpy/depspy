import type { Graph, Config } from "@dep-spy/core";
import { generateGraph } from "@dep-spy/core";
import ws from "ws";
import { green } from "chalk";
import chokidar from "chokidar";
import { readFile } from "fs";
import path from "path";
import { Worker } from "worker_threads";
import { EventBus } from "./eventBus";

const pkgRoot = path.join(process.cwd(), "package.json");

export function createWs(graph: Graph, option: Config) {
  const wss = new ws.Server({ port: 1822 });
  wss.on("connection", async function (ws) {
    initGraph(graph, option, ws); //初始化依赖图
    initStaticGraph(option, ws); //初始化静态代码依赖图
    ws.addEventListener("message", async (mes) => {
      const wsData = JSON.parse(mes.data as string);
      EventBus[wsData.type](wsData, option, ws);
    });
    ws.on("close", () => {
      ws.close();
    });
    //热更新
    HMR(option, ws);
  });
}
async function initGraph(graph: Graph, option: Config, ws: ws) {
  ws.send(formatMes("init", await combineRes(graph, option)));
}

async function initStaticGraph(option: Config, ws: ws) {
  if (option.entry) {
    const worker = new Worker(path.resolve(__dirname, "./server/worker.js"), {
      workerData: {
        config: option,
      },
    });
    worker.on("message", (data) => {
      ws.send(formatMes("initStatic", JSON.parse(data)));
    });
  }
}

async function combineRes(graph: Graph, option: Config = {}) {
  return JSON.stringify({
    root: await graph.getGraph(),
    codependency: await graph.getCodependency(),
    circularDependency: await graph.getCircularDependency(),
    ...option,
  });
}

function formatMes(type: string, data: unknown) {
  return JSON.stringify({ type, data });
}

function analysePkgInfo(data) {
  const { dependencies, name, version, description } = JSON.parse(data);
  return JSON.stringify({
    dependencies,
    name,
    version,
    description,
  });
}

function HMR(option: Config, ws: ws) {
  // 项目根目录下的 package.json 发生变化时，重新生成依赖图
  let prePkgJSON = null;
  readFile(pkgRoot, "utf-8", async (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    prePkgJSON = analysePkgInfo(data);
  });
  chokidar.watch(pkgRoot).on("change", async () => {
    // 读取 package.json 中的 dependencies
    readFile(pkgRoot, "utf-8", async (err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      const newPkgJSON = analysePkgInfo(data);
      if (newPkgJSON !== prePkgJSON) {
        prePkgJSON = newPkgJSON;
        const graph = generateGraph("", option);
        ws.send(formatMes("update", await combineRes(graph, option)));
        console.log(green("实时更新成功"));
      }
    });
  });
}
