import {
  INFO_TYPES,
  GITHUB_DOMAIN,
  NPM_Name_Regex,
  MODULE_INFO_TYPE,
  Package_TYPE,
  MODULE_INFO,
  NPM_DOMAIN,
  CONFIG,
} from "./constant";
import * as fs from "fs";
import * as path from "path";
const inBrowser = typeof window !== "undefined";
//给定想要获取模块的info，输出指定模块的详情
export default async function getModuleInfo(
  info: string = "",
  config: CONFIG = {},
): Promise<MODULE_INFO_TYPE> {
  const { size, baseDir } = config;
  let pak: Package_TYPE;
  switch (transformInfo(info)) {
    case INFO_TYPES.GITHUB:
    case INFO_TYPES.NPM: {
      pak = inBrowser
        ? await getNpmOnlineInfo(info!)
        : await getNpmLocalInfo(info!, baseDir, size);
      break;
    }
    case INFO_TYPES.JSON:
      pak = JSON.parse(info!);
      break;
    default:
      if (inBrowser) throw new Error("invalid parameter");
      pak = getRootInfo();
  }
  return transformPackage(pak);
}
//获取根目录的package.json信息🌳
function getRootInfo() {
  const pkg = getPkgByPath(path.join(process.cwd(), "package.json"));
  pkg.resolvePath = process.cwd();
  return pkg;
}
//获取npm提供的package.json信息🌐
async function getNpmOnlineInfo(packageName: string) {
  let url: string;
  if (packageName.endsWith("$")) {
    // 去掉所有的 $ 符号
    packageName = packageName.replace(/\$/g, "");
    url = `${NPM_DOMAIN}/${packageName}`;
  } else {
    url = `${NPM_DOMAIN}/${packageName}/latest`;
  }
  return await fetch(url).then((res) => res.json());
}
//获取本地某模块的package.json信息💻
async function getNpmLocalInfo(info: string, baseDir: string, size: boolean) {
  const [actualPath, baseNext] = getPkgResolvePath(info, baseDir);
  const pkg = getPkgByPath(actualPath);
  if (size) pkg.size = getDirSize(actualPath, ["node_modules"]);
  pkg.resolvePath = baseNext;
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
//判断是不是pnpm
function isPnpm(): boolean {
  const pnpmCachePath = path.resolve(process.cwd(), "node_modules", ".pnpm");
  return fs.existsSync(pnpmCachePath);
}
// 选出需要的数据
function transformPackage(pkg: Package_TYPE): MODULE_INFO_TYPE {
  const online = typeof window !== "undefined";
  const result = {};
  MODULE_INFO.forEach((key) => {
    // 对于本地命令行在线模式，当前项目本身没有 dist 属性
    if (online && pkg.dist && key === "size") {
      result[key] = pkg.dist[key];
    } else if (online && pkg[key] && key === "dependencies") {
      // 给 dependencies 里的包的键值设置为 name/version$
      const dependencies = pkg[key];
      const dependenciesWithVersion = {};
      for (const name in dependencies) {
        // eg: vue: vue/^2.6.12$
        dependenciesWithVersion[name] = `${name}/$${dependencies[name]}$`;
      }
      result[key] = dependenciesWithVersion;
    } else if (pkg[key]) {
      result[key] = pkg[key];
    }
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
//获取json文件的对象格式
function getPkgByPath(path: string): Package_TYPE {
  const info = fs.readFileSync(path, "utf8");
  return JSON.parse(info);
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
