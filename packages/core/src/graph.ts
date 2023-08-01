import { getModuleInfo } from "@dep-spy/utils";
import { Node, Config } from "./constant";
export class Graph {
  private cache: Map<string, Node> = new Map();
  private path: Set<string> = new Set();
  constructor(
    private readonly info: string,
    private readonly config: Config = { depth: Infinity, online: false },
  ) {}
  async initGraph(info: string, father: string) {
    const { name, version, dependencies, description } = await getModuleInfo(
      info,
      father,
      this.config.online,
    );
    const id = name + "!" + version;
    //直接返回缓存
    if (this.cache.has(id)) {
      this.cache.get(id).cache = id;
      return this.cache.get(id)!;
    }
    //没有子依赖直接返回
    if (!dependencies) {
      return new GraphNode(name, version, {}, { description });
    }
    //循环依赖
    if (this.path.has(id)) {
      const circlePath = Array.from(this.path.keys()).join("/");
      return new GraphNode(name, version, {}, { description, circlePath });
    }
    //生成父节点
    const children: Record<string, Node> = {};
    const curNode = new GraphNode(name, version, children, { description });
    const dependenceNames = Object.keys(dependencies);
    //A-加入当前路径
    this.path.add(id);
    //递归生成子节点
    for (let i = 0; i < dependenceNames.length; i++) {
      if (this.config.depth && this.path.size == this.config.depth) {
        break;
      }
      const child = await this.initGraph(dependenceNames[i], name);
      const childId = child.name + "!" + child.version;
      this.cache.set(childId, child!);
      children[childId] = child;
    }
    //A-删除当前路径
    this.path.delete(id);
    return curNode;
  }
  async output() {
    return await this.initGraph(this.info, "");
  }
}

class GraphNode implements Node {
  constructor(
    public name: string,
    public version: string,
    public children: Record<string, Node>,
    otherFields: { description?: string; circlePath?: string },
  ) {
    Object.entries(otherFields).forEach(([key, value]) => {
      this[key] = value;
    });
  }
}
