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
  father: string = "",
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
        : await getNpmLocalInfo(info!, father);
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
//获取npm提供的package.json信息
async function getNpmOnlineInfo(packageName: string) {
  // const url = `${JSDELIVR_API}/${packageName}/package.json`;
  // return await axios.get(url).then((res) => res.data);
  const url = `${NPM_DOMAIN}/${packageName}/latest`;
  return await axios.get(url).then((res) => res.data);
}
//获取本地某模块的package.json信息
async function getNpmLocalInfo(info: string, father: string) {
  let actualPath = "";
  info = path.join(info, "package.json");
  if (isPnpm()) {
    if (father) {
      let basedir = path.resolve(
        process.cwd(),
        "node_modules",
        ".pnpm",
        father,
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
    if (father) {
      let basedir = path.resolve(process.cwd(), "node_modules", father);
      try {
        actualPath = rf(basedir, info);
      } catch {
        basedir = path.resolve(process.cwd(), "node_modules");
        actualPath = rf(basedir, info);
      }
    } else {
      const basedir = path.resolve(process.cwd(), "node_modules");
      actualPath = rf(basedir, info);
    }
  }
  return getPkgByPath(actualPath);
}
//判断是不是pnpm
function isPnpm(): boolean {
  const pnpmCachePath = path.resolve(process.cwd(), "node_modules", ".pnpm");
  return fs.existsSync(pnpmCachePath);
}
//获取根目录的package.json信息
function getRootInfo() {
  const root = process.cwd();
  return getPkgByPath(path.join(root, "package.json"));
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
