import { getModuleInfo } from "@dep-spy/utils";
import { Node, Config } from "./constant";
const inBrowser = typeof window !== "undefined";
export class Graph {
  private cache: Map<string, Node> = new Map();
  private paths: string[] = [];
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
      await getModuleInfo(info, {
        baseDir: this.resolvePaths.slice(-1)[0], //指定解析的根目录
        online: this.config.online,
        paths: [...this.paths],
      });
    const id = name + "!" + version;
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
    if (this.paths.includes(id)) {
      const circlePath = Array.from(this.paths.values());
      circlePath.push(id);
      return new GraphNode(
        name,
        version,
        {},
        { description, circlePath, size },
      );
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
      //核心递归
      const child = await this.initGraph(dependenceEntries[i].join("!"));
      //累加size
      totalSize += child.size;
      //子模块唯一id
      const childId = child.name + "!" + child.version;
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
    public dependencies: Record<string, Node>,
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
