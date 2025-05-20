import path from "path";
import os from "os";
import crypto from "crypto";
import { simple } from "acorn-walk";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { jsonsToBuffer } from "@dep-spy/utils";
import http from "http";
import { PluginDepSpyConfig } from "../type";
import { DEP_SPY_COMMIT_HASH, DEP_SPY_INJECT_MODE } from "../constant";

// 源码路径和绝对路径的互相映射
export class SourceToImportId {
  // 引用者绝对路径//相对=>绝对路径的映射，ps: {"/user/code/b.js//./a":"/user/code/a.js"}
  sourceToImportIdMap: Map<string, string>;
  // 绝对路径<=>裸导入的映射，ps: {lodash:"/user/code/lodash/index.js"}
  bareImportToImportIdMap: Map<string, string>;
  constructor() {
    this.sourceToImportIdMap = new Map();
    this.bareImportToImportIdMap = new Map();
  }
  // 保存源码路径和绝对路径的关联
  addRecord(source: string, importer: string | undefined, importId: string) {
    const key = this.getKey(source, importer);
    if (this.isBareImport(source)) {
      this.bareImportToImportIdMap.set(importId, key);
      return this.bareImportToImportIdMap.set(key, importId);
    }
    return this.sourceToImportIdMap.set(key, importId);
  }
  // 通过源码路径获取绝对路径
  getImportIdBySource(source: string, importer: string) {
    const key = this.getKey(source, importer);
    if (this.isBareImport(source)) {
      return this.bareImportToImportIdMap.get(key);
    }
    return this.sourceToImportIdMap.get(key);
  }
  // 清空记录，避免内存泄漏
  clear() {
    this.sourceToImportIdMap.clear();
    this.bareImportToImportIdMap.clear();
  }
  // 构造不同的key
  private getKey(source: string, importer: string | undefined) {
    // 三方包路径/别名/绝对路径，直接以source为key
    if (this.isBareImport(source)) {
      return source;
    }
    // 删除无用的参数
    importer = normalizeIdToFilePath(importer);
    // 相对路径需要加上引用地址才能作为唯一id(以//为分隔符)
    return `${source}//${importer || ""}`;
  }
  // 是否是裸导出
  private isBareImport(source: string) {
    if (!source.startsWith("./") && !source.startsWith("../")) {
      return true;
    }
    return false;
  }
}

// 更方便的合并添加节点的影响
export class ExportEffectedNode {
  // 受影响的导出以及对应影响原因，key:导出名称（例如：default ，* ，xx ），value: 影响原因
  exportEffectedNamesToReasons: Record<
    string,
    {
      // 是否是因为本地代码变更导致的导出变更
      isNativeCodeChange?: boolean;
      // 是否是因为引入变更导致的导出变更，例如：{ "/user/code/a.ts": ["a","default"] }
      // 和下面的importEffectedNames类型一致，只不过只是针对某个导出的依赖引入
      importEffectedNames: Record<string, string[]>;
    }
  > = {};
  // 受影响的导入,例如：{ "/user/code/a.ts": ["a","b","default","*"] }
  importEffectedNames: Record<string, string[]> = {};
  // 是否有代码变更
  isGitChange: boolean = false;
  // 是否有导入变更
  isImportChange: boolean = false;
  // 是否有副作用变更
  isSideEffectChange: boolean = false;
  // AI输出的风险评估
  riskAnalysis?: {
    level: string;
    reason: string;
  } | null = null;
  constructor(
    // 静态引入的文件列表
    public importedIds: string[] = [],
    // 动态引入的文件列表
    public dynamicallyImportedIds: string[] = [],
    // 被使用的导出
    public renderedExports: string[] = [],
    // 被treeshaking的导出
    public removedExports: string[] = [],
  ) {}
  // 添加导出影响以及原因（深度合并）
  addExportEffectedNameToReason(
    exportName: string,
    reason: {
      isNativeCodeChange?: boolean;
      importEffectedNames?: Record<string, string[]>;
    },
  ) {
    const { isNativeCodeChange = false, importEffectedNames = {} } = reason;
    /* 如果存在该exportName，则深度合并传入数据和已有数据, 例如:
     { "a": { isNativeCodeChange: false, importEffectedNames: { "/user/b.ts": ["b1"] } } }} 
      + { "a": { isNativeCodeChange: true, importEffectedNames: { "/user/b.ts": ["b2"] } } }}
      => { "a": { isNativeCodeChange: true, importEffectedNames: { "/user/b.ts": ["b1","b2"] } } }
    */
    // 如果存在该exportName，则深度合并传入数据和已有数据
    if (this.exportEffectedNamesToReasons[exportName]) {
      const exportEffectedReason =
        this.exportEffectedNamesToReasons[exportName];
      // 覆盖isNativeCodeChange
      exportEffectedReason.isNativeCodeChange = isNativeCodeChange;
      // 合并importEffectedNames
      Object.entries(importEffectedNames).map(([source, importNames]) => {
        const importEffectedName =
          exportEffectedReason.importEffectedNames[source];
        // 如果存在该导入，则合并importName
        if (importEffectedName) {
          importNames.forEach((name) => {
            // 合并需要去重
            exportEffectedReason.importEffectedNames[source] = Array.from(
              new Set([...importEffectedName, name]),
            );
          });
        } else {
          // 不存在该导入，则新增
          exportEffectedReason.importEffectedNames[source] = importNames;
        }
      });
      return;
    }
    // 不存在该exportName，且参数有意义，则新增
    if (isNativeCodeChange || importEffectedNames) {
      this.exportEffectedNamesToReasons[exportName] = {
        isNativeCodeChange,
        importEffectedNames,
      };
    }
  }
  // 记录有变化的导入
  addImportEffectedName(importId: string, importName: string) {
    // 存在该导入，直接添加importName
    const importEffectedNames = this.importEffectedNames[importId];
    if (importEffectedNames) {
      this.importEffectedNames[importId] = Array.from(
        new Set([...importEffectedNames, importName]),
      );
      return;
    }
    // 不存在该导入，新增记录
    this.importEffectedNames[importId] = [importName];
  }
}

