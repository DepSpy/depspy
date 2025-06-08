import type { Graph, Config } from "@dep-spy/core";
import { staticPath } from "@dep-spy/view";
import path from "path";
import express from "express";
import { blueBright, green } from "chalk";
import { createHttp } from "./createHttp";
import { MODE } from "../constants";

const mode: MODE = MODE.OFFLINE;

const root = path.join(staticPath, mode);

export function createServer(graph: Graph, option: Config) {
  const app = express();
  app.use(express.raw({ type: "application/octet-stream" }));

  createHttp(app, graph);
  app.use(express.static(root));
  app.get("*", (_, res) => {
    res.sendFile(path.join(root, "index.html"));
  });

  //携带初始化的depth信息
  const depth = option.depth ?? 3;
  const port = 2023;
  let url;

  if (mode === MODE.OFFLINE) {
    url = `http://localhost:${port}/analyze?depth=${depth}`;
  }

  if (mode === MODE.ONLINE) {
    url = `http://localhost:${port}/search`;
  }

  app.listen(port, () => {
    console.log(green("服务器启动成功:"), blueBright(url));
  });
}
