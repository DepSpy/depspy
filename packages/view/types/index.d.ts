declare module "virtual:graph-data" {
  interface Node {
    name: string;
    version: string;
    declarationVersion: string;
    description?: string;
    cache?: string;
    circlePath?: string[];
    dependencies: Record<string, Node>;
    size?: number;
  }
  const graph: {
    root?: Node;
    codependency?: Record<string, Node[]>;
    circleDependency?: Node[];
  };
  export { graph };
}
