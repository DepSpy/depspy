import type { Graph, Config } from "@dep-spy/core";
import { generateGraph } from "@dep-spy/core";
import { staticPath } from "@dep-spy/view";
import path from "path";
import express from "express";
import ws from "ws";
import { blueBright, green } from "chalk";

const root = path.join(staticPath, "vite");

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
        setTimeout(async () => {
          ws.send(formatMes("size", await combineRes(graph)));
        }, 5000);
      } else if (wsData.type === "depth") {
        const graph = generateGraph("", {
          ...option,
          depth: Number(wsData.newDepth),
        });
        ws.send(formatMes("update", await combineRes(graph, option)));
      }
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
