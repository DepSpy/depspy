import {
  compose,
  MODULE_INFO_TYPE,
  reduceKey,
  toInfinity,
} from "@dep-spy/utils";
import { Config, Node } from "../type";
import * as fs from "fs";
import * as path from "path";
import pool, { TASK_TYPE } from "../pool";

const inBrowser = typeof window !== "undefined";

//TODO 做本地缓存（LRU 限制缓存数量，--clear 清空缓存）
export class Graph {
  private graph: Node; //整个图
  private cache: Map<string, Promise<[MODULE_INFO_TYPE, Error]>> = new Map(); //用来缓存计算过的节点(用promise的原因是避免重复的读文件操作占用线程)
  private coMap = new Map<string, Node>(); //记录所有节点的id,用于判断相同依赖(key 是声明的name和version)
  private codependency: Map<string, Node[]> = new Map(); //记录相同的节点
  private circularDependency: Set<Node> = new Set(); //记录存在循环引用的节点
  constructor(
    private readonly info: string,
    private readonly config: Config = {},
  ) {}
  //生成单个node节点（调用insertChildren去插入子节点）
  private async generateNode({
    moduleInfo,
    paths,
    realNamePath,
  }: {
    moduleInfo: MODULE_INFO_TYPE;
    paths: string[];
    realNamePath: string[];
  }): Promise<Node> {
    const {
      name,
      version,
      size,
      resolvePath,
      dependencies: dependenciesList = {}, //更名防止混淆
      description,
    } = moduleInfo;
    //循环依赖
    if (realNamePath.includes(name)) {
      //直接截断返回循环依赖
      const circularNode = new GraphNode({
        name,
        version,
        dependencies: {},
        dependenciesList: {}, //循环依赖不需要再加载子节点
        resolvePath,
        path: paths,
        realNamePath: [...realNamePath, name],
        childrenNumber: Infinity,
        description: description,
        circlePath: paths,
        size,
      });
      this.circularDependency.add(circularNode);
      return circularNode;
    }
    //生成父节点（初始化一系列等下要用的变量）
    const children: Record<string, Node> = {};
    const curNode = new GraphNode({
      name,
      version,
      dependencies: children,
      dependenciesList,
      resolvePath,
      path: paths,
      realNamePath: [...realNamePath, name],
      childrenNumber: 0,
      description,
      size,
    });
    //将子节点插入到当前节点上
    await this.insertChildren(curNode, dependenciesList);
    return curNode;
  }
  //相同依赖复制新的节点
  private cloneCache(cache: MODULE_INFO_TYPE, path: string[]) {
    return {
      ...cache,
      path,
    };
  }
  //获取root
  public async getGraph() {
    await this.ensureGraph();
    return this.graph;
  }
  //获取相同依赖
  public async getCodependency() {
    await this.ensureGraph();
    return Object.fromEntries(this.codependency);
  }
  //获取循环依赖
  public async getCircularDependency() {
    await this.ensureGraph();
    return Array.from(this.circularDependency);
  }
  //获取coMap
  public async getCoMap() {
    await this.ensureGraph();
    return Object.fromEntries(this.coMap);
  }
  //输出到文件
  async outputToFile() {
    await this.ensureGraph();
    const { graph, circularDependency, codependency } = this.config.output;
    if (graph) {
      this.writeJson(
        JSON.stringify(await this.getGraph(), compose([toInfinity])),
        graph,
      );
    }
    if (circularDependency) {
      this.writeJson(
        JSON.stringify(
          await this.getCircularDependency(),
          compose([toInfinity, reduceKey], {
            internalKeys: ["name", "version", "path", "circlePath"],
          }),
        ),
        circularDependency,
      );
    }
    if (codependency) {
      this.writeJson(
        JSON.stringify(
          await this.getCodependency(),
          compose([toInfinity, reduceKey], {
            internalKeys: ["name", "version", "path"],
          }),
        ),
        codependency,
      );
    }
  }
  //确保树已经被生成(开启root的构造)
  public async ensureGraph() {
    if (!this.graph) {
      const [rootModule, error] = await pool.addTask({
        type: TASK_TYPE.MODULE_INFO,
        params: { info: this.info, baseDir: inBrowser ? null : process.cwd() },
      }); //解析首个节点
      if (error) {
        throw error;
      }
      rootModule.size = 0;
      this.graph = await this.generateNode({
        moduleInfo: rootModule,
        paths: [rootModule.name],
        realNamePath: [],
      });
    }
  }
  //序列化
  private writeJson(result: string, outDir: string) {
    fs.writeFileSync(path.join(process.cwd(), outDir), result, {
      flag: "w",
    });
  }
  //根据新的深度来更新树（调用dfs）
  public async update(newDepth: number): Promise<void> {
    //确保已经有图
    await this.ensureGraph();
    //重置全局变量
    if (this.config.depth != newDepth) {
      this.coMap = new Map();
      this.codependency = new Map();
    }
    if (this.config.depth > newDepth) {
      this.config.depth = newDepth;
      //执行截断逻辑
      await this.dfs(this.graph, this.decreaseHandler.bind(this), () => void 0);
      return;
    } else if (this.config.depth < newDepth) {
      this.config.depth = newDepth;
      //执行加深递归逻辑
      await this.dfs(this.graph, this.increaseHandler.bind(this), () => void 0);
    }
  }
  //遍历
  private async dfs(
    node: Node,
    beforeHandler: (node: Node) => Promise<void> | true,
    afterHandler: (node: Node) => Promise<void>,
  ) {
    //纠正参数
    node.childrenNumber = node.childrenNumber === Infinity ? Infinity : 0;
    node.size = node.selfSize;
    const promises: Promise<void>[] = [];
    const handlerPromise = beforeHandler(node);
    if (handlerPromise === true) {
      const dependenceEntries = Object.entries(node.dependenciesList);
      for (const [childName, childVersion] of dependenceEntries) {
        const child = node.dependencies[childName];
        const id = childName + childVersion;

        // 到达底部
        if (!child) {
          continue;
        }

        //递归子节点
        const dfsPromise = this.dfs(child, beforeHandler, afterHandler).then(
          () => {
            //收集相同依赖
            this.addCodependency(child, id);
            //修成所有子节点数总和
            node.childrenNumber +=
              (child.childrenNumber === Infinity ? 0 : child.childrenNumber) +
              1; //child 子依赖数量 + 自身
            //修正size
            node.size += child.size;
          },
        );
        promises.push(dfsPromise);
      }
    } else {
      promises.push(handlerPromise);
    }
    //等到promises结束才能归
    await Promise.all(promises);
    await afterHandler(node);
  }
  //加深树的深度处理函数
  private increaseHandler(node: Node): Promise<void> | true {
    const dependenceEntries = Object.entries(node.dependencies);
    if (dependenceEntries.length === 0) {
      //到达最底层
      const { dependenciesList } = node;
      //继续插入子节点，直到到达深度
      return this.insertChildren(node, dependenciesList);
      //对于原本底层的节点来说，size和childrenNumber 皆是准确的，不需要修正
    }
    return true;
  }
  //减小树的深度处理函数，做截断
  private decreaseHandler(node: Node) {
    if (this.config.depth && this.config.depth == node.path.length) {
      //截断
      node.dependencies = {};
      return false;
    }
    return true;
  }
  //插入节点的子节点（调用generateNode 去生成子节点）
  private async insertChildren(
    curNode: Node,
    dependenciesList: Record<string, string>,
  ) {
    const { path: paths, resolvePath, realNamePath } = curNode;
    const dependenceEntries = Object.entries(dependenciesList);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < dependenceEntries.length; i++) {
      //深度判断
      if (this.config.depth && paths.length == this.config.depth) {
        break;
      }
      // 将类型 [string, unknown] 转换为 [string, string]
      const [childName, childVersion] = dependenceEntries[i] as [
        string,
        string,
      ];

      const id = childName + this.handleChildVersion(childVersion);
      //不再读文件，走缓存
      let generatePromise: Promise<Node>;
      if (this.cache.has(id)) {
        const [moduleInfo, error] = await this.cache.get(id);
        if (error) {
          console.error(error);
          continue;
        }
        //生成子节点
        generatePromise = this.generateNode({
          moduleInfo: moduleInfo,
          paths: [...paths, childName],
          realNamePath: realNamePath,
        });
      } else {
        const moduleInfoPromise = pool.addTask({
          type: TASK_TYPE.MODULE_INFO,
          params: { info: childName, baseDir: resolvePath },
        });
        //存入缓存
        this.cache.set(id, moduleInfoPromise);
        generatePromise = moduleInfoPromise.then(
          async ([childModuleInfo, error]) => {
            if (error) {
              console.error(error);
              return;
            }
            return await this.generateNode({
              moduleInfo: childModuleInfo,
              paths: [...paths, childName],
              realNamePath: realNamePath,
            });
          },
        );
      }
      const childPromise = generatePromise.then(async (child) => {
        /*⬅️⬅️⬅️  后序处理逻辑  ➡️➡️➡️*/
        //添加相同依赖
        this.addCodependency(child, id);
        child.declarationVersion = this.handleChildVersion(childVersion);
        //将子节点加入父节点（注意是children是引入类型，所以可以直接加）
        curNode.dependencies[childName] = child;
        //更新父节点子依赖数量
        curNode.childrenNumber +=
          (child.childrenNumber === Infinity ? 0 : child.childrenNumber) + 1; //child 子依赖数量 + 自身
        //累加size
        curNode.size += child.size;
      });
      promises.push(childPromise);
    }
    await Promise.all(promises); //等待所有子节点创造完毕再归
  }
  //判断是否为相同依赖，并添加到coMap
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
  //根据id来获取节点的信息，在序列化时根据depth参数做截断处理
  public async getNode(
    id: string,
    depth: number,
    path?: string[],
  ): Promise<Node[]> {
    let resultNode: Node;
    if (!id && !path) {
      //root节点
      resultNode = this.graph;
    } else {
      // 仅有id时
      if (id && !path) {
        resultNode = this.coMap.get(id);
      }
      // 有path时查询
      if (!resultNode && path) {
        resultNode = this.searchNodeByPath(path);
      }
    }
    // 没查找到结果
    if (!resultNode) {
      return null;
    }
    // 平铺展开内部结构
    const results: Node[] = [];

    await this.dfs(
      resultNode,
      (node) => {
        // depth不存在时
        if (!depth) {
          return true;
        }
        // depth存在时
        if (node.path.length < resultNode.path.length + depth - 1) {
          return true;
        }
        return Promise.resolve();
      },
      async (node) => {
        results.unshift(node);
      },
    );

    return results;
  }

  // 通过path来获取node
  private searchNodeByPath(path: string[]) {
    //首个pathName 可以省略
    return path.slice(1).reduce((node: Node, pathName: string) => {
      return node.dependencies[pathName];
    }, this.graph);
  }

  public getNodeByPath(name: string, path: string[]) {
    let ifTarget = !name;
    const results: Node[] = ifTarget ? [this.graph] : [];

    //首个pathName 可以省略
    path.slice(1).reduce((node: Node, pathName: string) => {
      const nextNode = node.dependencies?.[pathName];

      //遇到起点
      if (pathName.includes(name)) {
        ifTarget = true;
      }

      ifTarget && results.push(nextNode);

      if (!nextNode) {
        return node;
      }

      return nextNode;
    }, this.graph);

    return results;
  }

  //处理childVersion
  //添加实际声明的依赖
  // 如果 childVersion 以 $ 结尾，表明需要特殊处理
  private handleChildVersion(childVersion: string) {
    if (!childVersion) {
      return childVersion;
    }
    //需要特殊处理
    if (childVersion.endsWith("$")) {
      const index = childVersion.indexOf("$");
      return childVersion.slice(index + 1, -1);
    }

    return childVersion;
  }
}

class GraphNode implements Node {
  declarationVersion: string;
  size?: number;
  selfSize: number;
  description?: string;
  circlePath?: string[];
  public name: string;
  public version: string;
  public dependencies: Record<string, Node>;
  public dependenciesList: Record<string, string>; //用于记录当前节点的pack.json中记录的内容
  public resolvePath: string;
  public path: string[]; // 此处的包名来着父节点的package.json中的声明（记录根节点到该节点处的路径）
  public realNamePath: string[]; // 此处的包名来自实际安装的名字（用于判断是否出现循环依赖）
  public childrenNumber: number;
  constructor(property: {
    name: string;
    version: string;
    dependencies: Record<string, Node>;
    dependenciesList: Record<string, string>;
    resolvePath: string;
    path: string[];
    realNamePath: string[];
    childrenNumber: number;
    description?: string;
    circlePath?: string[];
    size?: number;
  }) {
    this.selfSize = property.size;
    Object.entries(property).forEach(([key, value]) => {
      if (value || value === 0) this[key] = value;
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
