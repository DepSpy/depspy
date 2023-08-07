declare module "virtual:graph-data" {
  interface node {
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
    root?: node;
    codependency?: node[];
    circularDependency?: node[];
  };
  export { graph };
}
