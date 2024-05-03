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
      linkPath = getAbsoluteLinkTarget(
        path.resolve(baseDir, "node_modules", info),
      );
    } else {
      linkPath = fs.readlinkSync(path.resolve(baseDir, "node_modules", info));
    }

    actualPath = path.resolve(linkPath, "package.json");
    baseNext = transformLinkToBase(linkPath);
  } else {
    actualPath = resolve(info, baseDir);
    baseNext = path.dirname(actualPath);
  }
  return [actualPath, baseNext];
}

//实现npm依赖冒泡查找机制，但是只查找package.json
function resolve(name: string, baseDir: string) {
  const currentDir = path.join(baseDir, "node_modules");
  if (fs.existsSync(currentDir)) {
    //在当前目录下尝试寻找
    const optionPath = path.join(baseDir, "node_modules", name, "package.json");
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

export function isDirectory(path: string) {
  return fs.statSync(path).isDirectory();
}
