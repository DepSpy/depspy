import { getModuleInfo } from "@dep-spy/utils";
import { Node, Config } from "./constant";
export class Graph {
  // 相同依赖缓存
  private cache: Map<string, Node> = new Map();
  // 循环引用缓存
  private path: Set<string> = new Set();
  constructor(
    // 包名
    private readonly info: string = "",
    // 配置项
    private readonly config: Config = { depth: Infinity, online: false },
    // 当前路径
    private readonly selfPath: string = ".",
  ) {}
  async initGraph() {
    // 递归获取依赖
    return await getModuleInfo(
      this.info,
      this.config.online,
      this.selfPath,
      this.cache,
      this.path,
    );
  }
  async output() {
    return (await this.initGraph()) as GraphNode;
  }
}

class GraphNode implements Node {
  constructor(
    public name: string,
    public version: string,
    public dependencies: Record<string, Node>,
    otherFields: { description?: string; circlePath?: string },
  ) {
    Object.entries(otherFields).forEach(([key, value]) => {
      this[key] = value;
    });
  }
}
