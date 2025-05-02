import {
  ExportEffectedNodeSerializable,
  GetModuleInfo,
  Values,
  ModuleInfo,
  PluginDepSpyConfig,
} from "../type";
import { ExportEffectedNode, SourceToImportId } from "./utils";
import { getGitRootPath } from "./utils";
import getAllExportEffected from "./getAllExportEffected";
import path from "path";

export const externals = ["node_modules"];

export function idInExternals(id: string) {
  return externals.some((external) => {
    return id.includes(external);
  });
}

interface ModuleTree {
  children?: ModuleTree[];
  parentId?: string;
  // 当前
  id: string;
  pathId: string;
  name: string;
  // circleIds: string[][]
  depth: number;
  path: string[];
  idpath: string[];
  rootId?: string;
  // 该文件对比上次git提交是否有改动
  isGitChange: boolean;
  // 该文件的引入是否有改动
  isImportChange: boolean;
  // 该文件的副作用是否有改动（只限于非js类型）
  isSideEffectChange: boolean;
  // 该文件哪些导出没用被使用
  removedExports: string[];
  // 该文件哪些导出被使用
  renderedExports: string[];
  // 该文件的哪些导出有改动
  exportEffectedNamesToReasons: ExportEffectedNode["exportEffectedNamesToReasons"];
  // 该文件的哪些导入有改动, 例如 { './a': ['a','default'] }
  importEffectedNames: ExportEffectedNode["importEffectedNames"];
}

class Module {
  id: string;
  importedIds: Module[] = [];
  dynamicallyImportedIds: Module[] = [];
  constructor(
    id: string,
    public renderedExports: string[] = [],
    public removedExports: string[] = [],
  ) {
    this.id = id;
  }
}

// 构建模块依赖以及相关信息
class ModuleGraph {
  // 嵌套的树图
  graph = new Map<string, Module>();
  // 模块对应的静态引入
  importedIds = new Map<string, string[]>();
  // 模块对应的动态引入
  dynamicallyImportedIds = new Map<string, string[]>();
  // 项目的根节点（git的根目录）
  rootId: string;
  // 铺平的树
  tiledTree: ModuleTree[] = [];
  private _moduleIds = new Map<string, number>();
  /**文件id+导出名 to 导入文件名列表 */
  entryIdAndExportToFileNames = new Map<string, Set<string>>();
  constructor(
    public entryId: string,
    public allExportEffected: Map<string, ExportEffectedNode>,
  ) {
    this.rootId = getGitRootPath();
    this.allExportEffected.forEach((info, id) => {
      this.graph.set(
        id,
        new Module(id, info.renderedExports, info.removedExports),
      );
      this.importedIds.set(id, info.importedIds);
      this.dynamicallyImportedIds.set(id, info.dynamicallyImportedIds);
    });
  }
  /** 是否有重复模块 */
  static hasDuplicate(modules: Module[]) {
    if (!modules || modules.length === 0) return false;
    const ids = modules.map((module) => module.id);
    return new Set(ids).size !== ids.length;
  }
  /** 返回重复模块 */
  static getDuplicate(modules: Module[]): Module | null {
    if (!modules || modules.length === 0) return null;
    const seen = new Set();
    for (const module of modules) {
      if (seen.has(module.id)) return module;
      seen.add(module.id);
    }
    return null;
  }
  /** 返回包括该 module 之后的数组 */
  static subarrayFromFirstMatch(module: Module, modules: Module[]) {
    const index = modules.map((i) => i.id).indexOf(module.id);
    if (index === -1) return null;
    return modules.slice(index);
  }

