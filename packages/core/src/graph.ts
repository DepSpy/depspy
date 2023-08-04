import { getModuleInfo } from "@dep-spy/utils";
import { Node, Config } from "./constant";
const inBrowser = typeof window !== "undefined";
import * as fs from "fs";
import * as path from "path";
export class Graph {
  private graph: Node;
  private cache: Map<string, Node> = new Map();
  private paths: string[] = [];
  private resolvePaths: string[] = [];
  private codependency: Set<Node> = new Set();
  private circularDependency: Set<Node> = new Set();
  constructor(
    private readonly info: string,
    private readonly config: Config = {},
  ) {
    if (!inBrowser) this.resolvePaths.push(process.cwd());
  }
  async initGraph(info: string) {
    const { name, version, size, resolvePath, dependencies, description } =
      await getModuleInfo(info, {
        baseDir: this.resolvePaths.slice(-1)[0], //指定解析的根目录
        online: this.config.online,
        size: this.config.size,
      });
    const id = name + version;
    //直接返回缓存
    if (this.cache.has(id)) {
      const cacheNode = this.cache.get(id);
      //标记相同依赖
      cacheNode.cache = id;
      //收集相同依赖
      this.codependency.add(cacheNode);
      return this.cache.get(id)!;
    }
    //没有子依赖直接返回
    if (!dependencies) {
      return new GraphNode(name, version, {}, { description, size });
    }
    //循环依赖
    if (this.paths.includes(id)) {
      //生成循环路径
      const circlePath = Array.from(this.paths.values());
      //完成循环节点，包括其本身
      circlePath.push(id);
      //直接截断返回循环依赖
      const circularNode = new GraphNode(
        name,
        version,
        {},
        { description, circlePath, size },
      );
      this.circularDependency.add(circularNode);
      return circularNode;
    }
    //生成父节点（初始化一系列等下要用的变量）
    const children: Record<string, Node> = {};
    let totalSize = size;
    const curNode = new GraphNode(name, version, children, {
      description,
    });
    const dependenceEntries = Object.entries(dependencies);
    //加入当前依赖路径
    this.paths.push(id);
    //加入当前节点的绝对路径
    this.resolvePaths.push(resolvePath);

    /*⬅️⬅️⬅️  递归子节点处理逻辑  ➡️➡️➡️*/

    for (let i = 0; i < dependenceEntries.length; i++) {
      //深度判断
      if (this.config.depth && this.paths.length == this.config.depth) {
        break;
      }
      const [childName, childVersion] = dependenceEntries[i];
      //核心递归
      const child = await this.initGraph(childName);
      //添加实际声明的依赖
      child.declarationVersion = childVersion;
      //累加size
      totalSize += child.size;
      //子模块唯一id
      const childId = child.name + child.version;
      //缓存节点
      this.cache.set(childId, child!);
      //将子节点加入父节点（注意是children是引入类型，所以可以直接加）
      children[child.name] = child;
    }

    /*⬅️⬅️⬅️  后序处理逻辑  ➡️➡️➡️*/

    //删除当前依赖路径
    this.paths.pop();
    //删除当前绝对路径
    this.resolvePaths.pop();
    //将当前节点的size设置为所有子节点的size之和
    curNode.size = totalSize;
    return curNode;
  }
  async getGraph() {
    await this.ensureGraph();
    return this.graph;
  }
  async getCodependency() {
    await this.ensureGraph();
    return Array.from(this.codependency.values());
  }
  async getCircularDependency() {
    await this.ensureGraph();
    return Array.from(this.circularDependency);
  }
  async outputToFile() {
    await this.ensureGraph();
    const { graph, circularDependency, codependency } = this.config.output;
    if (graph) {
      this.writeJson(await this.getGraph(), graph);
    }
    if (circularDependency) {
      this.writeJson(await this.getCircularDependency(), circularDependency);
    }
    if (codependency) {
      this.writeJson(await this.getCodependency(), codependency);
    }
  }
  private async ensureGraph() {
    if (!this.graph) {
      this.graph = await this.initGraph(this.info);
    }
  }
  private writeJson(result: Node[] | Node, outDir: string) {
    fs.writeFileSync(path.join(process.cwd(), outDir), JSON.stringify(result), {
      flag: "w",
    });
  }
}

class GraphNode implements Node {
  declarationVersion: string;
  size?: number;
  description?: string;
  circlePath?: string[];
  constructor(
    public name: string,
    public version: string,
    public dependencies: Record<string, Node>,
    otherFields: { description?: string; circlePath?: string[]; size?: number },
  ) {
    Object.entries(otherFields).forEach(([key, value]) => {
      this[key] = value;
    });
    //拦截set，剔除无效属性
    return new Proxy(this, {
      set: function (target, property, value, receiver) {
        if (value) return Reflect.set(target, property, value, receiver);
        return true;
      },
    });
  }
}
