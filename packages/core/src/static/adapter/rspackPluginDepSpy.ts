import {
  Compiler,
  EntryNormalized,
  EntryStaticNormalized,
  NormalModule,
  RspackPluginInstance,
} from "@rspack/core";
import { Module } from "@rspack/core";
import { sendDataByChunk, SourceToImportId } from "../utils";
import { ModuleInfo, PluginDepSpyConfig } from "../../type";
import { ALL_EXPORT_NAME, DEP_SPY_START } from "../../constant";
import { StaticGraph } from "../staticGraph";

export class rspackPluginDepSpy implements RspackPluginInstance {
  private sourceToImportId = new SourceToImportId();
  private importIdToModuleInfo = new Map<string, ModuleInfo>();
  constructor(private options: PluginDepSpyConfig = {}) {}
  apply(compiler: Compiler) {
    if (!process.env[DEP_SPY_START]) {
      return false;
    }
    compiler.hooks.entryOption.tap("RspackPluginDepSpy", (_, entry) => {
      if (!this.options.entry) {
        this.options.entry = this.getEntry(entry);
      }
    });
    compiler.hooks.compilation.tap(
      "RspackPluginDepSpy",
      (compilation, { normalModuleFactory }) => {
        normalModuleFactory.hooks.afterResolve.tap(
          "RspackPluginDepSpy",
          ({ request, contextInfo, createData }) => {
            this.sourceToImportId.addRecord(
              request,
              contextInfo.issuer,
              createData.resource,
            );
          },
        );
        compilation.hooks.optimizeModules.tap(
          "RspackPluginDepSpy",
          (modules: (Module | NormalModule)[]) => {
            for (const module of modules) {
              if (module.constructor.name === "NormalModule") {
                const normalModule = module as NormalModule;
                const currentPath = normalModule?.resource;
                if (!currentPath) return;
                const importedIds = [];
                const dynamicallyImportedIds = [];
                const renderedExports = [];
                // 收集静态导入和导出名称
                normalModule.dependencies.forEach((dependency) => {
                  // 收集静态导入
                  if (dependency.request && currentPath) {
                    const realPath = this.sourceToImportId.getImportIdBySource(
                      dependency.request,
                      currentPath,
                    );
                    // 添加静态依赖路径
                    if (realPath) {
                      importedIds.push(realPath);
                    }
                    // 收集导出名称
                    if (dependency.ids && realPath) {
                      this.updateModuleInfo(realPath, {
                        renderedExports: dependency.ids,
                      });
                    }
                  }
                });
                // 收集动态导入
                normalModule.blocks.forEach((block) => {
                  block.dependencies.forEach((dependency) => {
                    if (dependency.type === "import()") {
                      const realPath =
                        this.sourceToImportId.getImportIdBySource(
                          dependency.request,
                          currentPath,
                        );
                      // 添加动态依赖路径
                      dynamicallyImportedIds.push(realPath);
                      // 动态导入的模块，renderedExports默认为["*"]
                      this.updateModuleInfo(realPath, {
                        renderedExports: [ALL_EXPORT_NAME],
                      });
                    }
                  });
                });
                // 更新模块信息
                this.updateModuleInfo(currentPath, {
                  importedIds,
                  dynamicallyImportedIds,
                  renderedExports,
                });
              }
            }
          },
        );
      },
    );
    compiler.hooks.done.tap("RspackPluginDepSpy", async () => {
      const getModuleInfo = (importId: string) => {
        return this.getImportIdToModuleInfo(importId);
      };
      // 生成依赖图
      const staticGraph = new StaticGraph(
        this.options,
        this.sourceToImportId,
        getModuleInfo,
      );
      const graph = await staticGraph.generateGraph();
      await sendDataByChunk(Object.values(graph), "/collectBundle");
    });
  }
  // 自带创建逻辑的get
  getImportIdToModuleInfo(importId: string) {
    const moduleInfo = this.importIdToModuleInfo.get(importId);
    if (moduleInfo) {
      return moduleInfo;
    }
    // 如果没有找到，说明是一个新的模块，创建一个空的ModuleInfo
    const newModuleInfo: ModuleInfo = {
      importedIds: [],
      dynamicallyImportedIds: [],
      removedExports: [],
      renderedExports: [],
    };
    this.importIdToModuleInfo.set(importId, newModuleInfo);
    return newModuleInfo;
  }
  // 带合并去重逻辑
  updateModuleInfo(importId: string, data: Partial<ModuleInfo>) {
    const moduleInfo = this.getImportIdToModuleInfo(importId);
    Object.entries(data).forEach(([key, value]) => {
      moduleInfo[key] = Array.from(new Set([...moduleInfo[key], ...value]));
    });
  }

  // 获取默认入口,默认第一个路径
  getEntry(entryNormalized: EntryNormalized) {
    let defaultEntry = "";
    Object.values(entryNormalized).forEach((entry: EntryStaticNormalized) => {
      if (entry?.import[0]) {
        defaultEntry = entry.import[0];
      }
    });
    return defaultEntry;
  }
}
