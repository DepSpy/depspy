import * as fs from "fs";
import { getFileInfo } from "@dep-spy/utils";
import { Config, StaticNode } from "../type";
import path from "path";

export class StaticGraph {
  private graph: StaticNode;
  private resolvedPaths: string[] = [];
  private cache: Map<string, GraphNode> = new Map();
  private baseDirs: string[] = [];

  constructor(
    private readonly entry: string,
    private readonly config: Config = {},
  ) {
    this.resolvedPaths.push(process.cwd());
  }
  private initGraph(entry: string) {
    //文件id
    const id = entry + this.baseDirs.at(-1);
    //循环检测
    if (this.cache.has(id)) {
      return {
        ...this.cache.get(id),
        imports: [],
        export: [],
        dependencies: {},
      };
    }
    const { imports, path, resolvedPath, baseDir } = getFileInfo(
      entry || this.entry,
      this.baseDirs.at(-1),
    );

    const curNode = new GraphNode({
      path,
      resolvedPath,
      imports,
      exports: [],
      dependencies: {},
    });

    //baseDir+path可以唯一确定一个文件，resolvedPath也可以但是不用计算
    this.cache.set(id, curNode);
    this.resolvedPaths.push(resolvedPath);
    this.baseDirs.push(baseDir);

    for (const path of imports) {
      const childNode = this.initGraph(path);
      curNode.dependencies[path] = childNode;
    }

    this.cache.delete(id);
    this.resolvedPaths.pop();
    this.baseDirs.pop();
    return curNode;
  }
  async outputToFile() {
    await this.ensureGraph();
    const { staticGraph } = this.config.output;
    if (staticGraph) {
      this.writeJson(await this.getGraph(), staticGraph);
    }
  }
  private writeJson(
    result: StaticNode[] | StaticNode | Record<string, StaticNode[]>,
    outDir: string,
  ) {
    fs.writeFileSync(path.join(process.cwd(), outDir), JSON.stringify(result), {
      flag: "w",
    });
  }
  public getGraph() {
    this.ensureGraph();
    return this.graph;
  }
  public ensureGraph() {
    if (!this.graph) {
      this.graph = this.initGraph(this.entry);
    }
  }
}
class GraphNode implements StaticNode {
  path: string = "";
  resolvedPath: string = "";
  imports: string[] = [];
  exports: string[] = [];
  dependencies: Record<string, StaticNode> = {};
  constructor(fields: {
    path: string;
    resolvedPath: string;
    imports: string[];
    exports: string[];
    dependencies: Record<string, StaticNode>;
  }) {
    Object.entries(fields).forEach(([key, value]) => {
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