// 规范化vite插件中的id
export function normalizeIdToFilePath(id: string) {
  if (id) {
    const pathWithoutQuery = id.split("?")[0];
    /* eslint-disable-next-line no-control-regex */
    return pathWithoutQuery.replace(/\x00/g, "");
  }
  return id;
}

// 通过字符串获取hash值
export function getHashFromString(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

// 获取AST中的导入对应关系，比如import {a,b as c} from 'xxx'，则返回{xxx:[a,b]}
export function findSourceToImportsFormAst(
  ast?: Parameters<typeof simple>["0"] | null,
) {
  // 报存源码对应的导入（静态导入）
  const sourceToImports: Map<string, Set<string>> = new Map();
  // 保存动态导入的集合
  const dynamicallySource: Set<string> = new Set();

  // 确保source对应的Set存在
  function ensureSet(source: string, value: string) {
    if (sourceToImports.get(source)) {
      sourceToImports.get(source)?.add(value);
    } else {
      sourceToImports.set(source, new Set([value]));
    }
  }
  // 如果没有AST，直接返回
  if (!ast) {
    return {
      sourceToImports,
      dynamicallySource,
    };
  }
  simple(ast, {
    ImportDeclaration(node) {
      const source = String(node.source.value);
      const specifiers = node.specifiers;
      specifiers.forEach((specifier) => {
        if (specifier.type === "ImportDefaultSpecifier") {
          // 处理默认导入
          ensureSet(source, "default");
        } else if (specifier.type === "ImportNamespaceSpecifier") {
          // 处理命名空间导入
          ensureSet(source, "*");
        } else if (specifier.type === "ImportSpecifier") {
          // 处理具名导入
          if (specifier.imported.type === "Identifier") {
            ensureSet(source, specifier.imported.name);
          } else {
            ensureSet(source, String(specifier.imported.value));
          }
        }
      });
    },
    ImportExpression(node) {
      if (node.source.type === "Literal") {
        const source = String(node.source.value);
        // 动态导入无法确定具体导入的内容，使用'dynamic'表示这是一个动态导入
        dynamicallySource.add(source);
      }
    },
  });
  return {
    sourceToImports,
    dynamicallySource,
  };
}

// 获取指定版本的提交内容
export function getFileContentAtCommit(
  absolutePath: string,
  commitHash: string,
) {
  absolutePath = normalizeIdToFilePath(absolutePath);
  try {
    const gitRootPath = getGitRootPath();
    // 转化符合git路径规范
    const gitPath = normalizePath(path.relative(gitRootPath, absolutePath));

    // 构建 Git 命令
    const command = `git show ${commitHash}:${gitPath}`;
    // 同步执行 Git 命令
    const output = execSync(command);
    // 将输出转换为字符串并返回
    return output.toString();
  } catch (error) {
    return "";
  }
}

// 通过vite的id规范判读一个文件路径是不是commonjs规范
export function isCommonJsById(importId: string) {
  const query = importId.split("?")?.[1] || "";
  return query.includes("commonjs");
}

// 通过vite的id安全的获取当前真实文件源码
export function readFileSyncSafe(id: string) {
  const filePath = normalizeIdToFilePath(id);
  let code = "";
  try {
    code = readFileSync(filePath, { encoding: "utf-8" });
  } catch (e) {
    console.error(`路径:${filePath}读取失败`, e);
  }
  return code;
}

function _getGitFilesModifiedByCommitHash(commitHash: string) {
  const output = execSync(`git diff --name-only ${commitHash}`).toString();
  return new Set(output.split("\n"));
}
export const getGitFilesModifiedByCommitHash = cacheReturn(
  _getGitFilesModifiedByCommitHash,
  (hash) => hash,
);

// 通过git判断文件是否修改
export function isGitFileModified(
  filePath: string,
  commitHash: string = "HEAD",
) {
  try {
    const gitRootPath = getGitRootPath();
    const filesModified = getGitFilesModifiedByCommitHash(commitHash);
    let gitFilePath = path.relative(
      gitRootPath,
      normalizeIdToFilePath(filePath),
    );
    // windows下的路径分隔符替换为/
    if (os.type() == "Windows_NT") {
      gitFilePath = gitFilePath.replace(/\\/g, "/");
    }
    if (filesModified.has(gitFilePath)) {
      return true;
    }
  } catch (e) {
    return true;
  }
  return false;
}

// 通过git查询仓库根目录
function _getGitRootPath() {
  let gitRootPath = "";
  try {
    gitRootPath = execSync("git rev-parse --show-toplevel").toString().trim();
  } catch {
    gitRootPath = process.cwd();
  }
  return gitRootPath;
}
export const getGitRootPath = cacheReturn(
  _getGitRootPath,
  () => "getGitRootPath",
);

// 分块逻辑
export async function sendDataByChunk(data: unknown[], path: string) {
  const chunkLen = 80;
  // 分块发送数据给服务器
  const count = Math.ceil(data?.length / chunkLen);
  try {
    await Promise.all(
      new Array(count).fill(0).map((_, i) => {
        // 最后一个分块携带标记，表示发送完毕
        const pathWithQuery = i + 1 < count ? path : `${path}?end=${count}`;
        return postServerGraph(
          data.slice(i * chunkLen, (i + 1) * chunkLen),
          pathWithQuery,
        );
      }),
    );
  } catch (error) {
    console.log("数据发送失败:", error);
  }
}
// 发送数据逻辑
export function postServerGraph(data: unknown[], path: string) {
  const options = {
    hostname: "localhost",
    port: 2027,
    path,
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
  };
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => {
        chunks.push(chunk);
      });
      res.on("end", () => {
        resolve(Buffer.concat(chunks).toString());
      });
    });

    req.on("error", (error) => {
      reject(error);
    });
    // 如果是注入模式，直接发送字符串
    if (process[DEP_SPY_INJECT_MODE]) {
      req.write(data.map((item) => JSON.stringify(item)));
    } else {
      req.write(jsonsToBuffer(data.map((item) => JSON.stringify(item))));
    }

    req.end();
  });
}

