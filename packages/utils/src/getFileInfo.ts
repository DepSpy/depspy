import fs from "fs";
import { resolve } from "path";
import { default as traverse } from "@babel/traverse";
import toBabel from "swc-to-babel";
import swc, { parseSync } from "@swc/core";

import { loadConfig, createMatchPath } from "tsconfig-paths";
import { suffixOrder } from "./constant";
import { CODE_INFO, PATH_TYPE } from "./type";
import { getPkgResolvePath, isDirectory } from "./utils";

//获取tsconfig配置
const tsConfig = loadConfig(process.cwd());
//匹配函数
const matchPath = createMatchPath(
  tsConfig["absoluteBaseUrl"],
  tsConfig["paths"],
);
console.log(getFileInfo("./packages/view/src/App.tsx"));
//兼容不同类型的path并返回关键信息
export default function getFileInfo(
  path: string,
  baseDir: string = process.cwd(),
) {
  const [pathType, extra] = getPathType(path);
  let resolvedPath = ""; //em: ./add , ./utils , ./
  if (pathType === PATH_TYPE.RELATIVE) {
    resolvedPath = resolve(baseDir, path);
  } else if (pathType === PATH_TYPE.RESOLVE) {
    resolvedPath = path;
  } else if (pathType === PATH_TYPE.BARE) {
    //三方包就此截❌（这里暂时是文件夹路径）
    return {
      path,
      resolvedPath: extra,
      ...getCodeInfo(""),
    };
  } else if (pathType === PATH_TYPE.ALIAS) {
    resolvedPath = extra;
  } else if (pathType === PATH_TYPE.UNKNOWN) {
    throw new Error(
      `Unsupported path type, path: ${path}, baseDir: ${baseDir}`,
    );
  }

  try {
    resolvedPath = autoCompletePath(resolvedPath);
    const code = fs.readFileSync(resolvedPath).toString();
    return {
      path,
      resolvedPath,
      ...getCodeInfo(code),
    };
  } catch (e) {
    //保底操作，如果文件路径不存在则报错
    console.log(11, e);
    throw new Error(`${path} - ${resolvedPath} not found`);
  }
}

//模拟文件名补全
function autoCompletePath(resolvePath: string) {
  if (!isDirectory(resolvePath)) {
    return resolvePath;
  }
  for (let i = 0; i < suffixOrder.length; i++) {
    const filePath = resolve(resolvePath, `index.${suffixOrder[i]}`);
    const filePath2 = resolve(resolvePath, `.${suffixOrder[i]}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    if (fs.existsSync(filePath2)) {
      return filePath2;
    }
  }

  return resolvePath;
}

//解析代码并返回AST的关键信息
function getCodeInfo(code: string) {
  let ast: swc.Module;
  const result: CODE_INFO = {
    imports: [],
    exports: [],
  };
  try {
    ast = parseSync(code, {
      syntax: "typescript",
      tsx: true,
    });
  } catch (e) {
    return result;
  }
  const babelAst = toBabel(ast);

  traverse(babelAst, {
    ImportDeclaration(path) {
      result.imports.push(path.node.source.value);
    },
  });
  return result;
}

//判断path的类型(为了避免外层多次计算，返回类型的同时也返回必要参数)
function getPathType(path: string) {
  if (path.startsWith(".")) {
    return [PATH_TYPE.RELATIVE] as const;
  }
  if (path.startsWith("/") || path.match(/^\w:/)) {
    return [PATH_TYPE.RESOLVE] as const;
  }

  try {
    //如果包不存在会报错，可能是别名路径
    const resolvePath = getPkgResolvePath(path, process.cwd())[1];
    return [PATH_TYPE.BARE, resolvePath] as const;
  } catch {
    const resolvePath = matchPath(path, undefined, () => true, suffixOrder);
    if (resolvePath) {
      return [PATH_TYPE.ALIAS, resolvePath] as const;
    }
  }
  return [PATH_TYPE.UNKNOWN] as const;
}
