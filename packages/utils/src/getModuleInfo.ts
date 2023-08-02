import {
  INFO_TYPES,
  GITHUB_DOMAIN,
  MODULE_INFO_TYPE,
  Package_TYPE,
  NPM_DOMAIN,
} from "./constant";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
const inBrowser = typeof window !== "undefined";
//给定想要获取模块的info，输出指定模块的详情
export default async function getModuleInfo(
  info: string,
  online: boolean = false,
  selfPath: string,
  cache: Map<string, unknown>,
  path: Set<string>,
): Promise<MODULE_INFO_TYPE> {
  let pak: Package_TYPE;
  switch (transformInfo(info)) {
    case INFO_TYPES.GITHUB:
    case INFO_TYPES.NPM:
      pak = inBrowser
        ? await getNpmOnlineInfo(info!)
        : online
        ? await getNpmOnlineInfo(info!)
        : getNpmLocalInfo(selfPath, cache, path);
      break;
    case INFO_TYPES.JSON:
      pak = JSON.parse(info!);
      break;
  }
  return pak;
}
//获取npm提供的package.json信息
async function getNpmOnlineInfo(packageName: string) {
  // const url = `${JSDELIVR_API}/${packageName}/package.json`;
  // return await axios.get(url).then((res) => res.data);
  const url = `${NPM_DOMAIN}/${packageName}/latest`;
  return await axios.get(url).then((res) => res.data);
}
//获取pnpm本地的package.json信息
function getNpmLocalInfo(
  dir: string,
  cache: Map<string, unknown>,
  pathSet: Set<string>,
): Package_TYPE {
  // 读取 package.json
  const packageJsonPath = path.join(dir, "package.json");
  // 如果不存在，抛出异常
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Cannot find module '${dir}'`);
  }

  // 读取 package.json 中的 dependencies
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  // 如果不存在，返回空对象
  const children = (packageJson.dependencies as Record<string, string>) || {};
  const dependencies = {};
  pathSet.add(`${packageJson.name}!${packageJson.version}`);

  // 遍历 dependencies，递归获取所有依赖
  for (const [name, version] of Object.entries(children)) {
    const cacheKey = `${name}!${version}`;
    const Setversion = version.replace(/[\^~*]/g, "");
    const pathSetKey = `${name}!${Setversion}`;
    if (pathSet.has(pathSetKey)) {
      // 用 => 是因为 / 在 @dep-spy/cli 这种包中会被曲解
      const circlePath = Array.from(pathSet.keys()).join("=>");
      dependencies[name] = {
        name,
        version,
        circlePath,
      };
      continue;
    }
    // 首先在当前目录的 node_modules 中查找
    const innerDir = path.join(dir, "node_modules", name);
    if (fs.existsSync(innerDir)) {
      const cacheInfo = { version, cache: `${name}!${version}` };
      cache.set(cacheKey, cacheInfo);
      dependencies[name] = getNpmLocalInfo(innerDir, cache, pathSet);
      continue;
    }
    // 如果已经存在，跳过
    if (cache.has(cacheKey)) {
      dependencies[name] = cache.get(cacheKey);
      continue;
    }
    // 如果不存在，再在上级目录的 node_modules 中查找
    let outerDir = path.join(dir, "..", "node_modules", name);
    while (!fs.existsSync(outerDir)) {
      const parentDir = path.join(dir, "..");
      // 如果已经到达根目录，抛出异常
      if (parentDir === ".") {
        throw new Error(`Cannot find module '${name}'`);
      }

      dir = parentDir;
      outerDir = path.join(dir, "..", "node_modules", name);
    }
    const cacheInfo = { version, cache: `${name}!${version}` };
    cache.set(cacheKey, cacheInfo);
    dependencies[name] = getNpmLocalInfo(outerDir, cache, pathSet);
  }

  pathSet.delete(`${packageJson.name}!${packageJson.version}`);

  return {
    name: packageJson.name,
    version: packageJson.version,
    dependencies,
    description: packageJson.description,
  };
}
// 判断info信息来源类型
function transformInfo(info?: string): INFO_TYPES {
  info = info?.trim();
  if (!info) return INFO_TYPES.NPM;
  if (info.startsWith(GITHUB_DOMAIN)) {
    return INFO_TYPES.GITHUB;
  } else if (info.startsWith("{")) {
    return INFO_TYPES.JSON;
  }
  throw new Error("Invalid info type");
}
