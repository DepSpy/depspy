import { Node, Config } from "./constant";
import { Graph } from "./graph";
import * as fs from "fs";
import * as path from "path";
const inBrowser = typeof window !== "undefined";
export async function generateGraph(): Promise<Node>;
export async function generateGraph(info: string): Promise<Node>;
export async function generateGraph(config: Config): Promise<Node>;
export async function generateGraph(
  info: string,
  config: Config,
): Promise<Node>;
export async function generateGraph(
  info?: string | Config,
  config: Config = {},
): Promise<Node> {
  let result: Node | null = null;
  //实现各种重载
  if (!info) {
    result = await new Graph("").output();
  } else if (typeof info == "object") {
    result = await new Graph("", info).output();
  } else if (typeof info == "string") {
    result = await new Graph(info, config).output();
  }
  //是否写入文件
  if (result && !inBrowser) {
    if (typeof info == "object" && info.outDir) {
      writeJson(result, info.outDir);
    }
    if (config.outDir) {
      writeJson(result, config.outDir);
    }
  }
  if (result) return result;
  //参数错误
  throw new Error(`Invalid parameters ${info}-${config}`);
}
function writeJson(result: Node, outDir: string) {
  fs.writeFileSync(path.join(process.cwd(), outDir), JSON.stringify(result), {
    flag: "w",
  });
}
