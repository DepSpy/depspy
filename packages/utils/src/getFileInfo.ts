import fs from "fs";
import * as nodePath from "path";
import { default as traverse } from "@babel/traverse";
import toBabel from "swc-to-babel";
import * as swc from "@swc/core";
import * as tsPaths from "tsconfig-paths";
import { suffixOrder } from "./constant";
import { CODE_INFO, PATH_TYPE } from "./type";
import { findParentDirectory, getPkgResolvePath, isFile } from "./utils";

const inBrowser = typeof window !== "undefined";
let cwd;
let first = true;
//获取tsconfig配置
let tsConfig;
//匹配函数
let matchPath;
//避免浏览器引入报错
if (!inBrowser) {
  cwd = process.cwd();
  tsConfig = tsPaths.loadConfig(cwd);
  matchPath = tsPaths.createMatchPath(
    tsConfig["absoluteBaseUrl"],
    tsConfig["paths"],
  );
}
//兼容不同类型的path并返回关键信息
export default function getFileInfo(path: string, baseDir: string = cwd) {
  //调整根据参数调整tsconfig的位置，且避免多次创建
  if (cwd !== baseDir && first) {
    tsConfig = tsPaths.loadConfig(baseDir);
    matchPath = tsPaths.createMatchPath(
      tsConfig["absoluteBaseUrl"],
      tsConfig["paths"],
    );
    first = false;
  }
  const [pathType, extra] = getPathType(path, baseDir);
  let resolvedPath = ""; //em: ./add , ./utils , ./
  if (pathType === PATH_TYPE.RELATIVE) {
    resolvedPath = nodePath.resolve(baseDir, path);
  } else if (pathType === PATH_TYPE.RESOLVE) {
    resolvedPath = path;
  } else if (pathType === PATH_TYPE.BARE) {
    //三方包就此截❌（这里暂时是文件夹路径）
    return {
      path,
      resolvedPath: extra,
      baseDir: findParentDirectory(extra),
      ...getCodeInfo(""),
    };
  } else if (pathType === PATH_TYPE.ALIAS) {
    resolvedPath = extra;
  } else if (pathType === PATH_TYPE.UNKNOWN) {
    return {
      path,
      resolvedPath: "",
      baseDir: "",
      ...getCodeInfo(""),
    };
  }

  try {
    resolvedPath = autoCompletePath(resolvedPath);
    const code = fs.readFileSync(resolvedPath).toString();
    return {
      path,
      resolvedPath,
      baseDir: findParentDirectory(resolvedPath),
      ...getCodeInfo(code),
    };
  } catch (e) {
    //保底操作，如果文件路径不存在则报错
    throw new Error(`${path} - ${resolvedPath} not found`);
  }
}

//模拟文件名补全
function autoCompletePath(resolvePath: string) {
  if (isFile(resolvePath)) {
    return resolvePath;
  }
  for (let i = 0; i < suffixOrder.length; i++) {
    const filePath = nodePath.resolve(resolvePath, `index${suffixOrder[i]}`);
    const filePath2 = `${resolvePath}${suffixOrder[i]}`;

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
    ast = swc.parseSync(code, {
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
function getPathType(path: string, baseDir: string) {
  if (path.startsWith(".")) {
    return [PATH_TYPE.RELATIVE] as const;
  }
  if (path.startsWith("/") || path.match(/^\w:/)) {
    return [PATH_TYPE.RESOLVE] as const;
  }

  try {
    //别名判断
    if (isAliasPath(path, tsConfig["paths"])) {
      const resolvePath = matchPath(path, undefined, () => true, suffixOrder);
      return [PATH_TYPE.ALIAS, resolvePath] as const;
    }

    //三方包判断，如果包不存在会报错
    const resolvePath = getPkgResolvePath(path, baseDir)[1];
    return [PATH_TYPE.BARE, resolvePath] as const;
  } catch {
    return [PATH_TYPE.UNKNOWN] as const;
  }
}
function isAliasPath(path: string, paths: Record<string, string[]>): boolean {
  for (const alias of Object.keys(paths)) {
    // 将别名中的 * 替换为匹配任意字符的正则表达式
    const regex = new RegExp("^" + alias.replace(/\*$/, ".*"));
    if (regex.test(path)) {
      return true;
    }
  }

  return false;
}
