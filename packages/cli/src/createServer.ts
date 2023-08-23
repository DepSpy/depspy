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
    ws.send(await combineRes(graph));
    ws.addEventListener("message", async (mes) => {
      const graph = generateGraph("", { ...option, depth: Number(mes.data) });
      ws.send(await combineRes(graph));
    });
  });
}
async function combineRes(graph: Graph) {
  await graph.ensureGraph();
  return JSON.stringify({
    root: await graph.getGraph(),
    codependency: await graph.getCodependency(),
    circularDependency: await graph.getCircularDependency(),
  });
}
