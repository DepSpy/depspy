import { getModuleInfo } from "@dep-spy/utils";
import { Node, Config } from "./constant";
const inBrowser = typeof window !== "undefined";
export class Graph {
  private cache: Map<string, Node> = new Map();
  private path: string[] = [];
  private resolvePaths: string[] = [];
  constructor(
    private readonly info: string,
    private readonly config: Config = {
      depth: Infinity,
      online: false,
      // actual: true,
    },
  ) {
    if (!inBrowser) this.resolvePaths.push(process.cwd());
  }
  async initGraph(info: string) {
    const { name, version, size, resolvePath, dependencies, description } =
      await getModuleInfo(
        info,
        this.resolvePaths.slice(-1)[0],
        this.config.online,
      );
    const id = name + version;
    //直接返回缓存
    if (this.cache.has(id)) {
      this.cache.get(id).cache = id;
      return this.cache.get(id)!;
    }
    //没有子依赖直接返回
    if (!dependencies) {
      return new GraphNode(name, version, {}, { description, size });
    }
    //循环依赖
    if (this.path.includes(name)) {
      const circlePath = Array.from(this.path.values());
      circlePath.push(name);
      return new GraphNode(
        name,
        version,
        {},
        { description, circlePath, size },
      );
    }
    //生成父节点
    const devDependencies: Record<string, Node> = {};
    let totalSize = size;
    const curNode = new GraphNode(name, version, devDependencies, {
      description,
    });
    const dependenceNames = Object.keys(dependencies);
    //A-加入当前路径
    this.path.push(name);
    this.resolvePaths.push(resolvePath);
    //递归生成子节点
    for (let i = 0; i < dependenceNames.length; i++) {
      if (this.config.depth && this.path.length == this.config.depth) {
        break;
      }
      const child = await this.initGraph(dependenceNames[i]);
      const childId = child.name + child.version;
      totalSize += child.size;
      this.cache.set(childId, child!);
      devDependencies[child.name] = child;
      // if (this.config.actual) {
      //   child.version = dependencies[dependenceNames[i]];
      // }
    }
    //A-删除当前路径
    this.path.pop();
    this.resolvePaths.pop();
    curNode.size = totalSize;
    return curNode;
  }
  async output() {
    return await this.initGraph(this.info);
  }
}

class GraphNode implements Node {
  size?: number;
  description?: string;
  circlePath?: string[];
  constructor(
    public name: string,
    public version: string,
    public devDependencies: Record<string, Node>,
    otherFields: { description?: string; circlePath?: string[]; size?: number },
  ) {
    Object.entries(otherFields).forEach(([key, value]) => {
      this[key] = value;
    });
    return new Proxy(this, {
      set: function (target, property, value, receiver) {
        if (value) return Reflect.set(target, property, value, receiver);
        return true;
      },
    });
  }
}
