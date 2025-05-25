import path from "path";
import {
  cacheReturn,
  getFileContentAtCommit,
  getHashFromString,
  isCommonJsById,
  isGitFileModified,
  normalizeIdToFilePath,
  readFileSyncSafe,
  SourceToImportId,
  isPathNeedFilter,
  ExportEffectedNode,
  importIdToRelativeId,
  getGitDiffByCommitHash,
} from "./utils";
import { getTreeShakingDetail as _getTreeShakingDetail } from "./getTreeShakingDetail/rolldown";
import { ModuleInfo, PluginDepSpyConfig } from "../type";
import { ALL_EXPORT_NAME, SIDE_EFFECT_NAME } from "../constant";
import { getRiskAnalysis } from "../api";

// 只处理包含JS逻辑的文件类型
const targetExt = new Set<string>([
  ".ts",
  ".js",
  ".jsx",
  ".tsx",
  ".vue",
  ".html",
]);
// 副作用导入名

// 绝对路径=>导出受到影响的导出
const importIdToExportEffected: Map<string, ExportEffectedNode> = new Map();

// 记录已经进入的处理队列的Promise
const importIdToExportEffectedPromise: Map<
  string,
  Promise<Map<string, ExportEffectedNode>>
> = new Map();

// 记录大模型风险分析api的promise(避免堵塞递归的同时，保证递归完成后一定有结果)
const riskAnalysisPromise: Promise<void>[] = [];

// 获取指定导出真正依赖的源码和真正依赖的引入（复用vite的treeshaking规范）(缓存化)
let getTreeShakingDetail: typeof _getTreeShakingDetail;
// getAllExportEffect的包装层，避免外层因为本身的递归参数传入不必要的参数
export default async function getAllExportEffect(
  // 入口绝对地址
  options: PluginDepSpyConfig,
  // 源码引入到绝对路径的映射
  sourceToImportIdMap: SourceToImportId,
  // 获取moduleInfo的函数
  getModuleInfo: (importId: string) => ModuleInfo,
) {
  // 函数执行时才进行赋值，避免环境变量为空
  getTreeShakingDetail = cacheReturn(_getTreeShakingDetail, (options) => {
    // 以参数作为唯一key进行缓存
    return getHashFromString(
      Object.values(options).reduce((pre, cur) => pre + cur, ""),
    );
  });
  return await _getAllExportEffect(
    options,
    new Set(),
    sourceToImportIdMap,
    getModuleInfo,
  );
}