  buildGraph() {
    this.graph.forEach((module) => {
      const id = module.id;
      if (this.importedIds.has(id)) {
        const importedIds = this.importedIds.get(id);
        module.importedIds = importedIds
          .map((item) => {
            return this.graph.get(item);
          })
          .filter(Boolean);
      }
      if (this.dynamicallyImportedIds.has(id)) {
        const dynamicallyImportedIds = this.dynamicallyImportedIds.get(id);
        module.dynamicallyImportedIds = dynamicallyImportedIds
          .map((item) => {
            return this.graph.get(item);
          })
          .filter(Boolean);
      }
    });
  }
  /** 收集函数粒度更改影响的文件 */
  collectedEntryAndExportToFileNames(
    entryId: string,
    changeExports: [
      string,
      Values<ExportEffectedNodeSerializable["exportEffectedNamesToReasons"]>,
    ][],
  ) {
    /**
     * 1. 本地和导入都更改
     * 2. 本地更改
     * 3. 导入更改
     */
    changeExports.forEach(([exportName, reasons]) => {
      // 本地更改
      if (reasons.isNativeCodeChange) {
        if (!this.entryIdAndExportToFileNames.has(`${entryId}//${exportName}`))
          this.entryIdAndExportToFileNames.set(
            `${entryId}//${exportName}`,
            new Set([entryId]),
          );
        else if (
          !this.entryIdAndExportToFileNames
            .get(`${entryId}//${exportName}`)
            .has(entryId)
        )
          this.entryIdAndExportToFileNames
            .get(`${entryId}//${exportName}`)
            .add(entryId);
      }
      // 导入更改
      Object.entries(reasons.importEffectedNames).forEach(
        ([id, importNames]) => {
          importNames.forEach((importName) => {
            const fullId = `${id}//${importName}`;

            if (this.entryIdAndExportToFileNames.has(fullId)) {
              this.entryIdAndExportToFileNames.get(fullId).add(entryId);
            } else {
              this.entryIdAndExportToFileNames.set(fullId, new Set([entryId]));
            }
          });
        },
      );
    });
  }
  /**初始化树节点 */
  initTreeNodeData(entryId: string, parent: ModuleTree) {
    let id = entryId;
    // id生成逻辑，出现一次+1
    if (this._moduleIds.has(entryId)) {
      const newValue = this._moduleIds.get(entryId) + 1;
      this._moduleIds.set(entryId, newValue);
      id = `${newValue}`;
    } else {
      this._moduleIds.set(entryId, 1);
      id = `1`;
    }
    // 兼容win和mac的路径展示
    const nameArr = path.normalize(entryId).split(path.sep);
    // 获取该节点的exportEffect
    const exportEffect = this.allExportEffected
      .get(entryId)

    const tree: ModuleTree = {
      parentId: parent ? `${parent.pathId}-${parent.id}` : undefined,
      id: id,
      pathId: entryId.slice(this.rootId.length) || entryId, // 1. 去掉根目录 2. 虚拟模块可能不存在真实路径
      depth: parent ? parent.depth + 1 : 0,
      name: nameArr
        .slice(nameArr.length >= 2 ? nameArr.length - 2 : 0)
        .join("/"),
      children: [],
      idpath: parent ? [...parent.idpath, id] : [id],
      // circleIds: [],
      path: parent
        ? [...parent.path, entryId.slice(this.rootId.length)]
        : [entryId.slice(this.rootId.length)],
      removedExports: [],
      renderedExports: [],
      isGitChange: Boolean(exportEffect?.isGitChange),
      isImportChange: Boolean(exportEffect?.isImportChange),
      isSideEffectChange: Boolean(exportEffect?.isSideEffectChange),
      exportEffectedNamesToReasons: exportEffect
        ? exportEffect.exportEffectedNamesToReasons
        : {},
      importEffectedNames: exportEffect ? exportEffect.importEffectedNames : {},
    };
    return tree;
  }
  transform(
    entryId: string = this.entryId,
    depth: number = 9999,
    parent: ModuleTree | null = null,
  ): ModuleTree | null {
    const tree: ModuleTree = this.initTreeNodeData(entryId, parent);
    // const changedExports = Object.entries(tree.exportEffectedNamesToReasons);
    // if (changedExports.length > 0) {
    //   this.collectedEntryAndExportToFileNames(entryId, changedExports);
    // }

    if (!parent) tree.rootId = this.rootId;

    if (this.graph.has(entryId)) {
      const rootModule = this.graph.get(entryId);
      tree.removedExports = rootModule.removedExports;
      tree.renderedExports = rootModule.renderedExports;
      // depth = 0 停止向下遍历
      if (depth === 0) return tree;
      // 发现循环路径
      if (new Set(tree.path).size !== tree.path.length) {
        return tree;
      }
      // 遍历导入模块
      tree.children = rootModule.importedIds
        .concat(rootModule.dynamicallyImportedIds)
        .map((module) => {
          let kid: ModuleTree | null = null;
          kid = this.transform(module.id, depth - 1, tree);
          if (kid) {
            kid.parentId = `${tree.pathId}-${tree.id}`;
            kid.depth = tree.depth + 1;
            kid.path = [...tree.path, kid.pathId];
            kid.idpath = [...tree.idpath, kid.id];
          }
          return kid;
        })
        .filter(Boolean);
      return tree;
    }
    return tree;
  }
  private tileTree(tree: ModuleTree) {
    tree.children.forEach((child) => {
      this.tileTree(child);
    });
    this.tiledTree.push({ ...tree, children: [] });
  }
  /** 生成铺平的树 */
  generateTiledTreeByRootId(entryId: string = this.entryId) {
    if (this.graph.has(entryId)) {
      const rootTree = this.transform(entryId);
      this.tileTree(rootTree);
      return this.tiledTree;
    }
    return null;
  }
  /** 序列化嵌套的树结构 */
  stringifyTreeByRootId(entryId: string = this.entryId) {
    if (this.graph.has(entryId)) {
      const rootTree = this.transform(entryId);
      return JSON.stringify(rootTree, null, 2);
    }
    return "";
  }
}
// 整合vite的打包后的整体信息
export class Bundle {
  /** 模块图 */
  moduleGraph: ModuleGraph;

  /** 该项目所有的importId */
  allModules = new Map<string, ModuleInfo | null>();
  // 所有的受到影响的导出详情
  allExportEffected: Map<string, ExportEffectedNode>;
  constructor(
    public options: PluginDepSpyConfig,
    public sourceToImportIdMap: SourceToImportId,
    private getModuleInfo: GetModuleInfo,
  ) {}

  /** 从项目入口收集项目的全部的importId */
  async generateModuleGraph() {
    this.allExportEffected = await getAllExportEffected(
      this.options,
      this.sourceToImportIdMap,
      this.getModuleInfo,
    );
    // 构建依赖树
    this.moduleGraph = new ModuleGraph(
      this.options.entry,
      this.allExportEffected,
    );
    /** 根据导入导出关系构建模块依赖图（根据上述设置的信息进行构建） */
    this.moduleGraph.buildGraph();
    return this.moduleGraph;
  }
}
