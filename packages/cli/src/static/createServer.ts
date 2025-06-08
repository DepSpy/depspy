import { staticPath } from "@dep-spy/view";
import path from "path";
import express from "express";
import { blueBright, green } from "chalk";
import { createHttp } from "./createHttp";
import { MODE } from "../constants";

const root = path.join(staticPath, MODE.OFFLINE);
const port = 2023;
const url = `http://localhost:${port}/static-analyze`;

// 注入模式下，静态资源目录
const injectRoot = path.join(staticPath, MODE.INJECT);

export function createServer() {
  const app = express();
  createHttp(app);
  app.use(express.static(root));
  app.get("*", (_, res) => {
    res.sendFile(path.join(root, "index.html"));
  });
  app.listen(port);
}
export function outPutUrl() {
  console.log(green("服务器启动成功:"), blueBright(url));
}

export function outPutPath() {
  console.log(green("静态资源目录:"), blueBright(injectRoot));
}
