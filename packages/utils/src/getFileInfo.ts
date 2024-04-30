import fs from "fs";
import { resolve } from "path";
import { PATH_TYPE } from "./type";
import getModuleInfo from "./getModuleInfo";
import { readFileSync } from "fs";

export async function getFileInfo(path: string, cwd: string) {
  const pathType = await getPathType(path);
  if (pathType === PATH_TYPE.Relative) {
    const resolvedPath = resolve(cwd, path);
    const code = fs.readFileSync(resolvedPath).toString();
    console.log(code);
  } else {
  }
}
//判断path的类型
async function getPathType(path: string) {
  if (path.startsWith(".")) {
    return PATH_TYPE.Relative;
  }
  if (path.startsWith("/")) {
    return PATH_TYPE.Resolve;
  }
  const module = await getModuleInfo(path, { baseDir: process.cwd() });
  if (module.name) {
    return PATH_TYPE.BARE;
  }
  return PATH_TYPE.ALIAS;
}

// // getFileInfo("./packages/core/src/dep/constant.ts", process.cwd());

const swc = require("@swc/core");
const toBabel = require("swc-to-babel");
const traverse = require("@babel/traverse").default;
const parser = require("@babel/parser");
const start = Date.now();
const ast = toBabel(
  swc.parseSync(readFileSync("./packages/core/src/dep/index.js").toString()),
);
console.log(Date.now() - start);
require("@babel/parser").parse(
  readFileSync("./packages/core/src/dep/index.js").toString(),
  {
    sourceType: "module",
  },
);
console.log(Date.now() - start);
