import type { Graph, Config } from "@dep-spy/core";
import { staticPath } from "@dep-spy/view";
import path from "path";
import express from "express";
import { blueBright, green } from "chalk";
import { createHttp } from "./createHttp";

const root = path.join(staticPath, "vite");

export function createServer(graph: Graph, option: Config) {
  // createWs(graph, option);
  const app = express();
  createHttp(app, graph);
  app.use(express.static(root));
  app.get("*", (_, res) => {
    res.sendFile(path.join(root, "index.html"));
  });

  //携带初始化的depth信息
  const depth = option.depth ?? 3;
  const port = 2023;
  const url = `http://localhost:${2023}/analyze?depth=${depth}`;

  app.listen(port, () => {
    console.log(green("服务器启动成功:"), blueBright(url));
  });
}
