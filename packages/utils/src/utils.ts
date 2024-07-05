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
function resolve(name: string, baseDir: string) {
  const currentDir = path.join(baseDir, "node_modules");
  if (fs.existsSync(currentDir)) {
    //在当前目录下尝试寻找
    const optionPath = path.join(baseDir, "node_modules", name);
    if (fs.existsSync(optionPath)) {
      return optionPath;
    }
  }
  const root = process.cwd();
  if (root != baseDir) {
    baseDir = path.join(baseDir, "../");
    return resolve(name, baseDir);
  }
  throw new Error(`Cannot find module '${name}' from '${baseDir}'`);
}

//处理linkPath到最近的node_modules
function transformLinkToBase(linkPath: string) {
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
  const pnpmCachePath = path.resolve(process.cwd(), "node_modules", ".pnpm");
  return fs.existsSync(pnpmCachePath);
}

// macOS 系统下读取软连接的绝对路径
function getAbsoluteLinkTarget(linkPath = "") {
  try {
    const relativeTarget = fs.readlinkSync(linkPath);
    const absoluteTarget = path.resolve(path.dirname(linkPath), relativeTarget);
    return absoluteTarget;
  } catch (error) {
    throw new Error("Error reading or resolving symlink: " + error.message);
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
