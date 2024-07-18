import * as fs from "fs";
import * as path from "path";

//找包的绝对路径,返回其package.json路径
export function getPkgResolvePath(info: string, baseDir: string) {
  let actualPath = "";
  let baseNext = "";
  if (isPnpm()) {
    let linkPath = "";
    // 如果是 macOS 系统
    if (process.platform === "darwin") {
      linkPath = getAbsoluteLinkTarget(resolve(info, baseDir));
    } else {
      linkPath = fs.readlinkSync(resolve(info, baseDir));
    }
    actualPath = path.resolve(linkPath, "package.json");
    baseNext = transformLinkToBase(linkPath);
  } else {
    actualPath = path.join(resolve(info, baseDir), "package.json");
    baseNext = path.dirname(actualPath);
  }
  return [actualPath, baseNext];
}

//实现npm依赖冒泡查找机制,返回其根路径
function resolve(name: string, firstDir: string) {
  for (
    let currentDir = firstDir, nexDir = path.join(firstDir, "..");
    currentDir !== nexDir;
    currentDir = nexDir, nexDir = path.join(currentDir, "..")
  ) {
    const baseDir = path.join(currentDir, "node_modules");
    if (fs.existsSync(baseDir)) {
      //在当前目录下尝试寻找
      const optionPath = path.join(currentDir, "node_modules", name);
      if (fs.existsSync(optionPath)) {
        return optionPath;
      }
    }
  }
  //到达顶层依旧未搜索到结果
  throw new Error(`Cannot find module '${name}' from '${firstDir}'`);
}

//处理linkPath到最近的node_modules
function transformLinkToBase(linkPath: string) {
  // monorepo子包之间的相互依赖（linkPath不包含node_modules,例如/Users/***/depspy/packages/core）
  if (!linkPath.includes("node_modules")) {
    return linkPath;
  }
  const splitPath = linkPath.split(path.sep);
  for (let i = splitPath.length - 1; i >= 0; i--) {
    if (splitPath[i] === "node_modules") {
      splitPath.pop();
      break;
    }
    splitPath.pop();
  }
  return splitPath.join(path.sep);
}

//判断是不是pnpm
function isPnpm(): boolean {
  //冒泡查找.pnpm文件夹（为适配monorepo的子包）
  for (
    let currentDir = process.cwd(), nextDir = path.join(currentDir, "..");
    currentDir !== nextDir;
    currentDir = nextDir, nextDir = path.join(currentDir, "..")
  ) {
    const pnpmCachePath = path.resolve(currentDir, "node_modules", ".pnpm");
    if (fs.existsSync(pnpmCachePath)) {
      return true;
    }
  }
  return false;
}

// macOS 系统下读取软连接的绝对路径
function getAbsoluteLinkTarget(linkPath = "") {
  try {
    const relativeTarget = fs.readlinkSync(linkPath);
    const absoluteTarget = path.resolve(path.dirname(linkPath), relativeTarget);
    return absoluteTarget;
  } catch (error) {
    //如果linkpath不是软连接，直接返回当前路径
    return linkPath;
  }
}
//获取json文件的对象格式
export function getPkgByPath<T>(path: string): T {
  const info = fs.readFileSync(path, "utf8");
  return JSON.parse(info);
}

export function isFile(path: string) {
  if (!fs.existsSync(path)) {
    return false;
  }
  return !fs.statSync(path).isDirectory();
}

export function findParentDirectory(filePath: string) {
  // 使用 path.dirname() 方法获取文件路径的父文件夹路径
  try {
    if (fs.statSync(filePath).isDirectory()) {
      return filePath;
    } else {
      return path.dirname(filePath);
    }
  } catch {
    return filePath;
  }
}