// 获取代码中有哪些导出收到了改动的影响（直接或间接）
async function _getAllExportEffect(
  // 插件配置
  options: PluginDepSpyConfig,
  // 当前节点经过的树路径
  paths: Set<string>,
  // 源码引入到绝对路径的映射
  sourceToImportIdMap: SourceToImportId,
  // 获取moduleInfo的函数
  getModuleInfo: (importId: string) => ModuleInfo,
) {
  const { entry, ignores = [], commitHash = "HEAD" } = options;
  // 进入节点记录路径;
  paths.add(entry);
  // 计算过该文件哪些导出受到了影响，直接返回
  if (importIdToExportEffected.has(entry)) {
    paths.delete(entry);
    return importIdToExportEffected;
  }
  // 当前文件的后缀
  const ext = path.extname(normalizeIdToFilePath(entry));

  // 是否是commonjs规范的文件
  const isCommonJs = isCommonJsById(entry);

  // 获取当前文件的信息
  const currentInfo = getModuleInfo(entry);

  /* 返回空节点，只做展示
    1. 用户配置的忽略文件
    2. 不是JS类型的源码，直接返回
    3. 是commonjs规范的文件
    4. 如果是node_modules下的文件 
  */
  if (
    isPathNeedFilter(entry, ignores) ||
    !targetExt.has(ext) ||
    isCommonJs ||
    entry.includes("node_modules")
  ) {
    // 构造空节点
    const exportEffect: ExportEffectedNode = new ExportEffectedNode(
      currentInfo.importedIds,
      currentInfo.dynamicallyImportedIds,
      currentInfo.renderedExports,
      currentInfo.removedExports,
    );
    importIdToExportEffected.set(entry, exportEffect);
    paths.delete(entry);
    return importIdToExportEffected;
  }
  // 保证该文件的import的影响已经计算完成
  const importDepPromise: Promise<Map<string, ExportEffectedNode>>[] = [];
  // 该文件引入的所有依赖（静态引入 + 动态引入）
  const allImportIds = [
    ...(currentInfo?.importedIds || []),
    ...(currentInfo?.dynamicallyImportedIds || []),
  ];
  allImportIds.forEach((importedId) => {
    // 循环依赖直接退出（ TODO: 是否能以函数粒度继续分析 ）
    if (paths.has(importedId)) {
      return;
    }
    // 该依赖已经开始解析，直接获取原有promise进入等待队列
    const prePromise = importIdToExportEffectedPromise.get(importedId);
    if (prePromise) {
      importDepPromise.push(prePromise);
      return;
    }
    const promise = _getAllExportEffect(
      {
        ...options,
        entry: importedId,
      },
      new Set([...paths, importedId]),
      sourceToImportIdMap,
      getModuleInfo,
    ).then((res) => {
      // 删除当前文件的记录的promise,减少内存占用
      importIdToExportEffectedPromise.delete(importedId);
      return res;
    });
    importIdToExportEffectedPromise.set(importedId, promise);
    importDepPromise.push(promise);
  });
  // 确保改文件的所有依赖都已经解析完成
  await Promise.all(importDepPromise);
  const preCode = getFileContentAtCommit(entry, commitHash);
  const curCode = readFileSyncSafe(entry);
  const exportChanges: ExportEffectedNode = new ExportEffectedNode(
    currentInfo.importedIds,
    currentInfo.dynamicallyImportedIds,
    currentInfo.renderedExports,
    currentInfo.removedExports,
  );
  const exportEffectPromise: Promise<void>[] = [];

  // vite不能单独打包html，需要单独处理
  if (ext !== ".html") {
    // 遍历当前文件的导出，判断各个导出是否有变动
    // 空字符是模拟副作用导入的情况，比如 import "dayjs"
    currentInfo?.renderedExports
      .concat(SIDE_EFFECT_NAME)
      ?.forEach((exportName: string) => {
        const curTreeShakingCodePromise = getTreeShakingDetail({
          entry,
          code: curCode,
          exportName,
        });
        const preTreeShakingCodePromise = getTreeShakingDetail({
          entry,
          code: preCode,
          exportName,
        });
        const mergePromise = Promise.all([
          curTreeShakingCodePromise,
          preTreeShakingCodePromise,
        ]).then(async ([cur, pre]) => {
          // 如果git发生的变化，和上个版本比较，本身的代码是否变动
          if (isGitFileModified(entry, commitHash)) {
            const curHash = getHashFromString(cur.treeShakingCode);
            const preHash = getHashFromString(pre.treeShakingCode);
            if (curHash !== preHash) {
              exportChanges.isGitChange = true;
              exportChanges.preCode = preCode;
              exportChanges.curCode = curCode;
              exportChanges.addExportEffectedNameToReason(exportName, {
                isNativeCodeChange: true,
              });
              // 副作用判断
              if (exportName === SIDE_EFFECT_NAME) {
                exportChanges.isSideEffectChange = true;
              }
              // 大模型风险风险添加字段
              const diff = getGitDiffByCommitHash(entry, commitHash);
              riskAnalysisPromise.push(
                getRiskAnalysis(diff).then((riskAnalysis) => {
                  exportChanges.riskAnalysis = riskAnalysis;
                }),
              );
            }
          }
          // 该导出依赖的静态引入是否变动
          cur.sourceToImports.forEach((imports, source) => {
            // 引入文件的哪些导出受到了影响
            const importId =
              sourceToImportIdMap.getImportIdBySource(source, entry) || "";
            const sourceExportEffect = importIdToExportEffected.get(importId);
            if (sourceExportEffect) {
              // 依次确认哪些引入有改动
              imports.forEach((_import) => {
                // 1. 该引入有改动
                // 2. 全量引入且该引入文件的受影响的导出不为空
                // 3. 该引入文件有副作用变动
                const importEffectedReason =
                  sourceExportEffect?.exportEffectedNamesToReasons[_import];
                if (
                  importEffectedReason ||
                  (_import === ALL_EXPORT_NAME &&
                    Object.keys(
                      sourceExportEffect?.exportEffectedNamesToReasons || {},
                    ).length) ||
                  sourceExportEffect.isSideEffectChange
                ) {
                  // 对应importId的相对路径
                  const relativeId = importIdToRelativeId(importId);
                  // 标记该节点有导入变动
                  exportChanges.isImportChange = true;
                  // 副作用判断
                  if (exportName === SIDE_EFFECT_NAME) {
                    exportChanges.isSideEffectChange = true;
                  }
                  // 引入的副作用判断
                  if (sourceExportEffect.isSideEffectChange) {
                    exportChanges.isSideEffectChange = true;
                    exportChanges.addExportEffectedNameToReason(exportName, {
                      importEffectedNames: {
                        [relativeId]: [SIDE_EFFECT_NAME],
                      },
                    });
                  }
                  // 记录该文件受到了哪些导入的影响
                  exportChanges.addImportEffectedName(relativeId, _import);
                  // 记录该导出受到了哪些导入的影响
                  exportChanges.addExportEffectedNameToReason(exportName, {
                    importEffectedNames: {
                      [relativeId]: [_import],
                    },
                  });
                }
              });
            }
          });
          // 该导出依赖的动态引入是否变动
          cur.dynamicallySource.forEach((source) => {
            // 动态引入文件的绝对路径
            const importId =
              sourceToImportIdMap.getImportIdBySource(source, entry) || "";
            // 引入文件的哪些导出受到了影响
            const sourceExportEffect = importIdToExportEffected.get(importId);
            // 动态引入的文件是否有导出受到影响
            const isImportChange = Object.keys(
              sourceExportEffect?.exportEffectedNamesToReasons || {},
            ).length;
            // 如果动态引入有变化，则该导出受到影响
            if (isImportChange) {
              // 对应importId的相对路径
              const relativeId = importIdToRelativeId(importId);
              // 标记该节点有导入变动
              exportChanges.isImportChange = true;
              // 副作用判断
              if (exportName === SIDE_EFFECT_NAME) {
                exportChanges.isSideEffectChange = true;
              }
              // 引入副作用判断
              if (sourceExportEffect.isSideEffectChange) {
                exportChanges.isSideEffectChange = true;
                exportChanges.addExportEffectedNameToReason(exportName, {
                  importEffectedNames: {
                    [relativeId]: [SIDE_EFFECT_NAME],
                  },
                });
              }
              // 记录该文件受到了哪些导入的影响,动态导入默认为全量引入，所以影响添加为*
              exportChanges.addImportEffectedName(relativeId, ALL_EXPORT_NAME);
              // 记录该导出受到了哪些导入的影响
              exportChanges.addExportEffectedNameToReason(exportName, {
                importEffectedNames: {
                  [relativeId]: [ALL_EXPORT_NAME],
                },
              });
            }
          });
          // getTreeShakingDetail会treeshaking的掉没使用的代码
          // 比如 import "dayjs" 这种副作用的引入,需要检查
          allImportIds.forEach((importId) => {
            const relativeId = importIdToRelativeId(importId);
            // 只对遗漏的引入做检查
            if (
              cur.dynamicallySource.has(relativeId) ||
              cur.sourceToImports.has(relativeId)
            ) {
              return;
            }
            const exportEffected = importIdToExportEffected.get(importId);
            // 如果该导入有副作用，则标记为副作用变动
            if (exportEffected?.isSideEffectChange) {
              exportChanges.isSideEffectChange = true;
              exportChanges.addExportEffectedNameToReason(exportName, {
                importEffectedNames: {
                  [relativeId]: [SIDE_EFFECT_NAME],
                },
              });
            }
          });
        });
        exportEffectPromise.push(mergePromise);
      });
  } else {
    // 作为入口的index.html，没有导出，但是被引入打包项目的特例
    // 对比文件是否有变动即可
    if (isGitFileModified(entry)) {
      exportChanges.isGitChange = true;
      // 没有导出的文件，可以直接标记为副作用变动
      exportChanges.isSideEffectChange = true;
      exportChanges.preCode = preCode;
      exportChanges.curCode = curCode;
      // 大模型风险分析
      const diff = getGitDiffByCommitHash(entry, commitHash);
      riskAnalysisPromise.push(
        getRiskAnalysis(diff).then((riskAnalysis) => {
          exportChanges.riskAnalysis = riskAnalysis;
        }),
      );
    }
    // 检查该文件依赖的静态引入是否变动
    currentInfo?.importedIds.forEach((importId) => {
      const exportEffected = importIdToExportEffected.get(importId);
      // 1. 该引入有改动的导出有变化 2. 该引入副作用有变化
      if (
        Object.keys(exportEffected?.exportEffectedNamesToReasons || {})
          .length ||
        exportEffected?.isSideEffectChange
      ) {
        // 对应importId的相对路径
        const relativeId = importIdToRelativeId(importId);
        // 标记该节点有导入变动
        exportChanges.isImportChange = true;
        // 没有导出的文件，可以直接标记为副作用变动
        exportChanges.isSideEffectChange = true;
        // 因为是html的script引入，所以默认为副作用引入
        exportChanges.addImportEffectedName(relativeId, SIDE_EFFECT_NAME);
        // 记录影响原因，html文件引入的只会是副作用引入
        exportChanges.addExportEffectedNameToReason(SIDE_EFFECT_NAME, {
          importEffectedNames: {
            [relativeId]: [SIDE_EFFECT_NAME],
          },
        });
      }
      ` `;
    });
  }
  // 版本改文件是否受到影响 1. 本身代码改动 2. 有导入受到影响
  await Promise.all(exportEffectPromise);
  importIdToExportEffected.set(entry, exportChanges);
  paths.delete(entry);
  // 递归完成前确保大模型风险分析的结果全部完成
  if (paths.size === 0) {
    await Promise.all(riskAnalysisPromise);
  }
  return importIdToExportEffected;
}
