import { Response } from "express";
import { Node } from "@dep-spy/core";
import { compose, toInfinity, limitDepth, jsonsToBuffer } from "@dep-spy/utils";
import fs from "fs";
import path from "path";
import { staticPath } from "@dep-spy/view";

export function successHandler(res: Response, data: unknown) {
  res.send({
    message: "success",
    data,
  });
}

export function bufferHandler(res: Response, buffer: Buffer) {
  res.set("Content-Type", "application/octet-stream");
  res.send(buffer);
}

export function errorHandler(res: Response, data: unknown) {
  console.error(data);
  res.send({
    message: "fail",
    data,
  });
}

//生产json数组
export function generateNodeJsons(nodes: Node[]) {
  const nodeJsons = nodes.map((node) => {
    return JSON.stringify(
      node,
      compose([toInfinity, limitDepth], {
        depth: node.path.length,
      }),
    );
  });
  return nodeJsons;
}

export function nodesToBuffer(nodes: Node[]) {
  const nodeJsons = generateNodeJsons(nodes);
  return jsonsToBuffer(nodeJsons);
}
export function addLogFile(std:string){
  const filePath = path.join(staticPath,"log.txt");
  fs.writeFileSync(filePath,std);
}