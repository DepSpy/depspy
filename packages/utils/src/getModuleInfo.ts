import {
  INFO_TYPES,
  GITHUB_DOMAIN,
  NPM_Name_Regex,
  MODULE_INFO_TYPE,
  Package_TYPE,
  MODULE_INFO,
  // JSDELIVR_API,
  NPM_DOMAIN,
} from "./constant";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import rf from "resolve-from";
const inBrowser = typeof window !== "undefined";
//给定想要获取模块的info，输出指定模块的详情
export default async function getModuleInfo(
  info: string = "",
  baseDir: string,
  online: boolean = false,
): Promise<MODULE_INFO_TYPE> {
  let pak: Package_TYPE;
  switch (transformInfo(info)) {
    case INFO_TYPES.GITHUB:
    case INFO_TYPES.NPM:
      pak = inBrowser
        ? await getNpmOnlineInfo(info!)
        : online
        ? await getNpmOnlineInfo(info!)
        : await getNpmLocalInfo(info!, baseDir);
      break;
    case INFO_TYPES.JSON:
      pak = JSON.parse(info!);
      break;
    default:
      if (inBrowser) throw new Error("invalid parameter");
      pak = getRootInfo();
  }
  return transformPackage(pak);
}
//获取根目录的package.json信息
function getRootInfo() {
  const pkg = getPkgByPath(path.join(process.cwd(), "package.json"));
  pkg.resolvePath = process.cwd();
  return pkg;
}
//获取npm提供的package.json信息
async function getNpmOnlineInfo(packageName: string) {
  // const url = `${JSDELIVR_API}/${packageName}/package.json`;
  // return await axios.get(url).then((res) => res.data);
  const url = `${NPM_DOMAIN}/${packageName}/latest`;
  return await axios.get(url).then((res) => res.data);
}
//获取本地某模块的package.json信息
async function getNpmLocalInfo(info: string, baseDir: string) {
  const pkgResolvePath = getPkgResolvePath(info, baseDir);
  const pkg = getPkgByPath(pkgResolvePath);
  pkg.size = getDirSize(pkgResolvePath, ["node_modules"]);
  pkg.resolvePath = path.dirname(pkgResolvePath);
  return pkg;
}
//读取文件夹的总大小
function getDirSize(directory: string, ignoreFiles: string[] = []): number {
  const dirStats = fs.statSync(directory);
  if (!dirStats.isDirectory()) directory = path.dirname(directory);
  let totalSize = 0;
  const dirContent = fs.readdirSync(directory);
  for (let i = 0; i < dirContent.length; i++) {
    if (ignoreFiles.includes(dirContent[i])) continue;
    const filePath = path.join(directory, dirContent[i]);
    const fileStats = fs.statSync(filePath);
    if (fileStats.isDirectory()) {
      totalSize += getDirSize(filePath, ignoreFiles); // 如果是目录，则递归调用
    } else {
      totalSize += fileStats.size;
    }
  }
  return totalSize;
}
//找到info的绝对路径,返回其package.json路径
function getPkgResolvePath(info: string, baseDir: string) {
  let actualPath = "";

  if (isPnpm()) {
    actualPath = resolve(info, baseDir);
    info = path.join(info, "package.json");
    if (baseDir) {
      let basedir = path.resolve(
        process.cwd(),
        "node_modules",
        ".pnpm",
        baseDir,
      );
      try {
        actualPath = rf(basedir, info);
      } catch {
        basedir = path.resolve(process.cwd(), "node_modules", ".pnpm");
        actualPath = rf(basedir, info);
      }
    } else {
      const basedir = path.resolve(process.cwd(), "node_modules");
      actualPath = rf(basedir, info);
    }
  } else {
    actualPath = resolve(info, baseDir);
  }
  return actualPath;
}
//实现npm模块查找机制，但是只查找package.json
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
//判断是不是pnpm
function isPnpm(): boolean {
  const pnpmCachePath = path.resolve(process.cwd(), "node_modules", ".pnpm");
  return fs.existsSync(pnpmCachePath);
}
// 选出需要的数据
function transformPackage(pkg: Package_TYPE): MODULE_INFO_TYPE {
  const result = {};
  MODULE_INFO.forEach((key) => {
    if (pkg[key]) result[key] = pkg[key];
  });
  return result as MODULE_INFO_TYPE;
}
// 判断info信息来源类型
function transformInfo(info?: string): INFO_TYPES {
  info = info?.trim();
  if (!info) return INFO_TYPES.ROOT;
  if (info.startsWith(GITHUB_DOMAIN)) {
    return INFO_TYPES.GITHUB;
  } else if (info.startsWith("{")) {
    return INFO_TYPES.JSON;
  } else if (NPM_Name_Regex.test(info)) {
    return INFO_TYPES.NPM;
  }
  throw new Error("Invalid info type");
}
//获取json文件的对象
function getPkgByPath(path: string): Package_TYPE {
  const info = fs.readFileSync(path, "utf8");
  return JSON.parse(info);
}
