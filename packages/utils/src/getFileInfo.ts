import fs from "fs";
import { resolve } from "path";
import { CODE_INFO, PATH_TYPE } from "./type";
import getModuleInfo from "./getModuleInfo";
import traverse from "@babel/traverse";
import toBabel from "swc-to-babel";
import swc from "@swc/core";

//兼容不同类型的path并返回关键信息
export async function getFileInfo(path: string, cwd: string) {
  const pathType = await getPathType(path);
  let resolvedPath = "";
  if (pathType === PATH_TYPE.Relative) {
    resolvedPath = resolve(cwd, path);
  } else if (pathType === PATH_TYPE.Resolve) {
    resolvedPath = path;
  } else if (pathType === PATH_TYPE.BARE) {
  } else if (pathType === PATH_TYPE.ALIAS) {
  } else {
    throw new Error("Unsupported path type");
  }
  const code = fs.readFileSync(resolvedPath).toString();
  return getCodeInfo(code);
}

//解析代码并返回AST的关键信息
async function getCodeInfo(code: string) {
  const ast = swc.parseSync(code, {
    syntax: "typescript",
    tsx: true,
  });
  const babelAst = toBabel(ast);
  const result: CODE_INFO = {
    imports: [],
    exports: [],
  };
  traverse.default(babelAst, {
    ImportDeclaration(path) {
      result.imports.push(path.node.source.value);
    },
    ExportNamedDeclaration(path) {
      result.exports.push(path.node.source.value);
    },
  });
  return result;
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
