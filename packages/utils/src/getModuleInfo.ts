import { GITHUB_DOMAIN, NPM_Name_Regex, MODULE_INFO } from "./constant";
import { MODULE_INFO_TYPE, PACKAGE_TYPE, INFO_TYPES } from "./type";
import * as fs from "fs";
import * as path from "path";
import { getPkgByPath, getPkgResolvePath } from "./utils";
const inBrowser = typeof window !== "undefined";

let number = 0;

export default function useGetModuleInfo(npm_domain?: string) {
  //给定想要获取模块的info，输出指定模块的详情
  async function getModuleInfo(
    info: string = "",
    baseDir: string,
  ): Promise<MODULE_INFO_TYPE> {
    let pak: PACKAGE_TYPE;
    switch (transformInfo(info)) {
      case INFO_TYPES.GITHUB:
      case INFO_TYPES.NPM: {
        pak = inBrowser
          ? await getNpmOnlineInfo(info!)
          : await getNpmLocalInfo(info!, baseDir);
        break;
      }
      case INFO_TYPES.JSON:
        pak = JSON.parse(info!);
        break;
      default:
        if (inBrowser) throw new Error("invalid parameter");
        pak = await getRootInfo();
    }
    return transformPackage(pak);
  }
  //获取npm提供的package.json信息🌐
  async function getNpmOnlineInfo(packageName: string) {
    let url: string;
    if (packageName.endsWith("$")) {
      // 去掉所有的 $ 符号
      packageName = packageName.replace(/\$/g, "");
      url = `${npm_domain}/${packageName}`;
    } else {
      url = `${npm_domain}/${packageName}/latest`;
    }
    return await fetch(url).then((res) => res.json());
  }
  return getModuleInfo;
}

//获取根目录的package.json信息🌳
async function getRootInfo() {
  const pkg = await getPkgByPath<PACKAGE_TYPE>(
    path.join(process.cwd(), "package.json"),
  );
  pkg.resolvePath = process.cwd();
  return pkg;
}

//获取本地某模块的package.json信息💻
async function getNpmLocalInfo(info: string, baseDir: string) {
  console.log(info, "开始");
  const [actualPath, baseNext] = getPkgResolvePath(info, baseDir);
  const pkg = await getPkgByPath<PACKAGE_TYPE>(actualPath);
  pkg.size = await getDirSize(actualPath, ["node_modules"]);
  pkg.resolvePath = baseNext;
  console.log(info, "结束");
  number++;
  console.log(number);
  return pkg;
}
//读取文件夹的总大小
async function getDirSize(
  directory: string,
  ignoreFiles: string[] = [],
): Promise<number> {
  const dirStats = fs.statSync(directory);
  if (!dirStats.isDirectory()) directory = path.dirname(directory);
  let totalSize = 0;
  const dirContent = (await new Promise((resolve) => {
    fs.readdir(directory, (err, data) => {
      resolve(data);
    });
  })) as string[];
  const promises = [];
  for (let i = 0; i < dirContent.length; i++) {
    if (ignoreFiles.includes(dirContent[i])) continue;
    const filePath = path.join(directory, dirContent[i]);
    const fileStatsPromise = new Promise((resolve) => {
      fs.stat(filePath, (err, stats) => {
        resolve(stats);
      });
    }).then(async (fileStats: fs.Stats) => {
      if (fileStats.isDirectory()) {
        totalSize += await getDirSize(filePath, ignoreFiles); // 如果是目录，则递归调用
      } else {
        totalSize += fileStats.size;
      }
    });
    promises.push(fileStatsPromise);
  }
  await Promise.all(promises);
  return totalSize;
}
// 选出需要的数据
function transformPackage(pkg: PACKAGE_TYPE): MODULE_INFO_TYPE {
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
      Object.keys(dependencies).forEach((name) => {
        // eg: vue: vue/^2.6.12$
        dependenciesWithVersion[name] = `${name}/$${dependencies[name]}$`;
      });
      // for (const name in dependencies) {
      //   // eg: vue: vue/^2.6.12$
      //   dependenciesWithVersion[name] = `${name}/$${dependencies[name]}$`;
      // }
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
