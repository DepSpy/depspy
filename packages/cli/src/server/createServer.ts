import type { Graph, Config } from "@dep-spy/core";
import { staticPath } from "@dep-spy/view";
import path from "path";
import express from "express";
import { blueBright, green } from "chalk";
import { createWs } from "./createWs";

const root = path.join(staticPath, "online");

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
