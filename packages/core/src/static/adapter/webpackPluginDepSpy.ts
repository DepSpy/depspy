import path from "path";
import { GetModuleInfo, ModuleInfo, PluginDepSpyConfig } from "../../type";
import { sendDataByChunk, SourceToImportId } from "../utils";
import { DEP_SPY_START, DEP_SPY_WEBPACK_BUILD } from "../../constant";
import { StaticGraph } from "../staticGraph";

export class webpackPluginDepSpy {
  private sourceToImportIdMap = new SourceToImportId();
  private importIdToModuleInfo = new Map<string, ModuleInfo>();
  constructor(private options: PluginDepSpyConfig = {}) {}
  apply(compiler) {
    //只能通过ds命令运行;
    if (!process.env[DEP_SPY_START]) {
      return false;
    }
    // 标记webpack构建
    process.env[DEP_SPY_WEBPACK_BUILD] = "true";

    compiler.hooks.beforeRun.tapPromise("EntryPathPlugin", async (compiler) => {
      // 如果用户没有提供entry，由webpack解析到的第一个entry作为入口
      if (!this.options.entry) {
        const entry = compiler.options.entry;
        if (typeof entry === "string") {
          this.options.entry = path.resolve(compiler.context, entry);
        } else if (entry && typeof entry === "object") {
          const entryStr = Object.values(entry)[0]["import"][0];
          if (path.isAbsolute(entryStr)) {
            this.options.entry = entryStr;
          } else {
            this.options.entry = path.resolve(compiler.context, entryStr);
          }
        }
      }
    });
    compiler.hooks.compilation.tap("DependencyTreePlugin", (compilation) => {
      compilation.hooks.optimizeModules.tap(
        "DependencyTreePlugin",
        (modules) => {
          modules.forEach((module) => {
            const filePath = module.resource;
            if (!filePath) return;
            // 收集路径映射
            const { importedIds, dynamicallyImportedIds } =
              this.collectDependence(module, compilation);
            // 处理导出信息
            const { renderedExports, removedExports } = this.analyzeExports(
              module,
              compilation,
            );
            this.importIdToModuleInfo.set(filePath, {
              importedIds: [...new Set(importedIds)],
              dynamicallyImportedIds: [...new Set(dynamicallyImportedIds)],
              removedExports: removedExports,
              renderedExports: renderedExports,
            });
          });
        },
      );
    });
    // 输出处理
    compiler.hooks.done.tap("DependencyTreePlugin", async () => {
      // 构造获取模块关键信息的函数
      const getModuleInfo: GetModuleInfo = (importId) => {
        const {
          importedIds,
          dynamicallyImportedIds,
          removedExports,
          renderedExports,
        } = this.importIdToModuleInfo.get(importId) || {};
        return {
          importedIds: [...(importedIds || [])],
          dynamicallyImportedIds: [...(dynamicallyImportedIds || [])],
          removedExports,
          renderedExports,
        };
      };
      // 生成依赖图
      const staticGraph = new StaticGraph(
        this.options,
        this.sourceToImportIdMap,
        getModuleInfo,
      );
      const graph = await staticGraph.generateGraph();
      await sendDataByChunk(Object.values(graph), "/collectBundle");
    });
  }
  // 分析导出
  analyzeExports(module, compilation) {
    const renderedExports = [];
    const removedExports = [];
    let providedExports = [];
    // Webpack5 的导出信息存储方式
    if (compilation.moduleGraph?.getProvidedExports) {
      providedExports = compilation.moduleGraph.getProvidedExports(module);
    } else {
      // 兼容 Webpack4
      providedExports = module.buildMeta
        ? module.buildMeta.providedExports
        : [];
    }

    let usedExports = [];
    // Webpack5 的导出使用信息存储方式
    if (compilation.moduleGraph?.getUsedExports) {
      const _usedExports = compilation.moduleGraph.getUsedExports(module);
      if (_usedExports === true) {
        // 如果是 true，表示所有导出都被使用
        usedExports = [...providedExports];
      } else if (_usedExports === false) {
        // 如果是 false，表示没有导出被使用
        usedExports = [];
      } else if (_usedExports instanceof Set) {
        usedExports = [..._usedExports];
      }
    } else {
      // 兼容 Webpack4
      const _usedExports = module.usedExports || [];
      if (Array.isArray(_usedExports)) {
        // 如果是 true，表示所有导出都被使用
        usedExports = [..._usedExports];
      } else if (Array.isArray(providedExports)) {
        // 如果是 false，表示没有导出被使用
        usedExports = [...providedExports];
      }
    }

    if (Array.isArray(providedExports) && Array.isArray(usedExports)) {
      renderedExports.push(
        ...providedExports.filter((exp) => usedExports.includes(exp)),
      );
      removedExports.push(
        ...providedExports.filter((exp) => !usedExports.includes(exp)),
      );
    }

    return { renderedExports, removedExports };
  }
  // 收集路径映射
  collectDependence(module, compilation) {
    const importedIds = [];
    const dynamicallyImportedIds = [];
    // 遍历所有依赖收集映射关系
    module.dependencies.forEach((dep) => {
      // 处理静态导入映射
      const request = dep.request || dep.userRequest;
      const depModle = compilation.moduleGraph?.getModule
        ? compilation.moduleGraph.getModule(dep)
        : dep.module;
      if (request && depModle && depModle.resource) {
        importedIds.push(depModle.resource);
        this.sourceToImportIdMap.addRecord(
          request,
          module.resource,
          depModle.resource,
        );
      }
    });
    // 处理动态导入映射
    module.blocks.forEach((block) => {
      block.dependencies.forEach((dep) => {
        const request = dep.request || dep.userRequest;
        const depModle = compilation.moduleGraph?.getModule
          ? compilation.moduleGraph.getModule(dep)
          : dep.module;
        if (request && depModle && depModle.resource) {
          dynamicallyImportedIds.push(depModle.resource);
          this.sourceToImportIdMap.addRecord(
            request,
            module.resource,
            depModle.resource,
          );
        }
      });
    });
    return {
      importedIds,
      dynamicallyImportedIds,
    };
  }
}
