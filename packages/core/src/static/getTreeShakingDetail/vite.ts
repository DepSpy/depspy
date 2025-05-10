import { build } from "vite";
import { DEP_SPY_SUB_START } from "../../constant";
import { findSourceToImportsFormAst, normalizeIdToFilePath } from "../utils";
import path from "path";
// 获取指定导出真正依赖的源码和真正依赖的引入（复用vite的treeshaking规范）
export interface GetTreeShakingDetailOptions {
  // vite文件id，可能是绝对路径，也可能是虚拟路径
  entry: string;
  // 源码
  code: string;
  // 指定导出的名称，例如： default ｜ * ｜ getName
  exportName: string;
  // 忽略的插件
  ignorePlugins?: string[];
}
export interface GetTreeShakingDetailResult {
  // treeshaking后的代码
  treeShakingCode: string;
  // 依赖的源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
  sourceToImports: Map<string, Set<string>>;
  // 依赖的动态import的集合，例如：("./a", "./b" , "lodash" )
  dynamicallySource: Set<string>;
}

// 需要处理打包后代码的文件类型
const extToTransformMap = new Map([
  [
    ".vue",
    (code: string) => {
      return code.replace(/"__scopeId", ".*"/, "").replace(/__name: .*,/, "");
    },
  ],
]);
// 通过vite的treeshaking规范获取指定导出真正依赖的源码和真正依赖的引入
export async function getTreeShakingDetail(
  options: GetTreeShakingDetailOptions,
): Promise<GetTreeShakingDetailResult> {
  const { code, exportName, entry } = options;
  const ignorePlugins = new Set(options.ignorePlugins || []);
  // 当前文件的后缀
  const ext = path.extname(normalizeIdToFilePath(entry));
  // 计算过该文件哪些导出受到了影响，直接返回
  const virtualSourceModuleId = `${entry}`;
  const virtualImporterModuleId = `virtual:importer.js`;
  const virtualModules = {
    [virtualSourceModuleId]: code,
    [virtualImporterModuleId]: constructImportStatement(
      virtualSourceModuleId,
      exportName,
    ),
  };
  // treeshaking后的代码
  let treeShakingCode = "";
  // 源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
  let sourceToImports: Map<string, Set<string>> = new Map();
  // 动态import的集合
  let dynamicallySource = new Set<string>();

  if (code) {
    try {
      await build({
        build: {
          minify: false,
          cssMinify: false,
          write: false,
          modulePreload: {
            polyfill: false,
          },
          reportCompressedSize: false,
        },
        plugins: [
          {
            name: "vite-plugin-dep-spy-sub",
            enforce: "pre",
            buildStart() {
              process.env[DEP_SPY_SUB_START] = "true";
            },
            configResolved(config) {
              // 注入resolveId，保证第一个执行，不会被其他插件阶段
              /* 虽然vite不建议在这里调整插件，但是没有强行限制
                   1. 避免被其他强行加入的插件提前拦截影响，比如：vite-plugin-uni
                **/
              /* @ts-ignore */
              config.plugins?.unshift({
                name: "vite-plugin-dep-spy-sub-resolve",
                resolveId(
                  id: string,
                  _: string,
                  options: { isEntry: boolean },
                ) {
                  // 入口引入直接替换为虚拟模块
                  if (options.isEntry) {
                    return virtualImporterModuleId;
                  }
                  // 虚拟模块之间的引入（去除可能存在的查询参数)
                  const realId = normalizeIdToFilePath(id);
                  if (realId in virtualModules) {
                    return id;
                  }
                  // 目标文件引入的依赖标记为外部依赖，停止解析
                  return {
                    id,
                    external: true,
                    moduleSideEffects: true,
                  };
                },
              });
              // @ts-ignore 过滤指定的插件
              config.plugins = config.plugins.filter(
                (plugin) => !ignorePlugins.has(plugin?.["name"]),
              );
            },
            config(config) {
              // 兼容有分包的逻辑,删除分包
              if (Array.isArray(config?.build?.rollupOptions?.output)) {
                config.build.rollupOptions.output.map((item) => {
                  delete item.manualChunks;
                });
              } else {
                delete config?.build?.rollupOptions?.output?.manualChunks;
              }
            },
            load(id) {
              // 虚拟模块加载逻辑
              if (id in virtualModules) {
                return virtualModules[id];
              }
              return null;
            },
            generateBundle(_, chunk) {
              Object.values(chunk).forEach((module) => {
                // 处理源码，不处理静态资源
                if (module.type === "chunk") {
                  // 文件类型需要特殊处理，比如vue文件的scopeId每次都会变化，无法进行对比，需要去除
                  if (extToTransformMap.has(ext)) {
                    treeShakingCode = extToTransformMap.get(ext)!(module?.code);
                  } else {
                    treeShakingCode = module?.code;
                  }
                  // 获取源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
                  sourceToImports = findSourceToImportsFormAst(
                    this.parse(module?.code || ""),
                  );
                  // 收集动态导入
                  dynamicallySource =
                    new Set(
                      this.getModuleInfo(virtualSourceModuleId)
                        ?.dynamicallyImportedIds,
                    ) || new Set();
                }
              });
            },
          },
        ],
      });
    } catch (e) {
      /* 打包报错有以下原因：直接返回源码
        1. 代码中有语法错误
        2. 代码中有导入不存在的模块
      */
      console.log(e);
      return {
        treeShakingCode: code,
        sourceToImports,
        dynamicallySource,
      };
    }
  }

  return {
    treeShakingCode,
    sourceToImports,
    dynamicallySource,
  };
}

// 构造导入语句
function constructImportStatement(importedId: string, importName: string) {
  // 处理默认导入
  if (importName === "default") {
    return `import defaultName from '${importedId}';console.log(defaultName);`;
  }
  // 处理命名空间导入
  if (importName === "*") {
    return `import * as all from '${importedId}';console.log(all);`;
  }
  if (importName === "") {
    return `import '${importedId}';`;
  }
  // 处理具名导入
  return `import { ${importName} } from '${importedId}';console.log(${importName});`;
}
