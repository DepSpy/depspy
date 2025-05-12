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
        const context = compiler.options.context || process.cwd();
        const entryPaths = await this.processEntry(entry, context);
        // 由第一个entry作为入口
        Object.values(entryPaths).some((paths: string[]) => {
          return paths.some((entry) => {
            if (entry) {
              this.options.entry = entry;
              return true;
            }
          });
        });
      }
    });
    compiler.hooks.compilation.tap("DependencyTreePlugin", (compilation) => {
      const pathMapping = new Map();
      // Webpack4 没有 finishModules 钩子，改用 optimizeModules
      compilation.hooks.optimizeModules.tap(
        "DependencyTreePlugin",
        (modules) => {
          modules.forEach((module) => {
            const filePath = module.resource;
            if (!filePath) return;
            // 收集路径映射
            this.collectPathMapping(module, pathMapping);
            // 收集静态导入
            const importedIds = this.collectStaticImports(module);
            // 收集动态导入
            const dynamicallyImportedIds = this.collectDynamicImports(module);
            // 处理导出信息
            const { renderedExports, removedExports } =
              this.analyzeExports(module);
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

  // 收集静态导入
  collectStaticImports(module) {
    const imports = [];
    module.dependencies.forEach((dep) => {
      if (
        dep.constructor.name === "HarmonyImportSpecifierDependency" ||
        dep.constructor.name === "CommonJSRequireDependency"
      ) {
        const refModule = dep.module;
        if (refModule && refModule.resource) {
          imports.push(refModule.resource);
        }
      }
    });
    return imports;
  }

  // 收集动态导入
  collectDynamicImports(module) {
    const dynamicImports = [];
    module.blocks.forEach((block) => {
      block.dependencies.forEach((dep) => {
        if (
          dep.constructor.name === "ImportDependency" ||
          dep.constructor.name === "ContextDependency"
        ) {
          const module = dep?.module;
          if (module && module.resource) {
            dynamicImports.push(module.resource);
          }
        }
      });
    });
    return dynamicImports;
  }

  // 分析导出
  analyzeExports(module) {
    const renderedExports = [];
    const removedExports = [];

    // Webpack4 的导出信息存储方式
    const providedExports = module.buildMeta
      ? module.buildMeta.providedExports
      : [];
    const usedExports = module.usedExports || [];
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
  collectPathMapping(module, pathMapping) {
    // 遍历所有依赖收集映射关系
    module.dependencies.forEach((dep) => {
      // 处理静态导入映射
      if (
        dep.constructor.name === "HarmonyImportSpecifierDependency" ||
        dep.constructor.name === "CommonJSRequireDependency"
      ) {
        const request = dep.request || dep.userRequest;
        if (request && dep.module && dep.module.resource) {
          this.sourceToImportIdMap.addRecord(
            request,
            module.resource,
            dep.module.resource,
          );
        }
      }

      // 处理动态导入映射
      if (dep.constructor.name === "ImportDependency") {
        const request = dep.request || dep.userRequest;
        const refModule = dep.module || dep._module;
        if (request && refModule && refModule.resource) {
          this.sourceToImportIdMap.addRecord(
            request,
            module.resource,
            refModule.resource,
          );
        }
      }
    });

    // 处理块级依赖（如require.ensure）
    module.blocks.forEach((block) => {
      block.dependencies.forEach((dep) => {
        if (dep.constructor.name === "ContextDependency") {
          const request = dep.request || dep.userRequest;
          const refModule = dep.module || dep._module;
          if (request && refModule && refModule.resource) {
            pathMapping.set(request, refModule.resource);
          }
        }
      });
    });
  }

  // 兼容不同版本方式的入口路径获取
  processEntry(entry, context) {
    // Webpack 4的入口函数可能不需要参数
    if (typeof entry === "function") {
      entry = entry();
    }

    // 标准化为对象格式
    const normalized = this.normalizeEntries(entry);
    return this.resolvePaths(normalized, context);
  }

  normalizeEntries(entries) {
    if (typeof entries === "string" || Array.isArray(entries)) {
      return { main: entries };
    }
    return entries || {};
  }

  resolvePaths(entries, context) {
    const result = {};
    for (const [name, value] of Object.entries(entries)) {
      result[name] = this.resolveEntry(value, context);
    }
    return result;
  }

  resolveEntry(value, context) {
    let paths = [];
    if (typeof value === "string") {
      paths = [value];
    } else if (Array.isArray(value)) {
      paths = value;
    }
    // 转为绝对路径（注意：Webpack 4会自动处理相对路径）
    return paths.map((p) => path.resolve(context, p));
  }
}
