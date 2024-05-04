import { getFileInfo } from "@dep-spy/utils";
import { Config, StaticNode } from "../type";

export class Graph {
  private resolvedPaths: string[] = [];
  private baseDirs: string[] = [];
  constructor(
    private readonly entry: string,
    private readonly config: Config = {},
  ) {
    this.resolvedPaths.push(process.cwd());
    this.initGraph(this.entry);
  }
  initGraph(entry: string) {
    const { imports, path, resolvedPath, baseDir } = getFileInfo(
      entry,
      this.baseDirs.at(-1),
    );
    const curNode = new GraphNode({
      path,
      resolvedPath,
      imports,
      exports: [],
      dependencies: {},
    });
    this.resolvedPaths.push(resolvedPath);
    this.baseDirs.push(baseDir);
    for (const path of imports) {
      const childNode = this.initGraph(path);
      curNode.dependencies[childNode.resolvedPath] = childNode;
    }
    this.resolvedPaths.pop();
    this.baseDirs.pop();
    return curNode;
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
