import {  StaticGraphNode, PluginDepSpyConfig } from "../type";
import {
  ExportEffectedNode,
  getGitRootPath,
  importIdToRelativeId,
} from "./utils";



export class StaticGraph {
  // 邻接链表
  graph: Record<string, StaticGraphNode> = {};
  // 项目根目录（git的根目录）
  rootId = getGitRootPath();

  constructor(
    // 用户配置
    public options: PluginDepSpyConfig,
    // 所有模块的受影响详情
    public allExportEffected: Map<string, ExportEffectedNode>,
  ) {}

  /** 生成邻接链表表示图 */
  generateGraph(importId: string = this.options.entry) {
    // 相对路径
    const relativeId = importIdToRelativeId(importId);
    // 如果已经存在，直接返回, 避免无限递归
    if (this.graph[relativeId]) {
      return this.graph;
    }
    // 获取当前节点的信息
    const exportEffected = this.allExportEffected.get(importId);
    if (exportEffected) {
      // graphNodes，保存模块详情
      this.graph[relativeId] = this.transformGraphNodes(importId);
      // 递归（静态 + 动态）导入的id
      const allImportIds = exportEffected.importedIds.concat(
        exportEffected.dynamicallyImportedIds,
      );
      allImportIds.forEach((importId) => {
        this.generateGraph(importId);
      });
    }
    return this.graph;
  }

  /** 转换图节点 */
  private transformGraphNodes(importId: string): StaticGraphNode {
    const exportEffected = this.allExportEffected.get(importId);
    return {
      ...exportEffected,
      importedIds: exportEffected.importedIds.map(importIdToRelativeId),
      dynamicallyImportedIds:
        exportEffected.dynamicallyImportedIds.map(importIdToRelativeId),
      // 文件绝对路径s
      // importId,
      // 文件相对路径
      relativeId: importIdToRelativeId(importId),
    };
  }
}
