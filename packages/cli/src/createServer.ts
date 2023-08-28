import type { Graph, Config } from "@dep-spy/core";
import { generateGraph } from "@dep-spy/core";
import { staticPath } from "@dep-spy/view";
import path from "path";
import express from "express";
import ws from "ws";
import { blueBright, green } from "chalk";
import chokidar from "chokidar";
import { readFile } from "fs";

const root = path.join(staticPath, "vite");
const pkgRoot = path.join(process.cwd(), "package.json");

export function createServer(graph: Graph, option: Config) {
  createWs(graph, option);
  const app = express();
  app.use(express.static(root));
  app.get("*", (_, res) => {
    res.sendFile(path.join(root, "index.html"));
  });

  app.listen(2023, () => {
    console.log(green("服务器启动成功:"), blueBright("http://localhost:2023"));
  });
}

function createWs(graph: Graph, option: Config) {
  const wss = new ws.Server({ port: 822 });
  wss.on("connection", async function (ws) {
    ws.send(formatMes("init", await combineRes(graph, option)));
    ws.addEventListener("message", async (mes) => {
      const wsData = JSON.parse(mes.data as string);
      if (wsData.type === "size") {
        const graph = generateGraph("", {
          ...option,
          size: true,
          depth: Number(wsData.newDepth),
        });
        ws.send(formatMes("size", await combineRes(graph)));
      } else if (wsData.type === "depth") {
        const graph = generateGraph("", {
          ...option,
          depth: Number(wsData.newDepth),
        });
        ws.send(formatMes("update", await combineRes(graph, option)));
      }
      // 项目根目录下的 ppackage.json 发生变化时，重新生成依赖图
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
    });
  });
}

async function combineRes(graph: Graph, option: Config = {}) {
  await graph.ensureGraph();
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
