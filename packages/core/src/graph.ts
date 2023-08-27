import { getModuleInfo } from "@dep-spy/utils";
import { Node, Config } from "./constant";
const inBrowser = typeof window !== "undefined";
import * as fs from "fs";
import * as path from "path";
export class Graph {
  private graph: Node; //整个图
  private cache: Map<string, Node> = new Map(); //用来缓存计算过的节点
  private paths: string[] = []; //记录根节点到当前节点的经过的每一个节点（数组元素有序，真实路径）
  private pathsSet: Set<string> = new Set(); //记录根节点到当前节点的经过的每一个节点（优化循环判断）
  private resolvePaths: string[] = []; //记录根节点到当前节点每一个节点的绝对路径
  private codependency: Map<string, Node[]> = new Map(); //记录相同的节点
  private circularDependency: Set<Node> = new Set(); //记录存在循环引用的节点
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
        size: this.config.size,
      });
    const id = name + version;
    //直接返回缓存
    if (this.cache.has(id)) {
      const cacheNode = this.cache.get(id);
      //标记相同依赖
      cacheNode.cache = id;
      //相同依赖的副本（为了解决path字段cache不一致问题）
      const cloneCacheNode = this.cloneCache(
        this.cache.get(id),
        [...this.paths, name],
        [...this.paths, name],
      );
      //收集相同依赖
      if (this.codependency.has(id)) {
        this.codependency.get(id).push(cloneCacheNode);
      } else {
        this.codependency.set(id, [this.cache.get(id), cloneCacheNode]);
      }

      return cloneCacheNode;
    }
    //没有子依赖直接返回
    if (!dependencies) {
      return new GraphNode(name, version, {}, [...this.paths, name], {
        description,
        size,
      });
    }
    //循环依赖
    if (this.pathsSet.has(name)) {
      //直接截断返回循环依赖
      const circularNode = new GraphNode(
        name,
        version,
        {},
        [...this.paths, name],
        {
          description,
          circlePath: [...this.paths, name],
          size,
        },
      );
      this.circularDependency.add(circularNode);
      return circularNode;
    }
    //生成父节点（初始化一系列等下要用的变量）
    const children: Record<string, Node> = {};
    let totalSize = size;
    const curNode = new GraphNode(
      name,
      version,
      children,
      [...this.paths, name],
      {
        description,
      },
    );
    const dependenceEntries = Object.entries(dependencies);
    //加入当前依赖路径
    this.paths.push(name);
    //等循环依赖判断完成后再加入当前路径
    this.pathsSet.add(name);
    //加入当前节点的绝对路径
    this.resolvePaths.push(resolvePath);

    /*⬅️⬅️⬅️  递归子节点处理逻辑  ➡️➡️➡️*/

    for (let i = 0; i < dependenceEntries.length; i++) {
      //深度判断
      if (this.config.depth && this.paths.length == this.config.depth) {
        break;
      }
      // 将类型 [string, unknown] 转换为 [string, string]
      const [childName, childVersion] = dependenceEntries[i] as [
        string,
        string,
      ];
      //核心递归
      const child = await this.initGraph(childName);
      //添加实际声明的依赖
      // 如果 childVersion 以 $ 结尾，表明需要特殊处理
      let childVersionPure: string | undefined;
      if (childVersion.endsWith("$")) {
        const index = childVersion.indexOf("$");
        childVersionPure = childVersion.slice(index + 1, -1);
      }
      child.declarationVersion = childVersionPure || childVersion;
      //累加size
      totalSize += child.size;
      //子模块唯一id
      const childId = child.name + child.version;
      //缓存节点
      if (!child.circlePath) this.cache.set(childId, child!);
      //将子节点加入父节点（注意是children是引入类型，所以可以直接加）
      children[child.name] = child;
    }

    /*⬅️⬅️⬅️  后序处理逻辑  ➡️➡️➡️*/

    //删除当前依赖路径
    this.paths.pop();
    this.pathsSet.delete(name);
    //删除当前绝对路径
    this.resolvePaths.pop();
    //将当前节点的size设置为所有子节点的size之和
    curNode.size = totalSize;
    return curNode;
  }
  cloneCache(cache: Node, path: string[], cacheParentPath: string[]) {
    const clonedNode = { ...cache, path, cacheParentPath, dependencies: {} };
    Object.entries(cache.dependencies).forEach(([name, node]) => {
      clonedNode.dependencies[name] = this.cloneCache(
        node,
        [...path, name],
        cacheParentPath,
      );
    });
    return clonedNode;
  }
  async getGraph() {
    await this.ensureGraph();
    return this.graph;
  }
  async getCodependency() {
    await this.ensureGraph();
    return Object.fromEntries(this.codependency);
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
  public async ensureGraph() {
    if (!this.graph) {
      this.graph = await this.initGraph(this.info);
    }
  }
  private writeJson(
    result: Node[] | Node | Record<string, Node[]>,
    outDir: string,
  ) {
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
    public path: string[],
    otherFields: {
      description?: string;
      circlePath?: string[];
      size?: number;
    },
  ) {
    Object.entries(otherFields).forEach(([key, value]) => {
      if (value) this[key] = value;
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