// 缓存高消耗的函数结果
export function cacheReturn<T extends (...args: unknown[]) => unknown>(
  callback: T,
  createKey: (...args: Parameters<T>) => string,
) {
  const cache = new Map();
  function fn(...args: Parameters<T>): ReturnType<T> {
    const key = createKey(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const value = callback.apply(this, args);
    cache.set(key, value);
    return value;
  }
  return fn;
}

// 判断文件是否需要过滤
export function isPathNeedFilter(
  path: string,
  ignores: (string | RegExp)[] = [],
) {
  // 遍历正则表达式数组
  return ignores.some((reg) => {
    if (reg instanceof RegExp) {
      return reg.test(path);
    }
    if (typeof reg === "string") {
      return path.includes(reg);
    }
    return true;
  });
}

// 合并环境配置和插件配置
export function mergeOptions(options: PluginDepSpyConfig): PluginDepSpyConfig {
  return {
    commitHash: process.env[DEP_SPY_COMMIT_HASH],
    ...options,
  };
}

// 绝对路径转化为基于项目根目录的相对路径
export function importIdToRelativeId(id: string) {
  const gitRootPath = getGitRootPath();
  return normalizePath(id).replace(gitRootPath, "");
}

// 规范化windows的路径表示
export function normalizePath(path: string) {
  if (os.type() == "Windows_NT") {
    return path.replace(/\\/g, "/");
  }
  return path;
}

// 获取指定版本，指定文件的gitdiff信息
export function getGitDiffByCommitHash(filePath: string, commitHash: string) {
  const diff = execSync(`git diff ${commitHash} -- ${filePath}`).toString();
  return diff;
}
