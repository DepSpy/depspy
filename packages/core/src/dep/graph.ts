import {
  getModuleInfo,
  MODULE_CONFIG,
  MODULE_INFO_TYPE,
  Pool,
} from "@dep-spy/utils";
import { Config, Node } from "../type";
import * as fs from "fs";
import * as path from "path";

const inBrowser = typeof window !== "undefined";
export class Graph {
  private graph: Node; //整个图
  private cache: Map<string, Node> = new Map(); //用来缓存计算过的节点(id: 是父节点pack.json文件中声明的name和version)
  private paths: string[] = []; //记录根节点到当前节点的经过的每一个节点（数组元素有序，真实路径）
  private pathsSet: Set<string> = new Set(); //记录根节点到当前节点的经过的每一个节点（优化循环判断）
  private resolvePaths: string[] = []; //记录根节点到当前节点每一个节点的绝对路径
  private coMap = new Map<string, Node>(); //记录所有节点的id,用于判断相同依赖(coId: 是实际下载的包的name + version)
  private codependency: Map<string, Node[]> = new Map(); //记录相同的节点
  private circularDependency: Set<Node> = new Set(); //记录存在循环引用的节点
  constructor(
    private readonly info: string,
    private readonly config: Config = {},
    private readonly pool: Pool<[string, MODULE_CONFIG], MODULE_INFO_TYPE>,
  ) {
    if (!inBrowser) {
      this.resolvePaths.push(process.cwd());
    }
  }
  private async generateNode(moduleInfo: MODULE_INFO_TYPE) {
    const {
      name,
      version,
      size,
      resolvePath,
      dependencies: dependenciesList = {}, //更名防止混淆
      description,
    } = moduleInfo;
    //循环依赖
    if (this.pathsSet.has(name)) {
      //直接截断返回循环依赖
      const circularNode = new GraphNode(
        name,
        version,
        {},
        {}, //循环依赖不需要再加载子节点
        resolvePath,
        [...this.paths, name],
        Infinity,
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
    const curNode = new GraphNode(
      name,
      version,
      children,
      dependenciesList,
      resolvePath,
      [...this.paths, name],
      0,
      {
        description,
        size,
      },
    );
    const id = name + version;
    //压入
    this.in(curNode);
    //将子节点插入到当前节点上
    await this.insertChildren(curNode, dependenciesList);
    //收集相同依赖
    this.addCodependency(curNode, id);
    //弹出
    this.out(curNode);
    return curNode;
  }
  private cloneCache(cache: Node, path: string[]) {
    return {
      ...cache,
      path,
      dependencies: cache.dependenciesList,
      size: cache.selfSize,
    };
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
      const rootModule = await getModuleInfo(this.info); //解析首个节点
      this.graph = await this.generateNode(rootModule);
    }
  }
  private writeJson(
    result: Node[] | Node | Record<string, Node[]>,
    outDir: string,
  ) {
    fs.writeFileSync(
      path.join(process.cwd(), outDir),
      JSON.stringify(result, (key, value) => {
        //当为Infinity时需要特殊处理，否则会变成null
        if (key === "childrenNumber" && value === Infinity) {
          return "Infinity";
        }
        return value;
      }),
      {
        flag: "w",
      },
    );
  }
  public async update(newDepth: number): Promise<void> {
    //重置全局参数
    if (this.config.depth != newDepth) {
      this.paths.length = 0;
      this.resolvePaths.length = 0;
      this.coMap = new Map();
      this.codependency = new Map();
    }
    if (this.config.depth > newDepth) {
      this.config.depth = newDepth;
      //执行截断逻辑
      await this.dfs(this.graph, this.decreaseHandler.bind(this));
      return;
    } else {
      this.config.depth = newDepth;
      //执行加深递归逻辑
      await this.dfs(this.graph, this.increaseHandler.bind(this));
    }
  }
  public async size() {
    //在size = true 的情况下重构整个图（在当前状态下，仍然可以使用缓存）
    this.config.size = true;
    this.graph = null;
    await this.ensureGraph();
    this.config.size = false;
  }
  private async dfs(node: Node, handler: (node: Node) => Promise<boolean>) {
    const { name, version } = node;
    //压入
    this.in(node);
    const id = name + version;
    //纠正参数
    node.childrenNumber = node.childrenNumber === Infinity ? Infinity : 0;
    node.size = node.selfSize;

    if (await handler(node)) {
      const dependenceEntries = Object.entries(node.dependencies);
      for (const [, child] of dependenceEntries) {
        //递归子节点
        await this.dfs(child, handler);
        //修成所有子节点数总和
        node.childrenNumber +=
          (child.childrenNumber === Infinity ? 0 : child.childrenNumber) + 1; //child 子依赖数量 + 自身
        //修正size
        node.size += child.size;
      }
    }
    //收集相同依赖
    this.addCodependency(node, id);
    //弹出
    this.out(node);
  }
  private async increaseHandler(node: Node) {
    const dependenceEntries = Object.entries(node.dependencies);
    if (dependenceEntries.length === 0) {
      //到达最底层
      const { dependenciesList } = node;
      //继续插入子节点，直到到达深度
      await this.insertChildren(node, dependenciesList);
      //对于原本底层的节点来说，size和childrenNumber 皆是准确的，不需要修正
      return false;
    }
    return true;
  }
  private async decreaseHandler(node: Node) {
    if (this.config.depth && this.config.depth == this.paths.length) {
      //截断
      node.dependencies = {};
      return false;
    }
    return true;
  }
  private async insertChildren(
    curNode: Node,
    dependenciesList: Record<string, string>,
  ) {
    const dependenceEntries = Object.entries(dependenciesList);
    const poolDependenceEntries = [];
    const tempTaskPool = [];
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
      const id = childName + childVersion;
      //不再读文件，走缓存
      if (this.cache.has(id)) {
        const cloneChild = await this.generateNode(
          this.cloneCache(this.cache.get(id), [
            ...this.paths,
            childName,
          ]) as MODULE_INFO_TYPE,
        );
        curNode.dependencies[childName] = cloneChild;
        curNode.size += cloneChild.size;
        //更新父节点子依赖数量
        curNode.childrenNumber +=
          (cloneChild.childrenNumber === Infinity
            ? 0
            : cloneChild.childrenNumber) + 1; //child 子依赖数量 + 自身
      } else {
        //将任务推入临时任务队列（pool是一个全局变量，提前推入会导致队列混乱）
        tempTaskPool.push([
          childName,
          {
            baseDir: this.resolvePaths.slice(-1)[0], //指定解析的根目录
            size: this.config.size,
          },
        ]);
        poolDependenceEntries.push(dependenceEntries[i]);
      }
    }
    //将临时队列中的任务推入pool
    if (!inBrowser) {
      this.pool.addToTaskQueue(...tempTaskPool);
    }
    //TODO 在线上环境下，应该采用广度优先，增加多镜像站的方式来提高效率，且优化个别请求阻塞的情况（少使用全局变量）
    //线程池开始执行/promiseAll开始执行
    const childrenModelInfos = !inBrowser
      ? await this.pool.run()
      : await Promise.all(
          tempTaskPool.map(
            (taskParams) =>
              new Promise((resolve) => {
                getModuleInfo(...taskParams).then(
                  (moduleInfo: MODULE_INFO_TYPE) => {
                    resolve(moduleInfo);
                  },
                );
              }) as Promise<MODULE_INFO_TYPE>,
          ),
        );
    for (let index = 0; index < childrenModelInfos.length; index++) {
      const childModuleInfo = childrenModelInfos[index];
      if (!childModuleInfo) {
        //错误的结果不执行逻辑
        continue;
      }
      //开始递归
      /*⬅️⬅️⬅️  递归子节点处理逻辑  ➡️➡️➡️*/
      const child = await this.generateNode(childModuleInfo);
      /*⬅️⬅️⬅️  后序处理逻辑  ➡️➡️➡️*/
      const [childName, childVersion] = poolDependenceEntries[index];
      //添加实际声明的依赖
      // 如果 childVersion 以 $ 结尾，表明需要特殊处理
      let childVersionPure: string | undefined;
      if (childVersion.endsWith("$")) {
        const index = childVersion.indexOf("$");
        childVersionPure = childVersion.slice(index + 1, -1);
      }
      child.declarationVersion = childVersionPure || childVersion;
      //子模块唯一id
      const childId = childName + childVersion;
      //缓存节点（只存存在selfSize的节点）
      if (!child.circlePath && !this.cache.has(childId) && child.selfSize)
        this.cache.set(childId, child!);
      //将子节点加入父节点（注意是children是引入类型，所以可以直接加）
      curNode.dependencies[childName] = child;
      //更新父节点子依赖数量
      curNode.childrenNumber +=
        (child.childrenNumber === Infinity ? 0 : child.childrenNumber) + 1; //child 子依赖数量 + 自身
      //累加size
      curNode.size += child.size;
    }
  }
  private addCodependency(node: Node, id: string) {
    if (this.coMap.has(id)) {
      //标记相同依赖
      this.coMap.get(id).cache = id;
      if (this.codependency.has(id)) {
        this.codependency.get(id).push(node);
      } else {
        this.codependency.set(id, [this.coMap.get(id), node]);
      }
    } else {
      this.coMap.set(id, node);
    }
  }
  private in(node: Node) {
    const { name, resolvePath } = node;
    //加入当前依赖路径
    this.paths.push(name);
    //等循环依赖判断完成后再加入当前路径
    this.pathsSet.add(name);
    //加入当前节点的绝对路径
    this.resolvePaths.push(resolvePath);
  }
  private out(node: Node) {
    const { name } = node;
    //删除当前依赖路径
    this.paths.pop();
    this.pathsSet.delete(name);
    //删除当前绝对路径
    this.resolvePaths.pop();
  }
}

class GraphNode implements Node {
  declarationVersion: string;
  size?: number;
  selfSize: number;
  description?: string;
  circlePath?: string[];
  constructor(
    public name: string,
    public version: string,
    public dependencies: Record<string, Node>,
    public dependenciesList: Record<string, string>, //用于记录当前节点的pack.json中记录的内容
    public resolvePath: string,
    public path: string[],
    public childrenNumber: number,
    otherFields: {
      description?: string;
      circlePath?: string[];
      size?: number;
    },
  ) {
    this.selfSize = otherFields.size;
    this.size = otherFields.size; //初始化为自身的size大小
    Object.entries(otherFields).forEach(([key, value]) => {
      if (value) this[key] = value;
    });
    //拦截set，剔除无效属性
    return new Proxy(this, {
      set: function (target, property, value, receiver) {
        if (value || value === 0)
          return Reflect.set(target, property, value, receiver);
        return true;
      },
    });
  }
}
